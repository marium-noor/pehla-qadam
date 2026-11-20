import { NextResponse } from "next/server";
import { listActive, listPaid, patchProfile, supabaseConfigured } from "@/lib/supabase";
import { buildCheckinEmail, buildLessonEmail, emailConfigured, sendEmail } from "@/lib/email";
import { isCheckinDue } from "@/lib/limits";
import { asPlanId } from "@/lib/pricing";
import { answersSchema } from "@/lib/schema";
import type { Answers } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Runs daily (see vercel.json). Sends the next lesson to people whose chosen weekday is today in Pakistan,
 *  and the monthly plan check-in to Plus and Teams users who are due one. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!supabaseConfigured() || !emailConfigured()) return NextResponse.json({ skipped: "not_configured" });

  const now = Date.now();
  const pktWeekday = new Date(now + 5 * 60 * 60 * 1000).getUTCDay(); // Pakistan is UTC+5, no daylight saving
  const rows = await listActive();
  let sent = 0, failed = 0, skipped = 0;
  for (const row of rows.slice(0, 200)) {
    const lastMs = row.last_sent_at ? new Date(row.last_sent_at).getTime() : 0;
    const due = row.lesson_day === pktWeekday && now - lastMs >= 6 * 24 * 60 * 60 * 1000;
    if (!due) { skipped++; continue; }
    const parsed = answersSchema.safeParse(row.answers);
    if (!parsed.success) { skipped++; continue; }
    const ok = await sendEmail(row.email, buildLessonEmail({ answers: parsed.data as Answers, week: row.next_week, route: row.route ?? undefined, token: row.token }));
    if (ok) {
      await patchProfile(row.token, { next_week: row.next_week + 1, last_sent_at: new Date(now).toISOString() });
      sent++;
    } else failed++;
  }

  // Monthly plan check-in. Only Plus and Teams, never Free: listPaid filters in the database and isCheckinDue checks again.
  let checkins = 0, checkinsFailed = 0;
  for (const row of (await listPaid()).slice(0, 200)) {
    if (!isCheckinDue(asPlanId(row.plan), row.last_checkin_at, now)) continue;
    const parsed = answersSchema.safeParse(row.answers);
    if (!parsed.success) continue;
    const ok = await sendEmail(row.email, buildCheckinEmail({ answers: parsed.data as Answers, token: row.token, lang: row.lang }));
    if (ok) {
      await patchProfile(row.token, { last_checkin_at: new Date(now).toISOString() });
      checkins++;
    } else checkinsFailed++;
  }
  return NextResponse.json({ sent, failed, skipped, checkins, checkinsFailed });
}
