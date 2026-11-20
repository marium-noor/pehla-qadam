"use client";

import type { ReactNode } from "react";
import type { Opt } from "@/lib/options";
import { useLang } from "./LangProvider";

export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-[17px] font-medium">{label}</label>
      {children}
      {error ? <p role="alert" className="text-sm text-warn">{error}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[17px] outline-none transition-colors focus:border-sabz";

/** Single choice. Radio inputs underneath, so keyboard and screen readers work without extra code. */
export function Choice({ name, options, value, onChange, columns = 1 }: {
  name: string; options: Opt[]; value: string; onChange: (v: string) => void; columns?: 1 | 2 | 3;
}) {
  const { lang } = useLang();
  const grid = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <div role="radiogroup" className={`grid gap-2 ${grid}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label key={o.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[17px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sabz ${on ? "border-sabz bg-sabz-soft" : "border-line hover:bg-mist"}`}>
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="size-4 accent-[var(--color-sabz)]" />
            <span>{o[lang]}</span>
          </label>
        );
      })}
    </div>
  );
}

export function MultiChoice({ options, values, onChange }: { options: Opt[]; values: string[]; onChange: (v: string[]) => void }) {
  const { lang } = useLang();
  const toggle = (v: string) => {
    if (v === "none") return onChange(values.includes("none") ? [] : ["none"]);
    const next = values.filter((x) => x !== "none");
    onChange(next.includes(v) ? next.filter((x) => x !== v) : [...next, v]);
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <label key={o.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[17px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sabz ${on ? "border-sabz bg-sabz-soft" : "border-line hover:bg-mist"}`}>
            <input type="checkbox" checked={on} onChange={() => toggle(o.value)} className="size-4 accent-[var(--color-sabz)]" />
            <span>{o[lang]}</span>
          </label>
        );
      })}
    </div>
  );
}
