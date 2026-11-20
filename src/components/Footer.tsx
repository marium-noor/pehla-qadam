"use client";

import Link from "next/link";
import { useLang } from "./LangProvider";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-line bg-mist">
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-mute">
        <p className="max-w-3xl">{t("foot.disclaimer")}</p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Link className="hover:text-ink" href="/pricing">{t("nav.pricing")}</Link>
          <a className="hover:text-ink" href="https://www.secp.gov.pk" target="_blank" rel="noreferrer">secp.gov.pk</a>
          <a className="hover:text-ink" href="https://www.mufap.com.pk" target="_blank" rel="noreferrer">mufap.com.pk</a>
        </p>
      </div>
    </footer>
  );
}
