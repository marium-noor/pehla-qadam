import { canUseVoice, consumeChat } from "./limits";
import { asPlanId, type PlanId } from "./pricing";

// Minimal PostgREST client. Uses the service role key, so it must only ever run on the server.
export const supabaseConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export interface ProfileRow {
  id: string;
  token: string;
  email: string;
  name: string;
  lang: "en" | "ur";
  lesson_day: number;
  answers: unknown;
  route: "fund" | "bank" | "gold" | null;
  next_week: number;
  last_sent_at: string | null;
  paused: boolean;
  created_at: string;
  plan: PlanId;
  plan_requested: string | null;
  plan_requested_at: string | null;
  chat_day: string | null;
  chat_count: number;
  last_checkin_at: string | null;
}

/** Columns with a database default, so a new row does not have to set them. */
type ServerManaged = "id" | "created_at" | "plan" | "plan_requested" | "plan_requested_at" | "chat_day" | "chat_count" | "last_checkin_at";

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const q = encodeURIComponent;

export async function findByEmail(email: string): Promise<ProfileRow | null> {
  const rows = await rest<ProfileRow[]>(`profiles?email=eq.${q(email)}&limit=1`);
  return rows[0] ?? null;
}

export async function findByToken(token: string): Promise<ProfileRow | null> {
  const rows = await rest<ProfileRow[]>(`profiles?token=eq.${q(token)}&limit=1`);
  return rows[0] ?? null;
}

export async function insertProfile(row: Omit<ProfileRow, ServerManaged>): Promise<ProfileRow> {
  const rows = await rest<ProfileRow[]>("profiles", { method: "POST", body: JSON.stringify(row) });
  return rows[0];
}

export async function patchProfile(token: string, patch: Partial<ProfileRow>): Promise<ProfileRow | null> {
  const rows = await rest<ProfileRow[]>(`profiles?token=eq.${q(token)}`, { method: "PATCH", body: JSON.stringify(patch) });
  return rows[0] ?? null;
}

export async function listActive(): Promise<ProfileRow[]> {
  return rest<ProfileRow[]>("profiles?paused=eq.false&next_week=lte.6&limit=1000");
}

/** Paid users who have not unsubscribed. Whether a check-in is due is decided in limits.ts. */
export async function listPaid(): Promise<ProfileRow[]> {
  return rest<ProfileRow[]>("profiles?paused=eq.false&plan=in.(plus,teams)&limit=1000");
}

export type ChatReservation =
  | { ok: true; plan: PlanId; day: string | null }
  | { ok: false; reason: "limit" | "voice" | "busy" | "not_found"; plan: PlanId };

/**
 * Counts one chat message for a free user, or lets a paid user through. The plan always comes from the row.
 * The update only applies if the stored day and count are still what we read, so two parallel requests
 * cannot both take the last free message. Under heavy contention it fails closed ("busy").
 */
export async function reserveChat(token: string, now: number, wantsVoice = false): Promise<ChatReservation> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await findByToken(token);
    if (!row) return { ok: false, reason: "not_found", plan: "free" };
    const plan = asPlanId(row.plan);
    if (wantsVoice && !canUseVoice(plan)) return { ok: false, reason: "voice", plan };
    const count = row.chat_count ?? 0;
    const decision = consumeChat(plan, { day: row.chat_day, count }, now);
    if (!decision.allowed) return { ok: false, reason: "limit", plan };
    if (decision.remaining === null) return { ok: true, plan, day: null };
    const dayFilter = row.chat_day ? `chat_day=eq.${q(row.chat_day)}` : "chat_day=is.null";
    const rows = await rest<ProfileRow[]>(`profiles?token=eq.${q(token)}&${dayFilter}&chat_count=eq.${count}`, {
      method: "PATCH",
      body: JSON.stringify({ chat_day: decision.usage.day, chat_count: decision.usage.count }),
    });
    if (rows.length) return { ok: true, plan, day: decision.usage.day };
  }
  return { ok: false, reason: "busy", plan: "free" };
}

/** Gives a counted message back when the AI provider failed, so an outage does not use up someone's day. Best effort. */
export async function refundChat(token: string, day: string): Promise<void> {
  const row = await findByToken(token);
  if (!row || row.chat_day !== day || row.chat_count <= 0) return;
  await rest(`profiles?token=eq.${q(token)}&chat_day=eq.${q(day)}&chat_count=eq.${row.chat_count}`, {
    method: "PATCH",
    body: JSON.stringify({ chat_count: row.chat_count - 1 }),
  });
}
