"use client";

import { useState } from "react";
import { useLang } from "./LangProvider";
import { money } from "./Calculator";

/** The "Each month" figure with an inline way to change it. Saved in the browser and, if signed in, on the server. */
export function MonthlyEditor({ value, onSave }: { value: number; onSave: (n: number) => void }) {
  const { t, lang } = useLang();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [bad, setBad] = useState(false);

  if (!editing) {
    return (
      <>
        <dd className="mt-1 text-2xl font-semibold" dir="ltr">{money(lang, value)}</dd>
        <button type="button" className="mt-1 text-sm text-sabz hover:underline" onClick={() => { setText(String(value)); setBad(false); setEditing(true); }}>
          {t("dash.monthly.edit")}
        </button>
      </>
    );
  }

  const save = () => {
    const n = Number(text.replace(/[^\d]/g, ""));
    if (!Number.isInteger(n) || n < 500 || n > 10_000_000) { setBad(true); return; }
    onSave(n);
    setEditing(false);
  };

  return (
    <dd className="mt-1">
      <input
        value={text} onChange={(e) => { setText(e.target.value); setBad(false); }} inputMode="numeric" maxLength={10} dir="ltr" autoFocus
        aria-invalid={bad} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="w-full rounded-xl border border-line px-3 py-2 text-lg outline-none focus:border-sabz"
      />
      {bad && <p role="alert" className="mt-1 text-sm text-warn">{t("err.monthly")}</p>}
      <span className="mt-2 flex gap-4 text-sm">
        <button type="button" className="text-sabz hover:underline" onClick={save}>{t("dash.monthly.save")}</button>
        <button type="button" className="text-mute hover:text-ink" onClick={() => setEditing(false)}>{t("dash.monthly.cancel")}</button>
      </span>
    </dd>
  );
}
