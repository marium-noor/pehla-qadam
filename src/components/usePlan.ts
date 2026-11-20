"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanId } from "@/lib/pricing";

export interface PlanInfo {
  plan: PlanId;
  planRequested: string | null;
  planRequestedAt: string | null;
}

/**
 * Reads the plan from the server for display. The plan is never stored or decided in the browser:
 * the server looks it up again from the database for every chat request.
 */
export function usePlan(token: string | undefined) {
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const refresh = useCallback(async () => {
    if (!token) { setInfo(null); setLoading(false); return; }
    try {
      const res = await fetch(`/api/profile/${token}`, { cache: "no-store" });
      if (!res.ok) throw new Error("bad");
      const j = (await res.json()) as Partial<PlanInfo>;
      setInfo({ plan: j.plan ?? "free", planRequested: j.planRequested ?? null, planRequestedAt: j.planRequestedAt ?? null });
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { info, loading, refresh, setInfo };
}
