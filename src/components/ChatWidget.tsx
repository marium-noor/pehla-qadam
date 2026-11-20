"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";
import { loadChatUsage, loadProfile, saveChatUsage } from "@/lib/store";
import { consumeChat, type ChatUsage } from "@/lib/limits";
import { PRICING } from "@/lib/pricing";
import { computePlan } from "@/lib/plan";
import { blobToWavBase64 } from "@/lib/audio";
import type { Key } from "@/lib/i18n";

interface Msg { role: "user" | "assistant"; text: string; voice?: boolean }

const MAX_RECORD_MS = 60_000;

export function ChatWidget() {
  const { t, lang } = useLang();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [note, setNote] = useState<Key | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ rec: MediaRecorder; chunks: Blob[]; stream: MediaStream; timer: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const check = () => setCanSpeak(speechSynthesis.getVoices().length > 0);
    check();
    speechSynthesis.addEventListener?.("voiceschanged", check);
    return () => speechSynthesis.removeEventListener?.("voiceschanged", check);
  }, []);

  useEffect(() => () => stopStream(), []);

  function stopStream() {
    const r = recRef.current;
    if (!r) return;
    window.clearTimeout(r.timer);
    r.stream.getTracks().forEach((tr) => tr.stop());
  }

  if (path === "/start") return null;

  const context = () => {
    const p = loadProfile();
    if (!p) return undefined;
    const plan = computePlan(p.answers);
    return { route: p.route, monthly: p.answers.monthly, goal: p.answers.goal, riskStyle: plan.riskStyle };
  };

  async function ask(text: string, audio?: { mime: string; data: string }) {
    // Without a saved profile there is no account to look up, so this is Free: no voice, and the daily
    // count is kept in this browser only. With a profile, the server looks up the plan and counts.
    const token = loadProfile()?.token;
    let localUsage: ChatUsage | null = null;
    if (!token) {
      if (audio) { setNote("chat.voicePlus"); return; }
      const d = consumeChat("free", loadChatUsage(), Date.now());
      if (!d.allowed) { setNote("chat.limit"); return; }
      localUsage = d.usage;
    }
    const history: Msg[] = [...msgs, { role: "user", text: text || "", voice: Boolean(audio) }];
    setMsgs(history);
    setInput("");
    setNote(null);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          token,
          messages: history.slice(-10).map((m) => ({ role: m.role, text: m.text || (m.voice ? "(voice message)" : "") })),
          audio,
          context: context(),
        }),
      });
      if (res.status === 503) { setNote("chat.off"); return; }
      if (res.status === 429 || res.status === 403) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        if (err?.error === "limit" || err?.error === "voice") {
          // Not sent: take the question back out of the thread and put the text back in the box.
          setMsgs(msgs);
          setInput(text);
          setNote(err.error === "limit" ? "chat.limit" : "chat.voicePlus");
          return;
        }
      }
      if (!res.ok) { setNote("chat.err"); return; }
      const j = (await res.json()) as { reply: string; heard?: string };
      if (localUsage) saveChatUsage(localUsage);
      setMsgs((cur) => {
        const copy = [...cur];
        if (j.heard) {
          // Show what the assistant heard, so a mis-heard voice message is easy to spot and correct.
          for (let i = copy.length - 1; i >= 0; i--) if (copy[i].role === "user") { copy[i] = { ...copy[i], text: j.heard }; break; }
        }
        return [...copy, { role: "assistant", text: j.reply }];
      });
    } catch {
      setNote("chat.err");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecord() {
    if (recording) {
      recRef.current?.rec.stop();
      return;
    }
    if (!loadProfile()?.token) { setNote("chat.voicePlus"); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setNote("chat.micDenied"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = async () => {
        stopStream();
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1500) return;
        try {
          const data = await blobToWavBase64(blob);
          await ask("", { mime: "audio/wav", data });
        } catch {
          setNote("chat.err");
        }
      };
      const timer = window.setTimeout(() => rec.state === "recording" && rec.stop(), MAX_RECORD_MS);
      recRef.current = { rec, chunks, stream, timer };
      rec.start();
      setRecording(true);
      setNote(null);
    } catch {
      setNote("chat.micDenied");
    }
  }

  function speak(text: string) {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const isUrdu = /[؀-ۿ]/.test(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = isUrdu ? "ur-PK" : "en-US";
    const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(isUrdu ? "ur" : "en"));
    if (isUrdu && !voice) { setNote("chat.err"); return; }
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  const suggestions: Key[] = ["chat.s1", "chat.s2", "chat.s3"];

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)}
          className="fixed bottom-5 end-5 z-40 rounded-full bg-ink px-5 py-3 text-base font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-black">
          {t("chat.open")}
        </button>
      )}
      {open && (
        <section role="dialog" aria-label={t("chat.title")}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[78dvh] flex-col border border-line bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:inset-x-auto sm:bottom-5 sm:end-5 sm:h-[600px] sm:w-[400px] sm:rounded-2xl">
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-base font-semibold">{t("chat.title")}</h2>
            <button type="button" onClick={() => { speechSynthesis?.cancel?.(); setOpen(false); }} className="text-sm text-mute hover:text-ink">{t("chat.close")}</button>
          </header>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
            {msgs.length === 0 && (
              <div className="space-y-2">
                {suggestions.map((k) => (
                  <button key={k} type="button" onClick={() => void ask(t(k))}
                    className="block w-full rounded-xl border border-line px-4 py-3 text-start text-[16px] hover:bg-mist">{t(k)}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[16px] ${m.role === "user" ? "bg-ink text-white" : "border border-line bg-white"}`}>
                  {m.role === "user" && m.voice && !m.text ? "…" : m.text}
                  {m.role === "assistant" && canSpeak && (
                    <button type="button" onClick={() => speak(m.text)} className="mt-1 block text-sm text-sabz hover:underline">{t("chat.listen")}</button>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="text-sm text-mute">{t("chat.thinking")}</p>}
            {note && (
              <p role="alert" className="text-sm text-warn">
                {t(note, { n: PRICING.free.chatPerDay })}
                {(note === "chat.limit" || note === "chat.voicePlus") && (
                  <> <Link href="/pricing" onClick={() => setOpen(false)} className="font-medium text-sabz hover:underline">{t("plan.seePricing")}</Link></>
                )}
              </p>
            )}
          </div>
          <div className="border-t border-line px-4 pb-4 pt-3">
            {recording && <p className="mb-2 text-sm text-sabz">{t("chat.recording")}</p>}
            <form onSubmit={(e) => { e.preventDefault(); const v = input.trim(); if (v && !busy) void ask(v); }} className="flex items-center gap-2">
              <button type="button" onClick={() => void toggleRecord()} aria-label={t("chat.mic")} aria-pressed={recording} disabled={busy}
                className={`flex size-11 shrink-0 items-center justify-center rounded-full border ${recording ? "border-warn bg-warn text-white" : "border-line text-ink hover:bg-mist"} disabled:opacity-50`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {recording ? <rect x="6" y="6" width="12" height="12" rx="2" /> : (<><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>)}
                </svg>
              </button>
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("chat.placeholder")} maxLength={1000}
                className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-[16px] outline-none focus:border-sabz" />
              <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-ink px-4 py-2.5 text-[15px] text-white disabled:opacity-40">{t("chat.send")}</button>
            </form>
            <p className="mt-2 text-xs text-mute">{t("chat.hint")}</p>
          </div>
        </section>
      )}
    </>
  );
}
