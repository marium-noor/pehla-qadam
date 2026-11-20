"use client";

import { useState } from "react";
import { futureValue } from "@/lib/plan";
import { useLang } from "./LangProvider";

export function money(lang: "en" | "ur", x: number): string {
  const n = Math.round(x).toLocaleString("en-US");
  return lang === "ur" ? `${n} روپے` : `PKR ${n}`;
}

export function Calculator({ initialMonthly }: { initialMonthly: number }) {
  const { t, lang } = useLang();
  const [monthly, setMonthly] = useState(initialMonthly);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(10);
  const [infl, setInfl] = useState(7);

  // Work in today's money: grow at the real rate, where real = (1 + nominal) / (1 + inflation) - 1.
  const real = (r: number) => (1 + r / 100) / (1 + infl / 100) - 1;
  const put = monthly * years * 12;
  const idle = futureValue(monthly, years, real(0));
  const grown = futureValue(monthly, years, real(rate));
  const max = Math.max(put, idle, grown, 1);

  const Row = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 text-mute">{label}</span>
        <span className="shrink-0 whitespace-nowrap text-xl font-semibold tabular-nums" dir="ltr">{money(lang, value)}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-mist"><div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} /></div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{t("calc.title")}</h2>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <label className="block">
            <span className="flex justify-between text-[15px]"><span>{t("calc.monthly")}</span><b dir="ltr">{monthly.toLocaleString("en-US")}</b></span>
            <input type="range" min={500} max={100000} step={500} value={monthly} onChange={(e) => setMonthly(+e.target.value)} />
          </label>
          <label className="block">
            <span className="flex justify-between text-[15px]"><span>{t("calc.years")}</span><b>{years}</b></span>
            <input type="range" min={1} max={20} step={1} value={years} onChange={(e) => setYears(+e.target.value)} />
          </label>
          <label className="block">
            <span className="flex justify-between text-[15px]"><span>{t("calc.rate")}</span><b dir="ltr">{rate}%</b></span>
            <input type="range" min={0} max={25} step={1} value={rate} onChange={(e) => setRate(+e.target.value)} />
          </label>
          <label className="block">
            <span className="flex justify-between text-[15px]"><span>{t("calc.inflation")}</span><b dir="ltr">{infl}%</b></span>
            <input type="range" min={0} max={25} step={1} value={infl} onChange={(e) => setInfl(+e.target.value)} />
          </label>
        </div>
        <div className="space-y-6">
          <Row label={t("calc.in")} value={put} tone="bg-line" />
          <Row label={t("calc.idle")} value={idle} tone="bg-mute" />
          <Row label={t("calc.grown")} value={grown} tone="bg-sabz" />
          <p className="text-sm text-mute">{t("calc.warn")}</p>
        </div>
      </div>
    </div>
  );
}
