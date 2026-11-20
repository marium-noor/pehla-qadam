import { NextResponse } from "next/server";
import { planRequestSchema } from "@/lib/schema";
import { allow, clientIp } from "@/lib/ratelimit";
import { findByToken, patchProfile, supabaseConfigured } from "@/lib/supabase";
import { buildPlanNotifyEmail, buildPlanRequestEmail, emailConfigured, sendEmail } from "@/lib/email";
import { asPlanId, isPaidPlan } from "@/lib/pricing";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;

/** Someone asks for Plus. No payment happens here: we save the request, tell the owner, and confirm to the user. */
export async function POST(req: Request) {
  const parsed = planRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { token, plan } = parsed.data;

  if (!supabaseConfigured()) return NextResponse.json({ error: "off" }, { status: 503 });
  if (!allow(`planreq-ip:${clientIp(req)}`, 10, 60 * 60 * 1000) || !allow(`planreq:${token}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const row = await findByToken(token);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (isPaidPlan(asPlanId(row.plan))) return NextResponse.json({ error: "already" }, { status: 409 });

    // Asking twice within a day saves nothing new and sends no more emails.
    const last = row.plan_requested_at ? new Date(row.plan_requested_at).getTime() : 0;
    if (row.plan_requested === plan && Date.now() - last < DAY) {
      return NextResponse.json({ ok: true, requestedAt: row.plan_requested_at, repeat: true });
    }

    const requestedAt = new Date().toISOString();
    await patchProfile(token, { plan_requested: plan, plan_requested_at: requestedAt });

    let notified = false;
    let confirmed = false;
    if (emailConfigured()) {
      const owner = process.env.NOTIFY_EMAIL;
      if (owner) notified = await sendEmail(owner, buildPlanNotifyEmail({ name: row.name, email: row.email, lang: row.lang, plan }));
      confirmed = await sendEmail(row.email, buildPlanRequestEmail({ name: row.name, lang: row.lang, token }));
    }
    return NextResponse.json({ ok: true, requestedAt, notified, confirmed });
  } catch (e) {
    console.error("plan request failed", e);
    return NextResponse.json({ error: "server" }, { status: 502 });
  }
}
