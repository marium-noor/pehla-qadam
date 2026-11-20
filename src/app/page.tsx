"use client";

import Link from "next/link";
import { ButtonLink, Check, Cross, Section } from "@/components/ui";
import { EmailPreview } from "@/components/EmailPreview";
import { useLang } from "@/components/LangProvider";

export default function Landing() {
  const { t } = useLang();
  const steps = [
    { t: t("how.1.t"), d: t("how.1.d") },
    { t: t("how.2.t"), d: t("how.2.d") },
    { t: t("how.3.t"), d: t("how.3.d") },
  ];
  return (
    <>
      {/* 1. Hero: the actual lesson email is the product, so it is the picture. */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-5xl items-center gap-14 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">{t("hero.title")}</h1>
            <p className="mt-6 max-w-xl text-lg text-mute sm:text-xl">{t("hero.sub")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink href="/start" size="lg">{t("hero.cta")}</ButtonLink>
              <p className="text-sm text-mute">{t("hero.note")}</p>
            </div>
          </div>
          <EmailPreview />
        </div>
      </section>

      {/* 2. How it works: a real sequence, so numbers are honest here. */}
      <Section tone="mist">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">{t("how.title")}</h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white" aria-hidden>
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-mute">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 3. What we do and never do. */}
      <Section>
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">{t("own.title")}</h2>
        <p className="mt-5 max-w-2xl text-lg text-mute">{t("own.pay")}</p>
        <div className="mt-14 grid gap-12 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">{t("own.do.h")}</h3>
            <ul className="mt-5 space-y-3">
              {(["own.do.1", "own.do.2", "own.do.3", "own.do.4"] as const).map((k) => (
                <li key={k} className="flex gap-3"><Check /><span>{t(k)}</span></li>
              ))}
            </ul>
          </div>
          <div className="sm:border-s sm:border-line sm:ps-12">
            <h3 className="text-lg font-semibold">{t("own.dont.h")}</h3>
            <ul className="mt-5 space-y-3 text-mute">
              {(["own.dont.1", "own.dont.2", "own.dont.3", "own.dont.4"] as const).map((k) => (
                <li key={k} className="flex gap-3"><Cross /><span>{t(k)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 4. Halal and Urdu, with a real example of the assistant's answer. */}
      <Section tone="mist">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">{t("halal.title")}</h2>
            <p className="mt-6 max-w-lg text-lg text-mute">{t("halal.body")}</p>
            <p className="mt-4 max-w-lg text-sm text-mute">{t("halal.note")}</p>
          </div>
          <div className="space-y-3" aria-label="Example question and answer">
            <div className="ms-auto w-fit max-w-[85%] rounded-2xl bg-ink px-5 py-3 text-white">{t("halal.q")}</div>
            <div className="w-fit max-w-[92%] rounded-2xl border border-line bg-white px-5 py-3 text-[17px]">{t("halal.a")}</div>
          </div>
        </div>
      </Section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{t("cta.title")}</h2>
          <div className="mt-9">
            <ButtonLink href="/start" size="lg">{t("hero.cta")}</ButtonLink>
          </div>
          <p className="mt-5 text-mute">{t("cta.free")} <Link href="/pricing" className="text-sabz hover:underline">{t("cta.pricing")}</Link></p>
        </div>
      </section>
    </>
  );
}
