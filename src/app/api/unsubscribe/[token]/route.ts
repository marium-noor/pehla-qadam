import { patchProfile, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const page = (msg: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pehla Qadam</title><body style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:480px;margin:20vh auto;padding:0 20px;color:#1d1d1f"><h1 style="font-size:24px">${msg}</h1><p style="color:#6e6e73">پہلا قدم</p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[a-f0-9]{48}$/.test(token) || !supabaseConfigured()) return page("This link is not valid.");
  try {
    await patchProfile(token, { paused: true });
    return page("You are unsubscribed. No more lesson emails will be sent.");
  } catch {
    return page("Something went wrong. Please try again.");
  }
}
