import { NextResponse } from "next/server";
import { chatSchema, TOKEN_RE } from "@/lib/schema";
import { allow, clientIp } from "@/lib/ratelimit";
import { systemPrompt } from "@/lib/knowledge";
import { refundChat, reserveChat, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

interface GeminiPart { text?: string }
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "off" }, { status: 503 });
  if (!allow(`chat:${clientIp(req)}`, 30, 10 * 60 * 1000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = chatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { messages, audio, lang, context, token } = parsed.data;

  // The plan always comes from the database, looked up by the profile token. Nothing the client says about its own plan is read.
  // No token, an unknown token, or no Supabase (demo mode) all count as Free. Their daily count is kept in the
  // browser only, so it is not enforced here; voice is still refused for them.
  const account = token && TOKEN_RE.test(token) && supabaseConfigured() ? token : null;
  let reservedDay: string | null = null;
  if (account) {
    try {
      // Voice is refused before anything is counted, so a refused voice message never uses up a free text message.
      const r = await reserveChat(account, Date.now(), Boolean(audio));
      if (!r.ok) {
        if (r.reason === "limit") return NextResponse.json({ error: "limit" }, { status: 429 });
        if (r.reason === "voice") return NextResponse.json({ error: "voice" }, { status: 403 });
        if (r.reason === "busy") return NextResponse.json({ error: "rate_limited" }, { status: 429 });
        if (audio) return NextResponse.json({ error: "voice" }, { status: 403 }); // unknown token: treated as Free
      } else reservedDay = r.day;
    } catch (e) {
      console.error("plan lookup failed", e);
      return NextResponse.json({ error: "server" }, { status: 502 });
    }
  } else if (audio) {
    return NextResponse.json({ error: "voice" }, { status: 403 });
  }
  const giveBack = () => (account && reservedDay ? refundChat(account, reservedDay).catch(() => null) : Promise.resolve());

  const contents = messages.map((m, i) => {
    const isLast = i === messages.length - 1;
    const parts: Record<string, unknown>[] = [];
    if (isLast && m.role === "user" && audio) {
      parts.push({ inlineData: { mimeType: audio.mime, data: audio.data } });
      parts.push({ text: m.text || "(voice message)" });
    } else parts.push({ text: m.text });
    return { role: m.role === "assistant" ? "model" : "user", parts };
  });

  const base = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  try {
    const res = await fetch(`${base}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(lang, context) }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      console.error("Gemini error", res.status, (await res.text()).slice(0, 300));
      await giveBack();
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    const data = (await res.json()) as GeminiResponse;
    let text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
    if (!text) { await giveBack(); return NextResponse.json({ error: "empty" }, { status: 502 }); }

    let heard: string | undefined;
    const m = text.match(/^HEARD:\s*([\s\S]*?)\n\s*\n([\s\S]*)$/);
    if (m) {
      heard = m[1].trim();
      text = m[2].trim();
    }
    return NextResponse.json({ reply: text, heard });
  } catch (e) {
    console.error("chat failed", e);
    await giveBack();
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
