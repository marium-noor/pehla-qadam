"use client";

import { getLesson } from "@/lib/lessons";
import { SAMPLE_ANSWERS, SAMPLE_PLAN } from "@/lib/sample";
import { useLang } from "./LangProvider";

/** A faithful excerpt of the real week 1 email, so the hero shows the actual product. */
export function EmailPreview() {
  const { lang, t } = useLang();
  const lesson = getLesson(1, { name: SAMPLE_ANSWERS.name, monthly: SAMPLE_ANSWERS.monthly, plan: SAMPLE_PLAN }, lang);
  return (
    <figure aria-label={t("hero.mail")} className="rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <figcaption className="flex items-center justify-between border-b border-line px-5 py-3 text-sm text-mute">
        <span>{t("brand")}</span>
        <span>{t("hero.mail")}</span>
      </figcaption>
      <div className="px-5 py-6 sm:px-7">
        <p className="text-sm text-mute">{t("lesson.week", { n: 1 })}</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight">{lesson.title}</h3>
        <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-ink/90">
          <p>{lesson.paragraphs[0]}</p>
          <p className="line-clamp-3 text-ink/80">{lesson.paragraphs[1]}</p>
        </div>
        <div className="mt-5 rounded-xl bg-mist px-4 py-3">
          <p className="text-sm font-semibold text-sabz">{t("lesson.do")}</p>
          <p className="mt-1 line-clamp-2 text-[15px] text-ink/90">{lesson.action}</p>
        </div>
      </div>
    </figure>
  );
}
