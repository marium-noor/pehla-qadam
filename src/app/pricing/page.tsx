"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ButtonLink, Check } from "@/components/ui";
import { useLang } from "@/components/LangProvider";
import { useProfile } from "@/components/useProfile";
import { CONTACT_EMAIL, PLUS_YEARLY_SAVING, PRICING, pkrAmount } from "@/lib/pricing";
import type { Key } from "@/lib/i18n";

type Billing = "monthly" | "yearly";

function Card({ title, desc, children, footer }: { title: string; desc: string; children: ReactNode; footer: ReactNode }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-7">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-mute">{desc}</p>
      {children}
      <div className="mt-auto pt-8">{footer}</div>
    </article>
  );
}

function Features({ keys, vars }: { keys: Key[]; vars?: Record<string, string | number> }) {
  const { t } = useLang();
  return (
    <ul className="mt-6 space-y-3 text-[16px]">
      {keys.map((k) => (
        <li key={k} className="flex gap-3"><Check /><span>{t(k, vars)}</span></li>
      ))}
    </ul>
  );
}

export default function Pricing() {
  const { t, lang } = useLang();
  const { profile } = useProfile();
  const [billing, setBilling] = useState<Billing>("monthly");
  const price = (n: number) => (lang === "ur" ? `${pkrAmount(n)} روپے` : `PKR ${pkrAmount(n)}`);
  const yearly = billing === "yearly";

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-14 sm:pt-20">
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">{t("price.title")}</h1>
      <p className="mt-5 max-w-2xl text-lg text-mute sm:text-xl">{t("price.sub")}</p>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {/* Free */}
        <Card
          title={t("price.free")}
          desc={t("price.free.d")}
          footer={<ButtonLink href={profile ? "/dashboard" : "/start"}>{profile ? t("nav.plan") : t("hero.cta")}</ButtonLink>}
        >
          <p className="mt-6 text-4xl font-semibold" dir="ltr">{price(0)}</p>
          <Features keys={["price.free.f1", "price.free.f2", "price.free.f3", "price.free.f4"]} vars={{ n: PRICING.free.chatPerDay }} />
        </Card>

        {/* Plus, with the monthly / yearly toggle */}
        <Card
          title={t("price.plus")}
          desc={t("price.plus.d")}
          footer={<ButtonLink href={profile ? "/dashboard#plan" : "/start"}>{t("plan.request")}</ButtonLink>}
        >
          <div role="group" aria-label={t("price.plus")} className="mt-5 inline-flex self-start rounded-full bg-mist p-1 text-sm">
            {(["monthly", "yearly"] as const).map((b) => (
              <button key={b} type="button" aria-pressed={billing === b} onClick={() => setBilling(b)}
                className={`rounded-full px-4 py-1.5 ${billing === b ? "bg-white font-medium shadow-sm" : "text-mute hover:text-ink"}`}>
                {t(b === "monthly" ? "price.monthly" : "price.yearly")}
              </button>
            ))}
          </div>
          <p className="mt-5 text-4xl font-semibold" dir="ltr">{price(yearly ? PRICING.plus.priceYearly : PRICING.plus.priceMonthly)}</p>
          <p className="mt-1 text-sm text-mute">
            {t(yearly ? "price.perYear" : "price.perMonth")}
            {yearly && <> · {t("price.save", { n: pkrAmount(PLUS_YEARLY_SAVING) })}</>}
          </p>
          <Features keys={["price.plus.f1", "price.plus.f2", "price.plus.f3", "price.plus.f4"]} />
        </Card>

        {/* Teams */}
        <Card
          title={t("price.teams")}
          desc={t("price.teams.d", { n: PRICING.teams.minPeople })}
          footer={
            CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Pehla Qadam Teams")}`}
                className="inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-base font-medium hover:bg-mist">
                {t("price.talk")}
              </a>
            ) : null
          }
        >
          <p className="mt-5 inline-block self-start rounded-full bg-sabz-soft px-3 py-1 text-sm font-medium text-sabz">{t("price.pilot")}</p>
          <p className="mt-4 text-4xl font-semibold" dir="ltr">{price(PRICING.teams.pricePerPersonMonthly)}</p>
          <p className="mt-1 text-sm text-mute">{t("price.teams.rate", { n: pkrAmount(PRICING.teams.pricePerPersonMonthly) })} · {t("price.teams.min", { n: PRICING.teams.minPeople })}</p>
          <Features keys={["price.teams.f1"]} />
        </Card>
      </div>

      <p className="mt-6 max-w-3xl text-sm text-mute">{t("price.manual")}</p>

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t("price.faq")}</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {(["1", "2", "3"] as const).map((n) => (
            <details key={n} className="group py-5">
              <summary className="cursor-pointer list-none text-lg font-medium">{t(`price.q${n}` as Key)}</summary>
              <p className="mt-3 max-w-3xl text-[17px] text-mute">{t(`price.a${n}` as Key)}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-mute"><Link href="/start" className="text-sabz hover:underline">{t("hero.cta")}</Link></p>
      </section>
    </div>
  );
}
