"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import { loadProfile, saveProfile } from "@/lib/store";
import type { Answers, Route } from "@/lib/types";

export default function MagicLink() {
  const { token } = useParams<{ token: string }>();
  const { t, setLang } = useLang();
  const router = useRouter();
  const [bad, setBad] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/profile/${token}`);
        if (!res.ok) throw new Error("bad");
        const j = (await res.json()) as { answers: Answers; route?: Route; createdAt: number };
        const local = loadProfile();
        saveProfile({
          answers: j.answers, token, route: j.route, createdAt: j.createdAt,
          done: local?.token === token ? local.done : [],
          unlockAll: local?.token === token ? local.unlockAll : false,
        });
        setLang(j.answers.lang);
        if (alive) router.replace("/dashboard");
      } catch {
        if (alive) setBad(true);
      }
    })();
    return () => { alive = false; };
  }, [token, router, setLang]);

  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      {bad ? (
        <>
          <p className="text-lg">{t("magic.bad")}</p>
          <Link href="/start" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-white">{t("nav.start")}</Link>
        </>
      ) : (
        <p className="text-lg text-mute">{t("magic.opening")}</p>
      )}
    </div>
  );
}
