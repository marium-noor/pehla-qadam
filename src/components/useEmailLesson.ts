"use client";

import { useState } from "react";
import type { Key } from "@/lib/i18n";

export function useEmailLesson(token: string | undefined) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "demo" | "fail">("idle");
  const send = async (week: number) => {
    if (!token) { setState("demo"); return; }
    setState("sending");
    try {
      const res = await fetch("/api/email/lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, week }) });
      const j = (await res.json()) as { sent: boolean; reason?: string };
      setState(j.sent ? "sent" : j.reason === "not_configured" ? "demo" : "fail");
    } catch {
      setState("fail");
    }
  };
  const key: Key | null = state === "demo" ? "dash.emailDemo" : state === "fail" ? "dash.emailFail" : null;
  return { state, send, key };
}
