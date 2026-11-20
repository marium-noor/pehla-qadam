"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui";
import { useLang } from "@/components/LangProvider";
import { useProfile } from "@/components/useProfile";
import { useEmailLesson } from "@/components/useEmailLesson";
import { computePlan } from "@/lib/plan";
import { getLesson, LESSON_COUNT } from "@/lib/lessons";
import { isUnlocked, toggleDone, unlockDate } from "@/lib/store";

export default function LessonPage() {
  const params = useParams<{ week: string }>();
  const week = Math.min(Math.max(parseInt(params.week, 10) || 1, 1), LESSON_COUNT);
  const { t, lang } = useLang();
  const { profile, setProfile, loaded } = useProfile();
  const mail = useEmailLesson(profile?.token);

  if (!loaded) return <div className="min-h-[60vh]" />;
  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-lg">{t("lesson.noProfile")}</p>
        <div className="mt-6"><ButtonLink href="/start">{t("nav.start")}</ButtonLink></div>
      </div>
    );
  }

  if (!isUnlocked(profile, week)) {
    const when = unlockDate(profile.createdAt, week).toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "long" });
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-lg">{t("lesson.locked", { date: when })}</p>
        <div className="mt-6"><ButtonLink href="/dashboard">{t("lesson.back")}</ButtonLink></div>
      </div>
    );
  }

  const a = profile.answers;
  const plan = computePlan(a);
  const lesson = getLesson(week, { name: a.name, monthly: a.monthly, plan, route: profile.route }, lang);
  const done = profile.done.includes(week);

  return (
    <article className="mx-auto max-w-2xl px-6 pb-24 pt-12 sm:pt-16">
      <Link href="/dashboard" className="text-sm text-sabz hover:underline">{t("lesson.back")}</Link>
      <p className="mt-8 text-sm text-mute">{t("lesson.week", { n: week })} · {t("lesson.min", { m: lesson.minutes })}</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{lesson.title}</h1>
      <div className="mt-8 space-y-5 text-[18px] leading-relaxed">
        {lesson.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="mt-10 rounded-2xl bg-sabz-soft px-6 py-5">
        <h2 className="text-base font-semibold text-sabz">{t("lesson.do")}</h2>
        <p className="mt-2 text-[17px]">{lesson.action}</p>
      </div>
      {week === 1 && !profile.route && (
        <div className="mt-6"><ButtonLink href="/dashboard#choose">{t("dash.choose")}</ButtonLink></div>
      )}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Button onClick={() => { const next = toggleDone(week, !done); if (next) setProfile(next); }}>{done ? t("lesson.isDone") : t("lesson.markDone")}</Button>
        <Button variant="secondary" onClick={() => void mail.send(week)} disabled={mail.state === "sending"}>{mail.state === "sending" ? t("dash.emailing") : t("dash.emailMe")}</Button>
      </div>
      {mail.state === "sent" && <p role="status" className="mt-3 text-sm text-sabz">{t("dash.emailSent", { email: a.email })}</p>}
      {mail.key && <p role="status" className="mt-3 text-sm text-mute">{t(mail.key)}</p>}
      <nav className="mt-14 flex justify-between border-t border-line pt-6 text-[16px]">
        {week > 1 ? <Link href={`/lesson/${week - 1}`} className="text-sabz hover:underline">{t("lesson.prev")}</Link> : <span />}
        {week < LESSON_COUNT ? <Link href={`/lesson/${week + 1}`} className="text-sabz hover:underline">{t("lesson.next")}</Link> : <span />}
      </nav>
    </article>
  );
}
