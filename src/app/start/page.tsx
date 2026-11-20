"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { Choice, Field, MultiChoice, inputClass } from "@/components/fields";
import { useLang } from "@/components/LangProvider";
import * as O from "@/lib/options";
import { saveProfile } from "@/lib/store";
import { answersSchema } from "@/lib/schema";
import type { Answers } from "@/lib/types";
import type { Key } from "@/lib/i18n";

const TOTAL = 5;

type Draft = Omit<Answers, "ageRange" | "work" | "dependents" | "incomeBand" | "emergencyMonths" | "hasInterestDebt" | "knowledge" | "goal" | "horizon" | "risk" | "monthly"> & {
  ageRange: string; work: string; dependents: string; incomeBand: string; emergencyMonths: string; hasInterestDebt: string;
  knowledge: string; goal: string; horizon: string; risk: string; monthly: string;
};

const empty: Draft = {
  name: "", email: "", lang: "ur", city: "", ageRange: "", work: "", dependents: "", incomeBand: "", savesIn: [],
  emergencyMonths: "", hasInterestDebt: "", knowledge: "", goal: "", horizon: "", monthly: "", risk: "", lessonDay: 0,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Start() {
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [d, setD] = useState<Draft>({ ...empty, lang });
  const [errors, setErrors] = useState<Record<string, Key>>({});
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<Key | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Keep the lesson language in step with the page language until the person picks one on step 1.
  const touchedLang = useRef(false);
  useEffect(() => {
    if (!touchedLang.current) setD((x) => ({ ...x, lang }));
  }, [lang]);

  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => {
      if (!(k in e)) return e;
      const { [k as string]: _drop, ...rest } = e;
      return rest;
    });
  };

  const validate = (s: number): Record<string, Key> => {
    const e: Record<string, Key> = {};
    const req = (k: keyof Draft) => { if (!String(d[k] ?? "").trim()) e[k] = "err.required"; };
    if (s === 1) {
      req("name"); req("ageRange");
      if (!d.email.trim()) e.email = "err.required"; else if (!EMAIL_RE.test(d.email.trim())) e.email = "err.email";
    }
    if (s === 2) { req("work"); req("dependents"); }
    if (s === 3) { req("incomeBand"); req("emergencyMonths"); req("hasInterestDebt"); if (d.savesIn.length === 0) e.savesIn = "err.required"; }
    if (s === 4) {
      req("goal"); req("horizon"); req("knowledge");
      const m = Number(d.monthly.replace(/,/g, ""));
      if (!d.monthly.trim()) e.monthly = "err.required"; else if (!Number.isFinite(m) || m < 500) e.monthly = "err.monthly";
    }
    if (s === 5) { req("risk"); if (!consent) e.consent = "err.consent"; }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  };

  const finish = async () => {
    const e = validate(5);
    setErrors(e);
    if (Object.keys(e).length) return;
    const answers = answersSchema.safeParse({ ...d, monthly: Number(d.monthly.replace(/,/g, "")) });
    if (!answers.success) {
      // Earlier steps are validated, so this means a stale value. Send the person back to fix it.
      setStep(1);
      return;
    }
    setSaving(true);
    let token: string | undefined;
    let notice = "";
    try {
      const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: answers.data }) });
      if (res.ok) {
        const j = (await res.json()) as { token?: string | null; existing?: boolean };
        token = j.token ?? undefined;
        if (j.existing) notice = "?existing=1";
      } else setSaveNote("ob.saveFail");
    } catch {
      setSaveNote("ob.saveFail");
    }
    saveProfile({ answers: answers.data as Answers, token, done: [], createdAt: Date.now() });
    setLang(answers.data.lang);
    router.push(`/dashboard${notice}`);
  };

  const pct = useMemo(() => (step / TOTAL) * 100, [step]);
  const err = (k: string) => (errors[k] ? t(errors[k]) : undefined);

  return (
    <div className="mx-auto max-w-xl px-6 pb-24 pt-10 sm:pt-16">
      <div className="mb-10">
        <p className="text-sm text-mute">{t("ob.step", { n: step, total: TOTAL })}</p>
        <div className="mt-2 h-1 rounded-full bg-mist" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
          <div className="h-1 rounded-full bg-ink transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <form onSubmit={(ev) => { ev.preventDefault(); if (step < TOTAL) next(); else void finish(); }} noValidate>
        {step === 1 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight focus-visible:outline-none sm:text-4xl">{t("ob.s1.t")}</h1>
            <div className="mt-8 space-y-6">
              <Field label={t("ob.name")} htmlFor="name" error={err("name")}>
                <input id="name" className={inputClass} value={d.name} autoComplete="given-name" onChange={(e) => set("name", e.target.value)} maxLength={60} />
              </Field>
              <Field label={t("ob.email")} htmlFor="email" error={err("email")}>
                <input id="email" type="email" inputMode="email" dir="ltr" className={inputClass} value={d.email} autoComplete="email" onChange={(e) => set("email", e.target.value)} maxLength={120} />
              </Field>
              <Field label={t("ob.city")} htmlFor="city">
                <input id="city" className={inputClass} value={d.city} autoComplete="address-level2" onChange={(e) => set("city", e.target.value)} maxLength={60} />
              </Field>
              <Field label={t("ob.age")} error={err("ageRange")}>
                <Choice name="age" options={O.AGE} value={d.ageRange} onChange={(v) => set("ageRange", v)} columns={2} />
              </Field>
              <Field label={t("ob.lang")}>
                <Choice name="lang" options={[{ value: "ur", en: "اردو", ur: "اردو" }, { value: "en", en: "English", ur: "English" }]} value={d.lang}
                  onChange={(v) => { touchedLang.current = true; set("lang", v as "en" | "ur"); }} columns={2} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight focus-visible:outline-none sm:text-4xl">{t("ob.s2.t")}</h1>
            <div className="mt-8 space-y-8">
              <Field label={t("ob.work")} error={err("work")}>
                <Choice name="work" options={O.WORK} value={d.work} onChange={(v) => set("work", v)} columns={2} />
              </Field>
              <Field label={t("ob.dependents")} error={err("dependents")}>
                <Choice name="dep" options={O.DEPENDENTS} value={d.dependents} onChange={(v) => set("dependents", v)} columns={3} />
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight focus-visible:outline-none sm:text-4xl">{t("ob.s3.t")}</h1>
            <div className="mt-8 space-y-8">
              <Field label={t("ob.income")} error={err("incomeBand")}>
                <Choice name="inc" options={O.INCOME} value={d.incomeBand} onChange={(v) => set("incomeBand", v)} columns={2} />
              </Field>
              <Field label={t("ob.saves")} error={err("savesIn")}>
                <MultiChoice options={O.SAVES_IN} values={d.savesIn} onChange={(v) => set("savesIn", v)} />
              </Field>
              <Field label={t("ob.emergency")} error={err("emergencyMonths")}>
                <Choice name="em" options={O.EMERGENCY} value={d.emergencyMonths} onChange={(v) => set("emergencyMonths", v)} columns={2} />
              </Field>
              <Field label={t("ob.debt")} error={err("hasInterestDebt")}>
                <Choice name="debt" options={O.DEBT} value={d.hasInterestDebt} onChange={(v) => set("hasInterestDebt", v)} columns={2} />
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight focus-visible:outline-none sm:text-4xl">{t("ob.s4.t")}</h1>
            <div className="mt-8 space-y-8">
              <Field label={t("ob.goal")} error={err("goal")}>
                <Choice name="goal" options={O.GOAL} value={d.goal} onChange={(v) => set("goal", v)} columns={2} />
              </Field>
              <Field label={t("ob.horizon")} error={err("horizon")}>
                <Choice name="hor" options={O.HORIZON} value={d.horizon} onChange={(v) => set("horizon", v)} columns={2} />
              </Field>
              <Field label={t("ob.monthly")} htmlFor="monthly" error={err("monthly")}>
                <input id="monthly" inputMode="numeric" dir="ltr" className={inputClass} value={d.monthly}
                  onChange={(e) => set("monthly", e.target.value.replace(/[^\d,]/g, ""))} placeholder="5,000" maxLength={10} />
                <div className="flex flex-wrap gap-2 pt-1">
                  {O.QUICK_AMOUNTS.map((a) => (
                    <button key={a} type="button" onClick={() => set("monthly", a.toLocaleString("en-US"))}
                      className="rounded-full border border-line px-4 py-1.5 text-sm hover:bg-mist">{a.toLocaleString("en-US")}</button>
                  ))}
                </div>
              </Field>
              <Field label={t("ob.knowledge")} error={err("knowledge")}>
                <Choice name="kn" options={O.KNOWLEDGE} value={d.knowledge} onChange={(v) => set("knowledge", v)} columns={3} />
              </Field>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight focus-visible:outline-none sm:text-4xl">{t("ob.s5.t")}</h1>
            <div className="mt-8 space-y-8">
              <Field label={t("ob.risk")} error={err("risk")}>
                <Choice name="risk" options={O.RISK} value={d.risk} onChange={(v) => set("risk", v)} />
              </Field>
              <Field label={t("ob.day")}>
                <Choice name="day" options={O.DAYS} value={String(d.lessonDay)} onChange={(v) => set("lessonDay", Number(v))} columns={3} />
              </Field>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-start gap-3 text-[16px]">
                  <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((x) => { const { consent: _c, ...r } = x; return r; }); }} className="mt-2 size-4 accent-[var(--color-sabz)]" />
                  <span>{t("ob.consent")}</span>
                </label>
                {errors.consent ? <p role="alert" className="text-sm text-warn">{t(errors.consent)}</p> : null}
              </div>
            </div>
          </>
        )}

        {saveNote ? <p role="status" className="mt-6 text-sm text-mute">{t(saveNote)}</p> : null}

        <div className="mt-12 flex items-center justify-between">
          {step > 1 ? <Button variant="quiet" onClick={() => setStep((s) => s - 1)}>{t("ob.back")}</Button> : <span />}
          <Button type="submit" disabled={saving}>{saving ? t("ob.saving") : step < TOTAL ? t("ob.next") : t("ob.finish")}</Button>
        </div>
      </form>
    </div>
  );
}
