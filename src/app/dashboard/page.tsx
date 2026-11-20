"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui";
import { Calculator, money } from "@/components/Calculator";
import { PlanCard } from "@/components/PlanCard";
import { MonthlyEditor } from "@/components/MonthlyEditor";
import { useLang } from "@/components/LangProvider";
import { useProfile } from "@/components/useProfile";
import { useEmailLesson } from "@/components/useEmailLesson";
import { computePlan } from "@/lib/plan";
import { getLesson, LESSON_COUNT, lessonTitles } from "@/lib/lessons";
import { GOAL, labelOf } from "@/lib/options";
import { PROVIDERS, VERIFY_LINKS } from "@/lib/providers";
import { isUnlocked, unlockDate } from "@/lib/store";
import type { Route } from "@/lib/types";
import type { Key } from "@/lib/i18n";

const ROUTES: Route[] = ["fund", "bank", "gold"];

export default function Dashboard() {
  const { t, lang } = useLang();
  const { profile, setProfile, loaded } = useProfile();
  const [existing, setExisting] = useState(false);
  const mail = useEmailLesson(profile?.token);

  useEffect(() => {
    setExisting(new URLSearchParams(window.location.search).get("existing") === "1");
  }, []);

  const a = profile?.answers;
  const plan = useMemo(() => (a ? computePlan(a) : null), [a]);

  if (!loaded) return <div className="min-h-[60vh]" />;
  if (!profile || !a || !plan) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-lg">{t("lesson.noProfile")}</p>
        <div className="mt-6"><ButtonLink href="/start">{t("nav.start")}</ButtonLink></div>
      </div>
    );
  }

  const ctx = { name: a.name, monthly: a.monthly, plan, route: profile.route };
  const titles = lessonTitles(ctx, lang);
  const unlocked = Array.from({ length: LESSON_COUNT }, (_, i) => i + 1).filter((w) => isUnlocked(profile, w));
  const thisWeek = unlocked.find((w) => !profile.done.includes(w)) ?? unlocked[unlocked.length - 1] ?? 1;
  const lesson = getLesson(thisWeek, ctx, lang);
  const fmtDate = (d: Date) => d.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "short" });

  const choose = (route: Route) => {
    setProfile({ ...profile, route });
    if (profile.token) void fetch(`/api/profile/${profile.token}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ route }) }).catch(() => null);
  };

  const saveMonthly = (monthly: number) => {
    setProfile({ ...profile, answers: { ...a, monthly } });
    if (profile.token) void fetch(`/api/profile/${profile.token}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monthly }) }).catch(() => null);
  };

  const startText = t(`dash.start.${plan.startStep}` as Key, {
    target: money(lang, plan.emergencyTarget),
    monthly: money(lang, plan.monthly),
    months: plan.monthsToEmergency ?? "",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-12 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{t("dash.hello", { name: a.name })}</h1>
      {existing && <p role="status" className="mt-4 rounded-xl bg-sabz-soft px-4 py-3 text-sm">{lang === "ur" ? "اس ای میل پر پہلے سے پروفائل موجود تھا۔ اس کا لنک آپ کی ای میل پر بھیج دیا گیا ہے۔" : "This email already had a profile, so we sent its link to your inbox."}</p>}

      {/* Plan */}
      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t("dash.plan")}</h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-3">
          <div><dt className="text-sm text-mute">{t("dash.monthly")}</dt><MonthlyEditor value={a.monthly} onSave={saveMonthly} /></div>
          <div><dt className="text-sm text-mute">{t("dash.goal")}</dt><dd className="mt-1 text-2xl font-semibold">{labelOf(GOAL, a.goal, lang)}</dd></div>
          <div><dt className="text-sm text-mute">{t("dash.style")}</dt><dd className="mt-1 text-2xl font-semibold">{t(`dash.style.${plan.riskStyle}` as Key)}</dd></div>
        </dl>
        <p className="mt-6 rounded-xl bg-mist px-5 py-4 text-[17px]">{startText}</p>
        <p className="mt-8 text-sm text-mute">{t("dash.mix")}</p>
        <ul className="mt-4 space-y-3">
          {(["cash", "income", "equity", "gold"] as const).map((k) => (
            <li key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-4">
              <span>{t(`mix.${k}` as Key)}</span>
              <span className="tabular-nums text-mute" dir="ltr">{plan.mix[k]}%</span>
              <div className="col-span-2 mt-1 h-1.5 rounded-full bg-mist"><div className="h-1.5 rounded-full bg-sabz" style={{ width: `${plan.mix[k]}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <PlanCard token={profile.token} />

      {/* Route */}
      <section id="choose" className="mt-12 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">{profile.route ? t("dash.chosen") : t("dash.choose")}</h2>
        {!profile.route ? (
          <div className="mt-6 grid gap-3">
            {ROUTES.map((r) => (
              <button key={r} type="button" onClick={() => choose(r)} className="rounded-2xl border border-line px-5 py-4 text-start hover:border-sabz hover:bg-sabz-soft">
                <span className="block text-lg font-semibold">{t(`route.${r}.t` as Key)}</span>
                <span className="mt-1 block text-mute">{t(`route.${r}.d` as Key)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xl font-semibold">{t(`route.${profile.route}.t` as Key)}</p>
              <button type="button" className="text-sabz hover:underline" onClick={() => setProfile({ ...profile, route: undefined })}>{t("dash.change")}</button>
            </div>
            <p className="mt-1 text-mute">{t(`route.${profile.route}.d` as Key)}</p>
            <h3 className="mt-6 text-sm font-semibold text-mute">{t("route.where")}</h3>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {PROVIDERS[profile.route].map((p) => (
                <li key={p.url + p.name.en} className="flex items-center justify-between gap-4 py-3">
                  <div><p className="font-medium">{p.name[lang]}</p><p className="text-sm text-mute">{p.note[lang]}</p></div>
                  <a href={p.url} target="_blank" rel="noreferrer" className="shrink-0 text-sabz hover:underline" dir="ltr">{new URL(p.url).hostname.replace("www.", "")}</a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-mute">{VERIFY_LINKS.map((v) => (<a key={v.url} href={v.url} target="_blank" rel="noreferrer" className="me-4 hover:text-ink" dir="ltr">{v.label[lang]}</a>))}</p>
          </div>
        )}
      </section>

      {/* This week */}
      <section className="mt-12 border-t border-line pt-10">
        <p className="text-sm text-mute">{t("dash.thisWeek")} · {t("lesson.week", { n: lesson.week })} · {t("lesson.min", { m: lesson.minutes })}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{lesson.title}</h2>
        <p className="mt-3 line-clamp-3 text-[17px] text-mute">{lesson.paragraphs[0]}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink href={`/lesson/${lesson.week}`}>{t("dash.read")}</ButtonLink>
          <Button variant="secondary" onClick={() => void mail.send(lesson.week)} disabled={mail.state === "sending"}>
            {mail.state === "sending" ? t("dash.emailing") : t("dash.emailMe")}
          </Button>
        </div>
        {mail.state === "sent" && <p role="status" className="mt-3 text-sm text-sabz">{t("dash.emailSent", { email: a.email })}</p>}
        {mail.key && <p role="status" className="mt-3 text-sm text-mute">{t(mail.key)}</p>}
      </section>

      {/* Six weeks */}
      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t("dash.weeks")}</h2>
        <ol className="mt-6 divide-y divide-line border-y border-line">
          {titles.map((title, i) => {
            const w = i + 1;
            const open = isUnlocked(profile, w);
            const done = profile.done.includes(w);
            return (
              <li key={w} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm text-mute">{t("lesson.week", { n: w })}</p>
                  <p className={`text-lg ${open ? "font-medium" : "text-mute"}`}>{title}</p>
                </div>
                {open ? (
                  <Link href={`/lesson/${w}`} className={`shrink-0 ${done ? "text-mute" : "text-sabz hover:underline"}`}>{done ? t("dash.done") : t("dash.open")}</Link>
                ) : (
                  <span className="shrink-0 text-sm text-mute">{t("dash.opens", { date: fmtDate(unlockDate(profile.createdAt, w)) })}</span>
                )}
              </li>
            );
          })}
        </ol>
        <button type="button" className="mt-4 text-sm text-mute hover:text-ink" onClick={() => setProfile({ ...profile, unlockAll: !profile.unlockAll })}>
          {profile.unlockAll ? t("dash.preview.on") : t("dash.preview")}
        </button>
      </section>

      <section className="mt-12 border-t border-line pt-10"><Calculator initialMonthly={a.monthly} /></section>
    </div>
  );
}
