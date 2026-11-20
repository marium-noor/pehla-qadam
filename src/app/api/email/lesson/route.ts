import { NextResponse } from "next/server";
import { z } from "zod";
import { allow } from "@/lib/ratelimit";
import { findByToken, supabaseConfigured } from "@/lib/supabase";
import { buildLessonEmail, emailConfigured, sendEmail } from "@/lib/email";
import { answersSchema } from "@/lib/schema";
import type { Answers } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/), week: z.number().int().min(1).max(6) });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ sent: false, reason: "invalid" }, { status: 400 });
  const { token, week } = parsed.data;
  if (!supabaseConfigured() || !emailConfigured()) return NextResponse.json({ sent: false, reason: "not_configured" });
  if (!allow(`lesson:${token}`, 5, 60 * 60 * 1000)) return NextResponse.json({ sent: false, reason: "rate_limited" }, { status: 429 });
  try {
    const row = await findByToken(token);
    if (!row) return NextResponse.json({ sent: false, reason: "not_found" }, { status: 404 });
    const answers = answersSchema.parse(row.answers) as Answers;
    const sent = await sendEmail(row.email, buildLessonEmail({ answers, week, route: row.route ?? undefined, token }));
    return NextResponse.json({ sent });
  } catch (e) {
    console.error("lesson email failed", e);
    return NextResponse.json({ sent: false, reason: "server" }, { status: 502 });
  }
}
