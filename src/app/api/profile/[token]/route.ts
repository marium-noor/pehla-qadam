import { NextResponse } from "next/server";
import { monthlySchema, routeSchema } from "@/lib/schema";
import { asPlanId } from "@/lib/pricing";
import { findByToken, patchProfile, supabaseConfigured, type ProfileRow } from "@/lib/supabase";

export const runtime = "nodejs";

const TOKEN = /^[a-f0-9]{48}$/;

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!TOKEN.test(token) || !supabaseConfigured()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const row = await findByToken(token);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({
      answers: row.answers,
      route: row.route ?? undefined,
      createdAt: new Date(row.created_at).getTime(),
      // For display only. The server re-reads the plan from the database every time it matters.
      plan: asPlanId(row.plan),
      planRequested: row.plan_requested,
      planRequestedAt: row.plan_requested_at,
    });
  } catch (e) {
    console.error("profile read failed", e);
    return NextResponse.json({ error: "server" }, { status: 502 });
  }
}

/** The client may change only two things: its chosen route and its monthly amount. Nothing else, and never its plan. */
export async function PATCH(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!TOKEN.test(token) || !supabaseConfigured()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { route?: unknown; monthly?: unknown };
  const route = body.route === undefined ? null : routeSchema.safeParse(body.route);
  const monthly = body.monthly === undefined ? null : monthlySchema.safeParse(body.monthly);
  if ((!route && !monthly) || (route && !route.success) || (monthly && !monthly.success)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const patch: Partial<ProfileRow> = {};
    if (route?.success) patch.route = route.data;
    if (monthly?.success) {
      const row = await findByToken(token);
      if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
      patch.answers = { ...(row.answers as Record<string, unknown>), monthly: monthly.data };
    }
    const row = await patchProfile(token, patch);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("profile patch failed", e);
    return NextResponse.json({ error: "server" }, { status: 502 });
  }
}
