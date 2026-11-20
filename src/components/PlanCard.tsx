"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui";
import { useLang } from "./LangProvider";
import { usePlan } from "./usePlan";
import { PRICING, isPaidPlan } from "@/lib/pricing";
import type { Key } from "@/lib/i18n";

type Send = "idle" | "sending" | "fail";

/** Shows the plan the server has on record and, for Free users, a button to ask for Plus. No payment happens here. */
export function PlanCard({ token }: { token: string | undefined }) {
  const { t, lang } = useLang();
  const { info, loading, refresh } = usePlan(token);
  const [send, setSend] = useState<Send>("idle");

  async function request() {
    if (!token) return;
    setSend("sending");
    try {
      const res = await fetch("/api/plan/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, plan: "plus" }),
      });
      if (!res.ok && res.status !== 409) throw new Error("bad");
      await refresh();
      setSend("idle");
    } catch {
      setSend("fail");
    }
  }

  const plan = info?.plan ?? "free";
  const paid = isPaidPlan(plan);
  const requestedOn = info?.planRequestedAt
    ? new Date(info.planRequestedAt).toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "short" })
    : null;

  return (
    <section id="plan" className="mt-12 border-t border-line pt-10">
      <h2 className="text-2xl font-semibold tracking-tight">{t("plan.title")}</h2>
      <div className="mt-6 rounded-2xl border border-line p-6">
        <p className="text-2xl font-semibold">{t(`price.${plan}` as Key)}</p>
        <p className="mt-1 text-mute">{paid ? t("plan.paid.d") : t("plan.free.d", { n: PRICING.free.chatPerDay })}</p>

        {!token ? (
          <p className="mt-5 text-sm text-mute">{t("plan.demo")}</p>
        ) : loading ? null : !paid && (
          <div className="mt-5">
            {info?.planRequested === "plus" && requestedOn ? (
              <p role="status" className="rounded-xl bg-sabz-soft px-4 py-3 text-[16px]">{t("plan.requested", { date: requestedOn })}</p>
            ) : (
              <Button onClick={() => void request()} disabled={send === "sending"}>
                {send === "sending" ? t("plan.sending") : t("plan.request")}
              </Button>
            )}
            {send === "fail" && <p role="alert" className="mt-3 text-sm text-warn">{t("plan.fail")}</p>}
          </div>
        )}
        <p className="mt-5 text-sm"><Link href="/pricing" className="text-sabz hover:underline">{t("plan.seePricing")}</Link></p>
      </div>
    </section>
  );
}
