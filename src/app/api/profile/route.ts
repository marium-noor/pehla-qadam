import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { answersSchema } from "@/lib/schema";
import { allow, clientIp } from "@/lib/ratelimit";
import { findByEmail, insertProfile, patchProfile, supabaseConfigured } from "@/lib/supabase";
import { buildLessonEmail, emailConfigured, sendEmail } from "@/lib/email";
import type { Answers } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!allow(`profile:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = answersSchema.safeParse((body as { answers?: unknown })?.answers);
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const answers = parsed.data as Answers;

  if (!supabaseConfigured()) {
    // Demo mode: nothing is stored on the server and no email is sent.
    return NextResponse.json({ mode: "demo", emailSent: false });
  }

  try {
    const existing = await findByEmail(answers.email);
    let token: string;
    let returnToken: string | null;
    let nextWeek = 1;
    let lastSent: string | null = null;
    if (existing) {
      // Never hand an existing account's token to whoever typed the email. The owner gets a link by email.
      token = existing.token;
      returnToken = null;
      nextWeek = existing.next_week;
      lastSent = existing.last_sent_at;
      await patchProfile(token, { name: answers.name, lang: answers.lang, lesson_day: answers.lessonDay, answers });
    } else {
      token = randomBytes(24).toString("hex");
      returnToken = token;
      await insertProfile({
        token, email: answers.email, name: answers.name, lang: answers.lang, lesson_day: answers.lessonDay,
        answers, route: null, next_week: 1, last_sent_at: null, paused: false,
      });
    }

    let emailSent = false;
    const recentlySent = lastSent && Date.now() - new Date(lastSent).getTime() < 24 * 60 * 60 * 1000;
    if (emailConfigured() && !recentlySent) {
      const week = Math.min(nextWeek, 6);
      emailSent = await sendEmail(answers.email, buildLessonEmail({ answers, week, token }));
      if (emailSent && !existing) await patchProfile(token, { next_week: 2, last_sent_at: new Date().toISOString() });
      else if (emailSent) await patchProfile(token, { last_sent_at: new Date().toISOString() });
    }
    return NextResponse.json({ mode: "live", token: returnToken, existing: Boolean(existing), emailSent });
  } catch (e) {
    console.error("profile create failed", e);
    return NextResponse.json({ error: "server" }, { status: 502 });
  }
}
