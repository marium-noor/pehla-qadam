import { CHECKIN_EVERY_DAYS, PKT_OFFSET_HOURS, PRICING, isPaidPlan, type PlanId } from "./pricing";

/** Pure rules for plan limits. No I/O, so they are easy to test and are used by both server and demo mode. */

export interface ChatUsage {
  /** Asia/Karachi day as YYYY-MM-DD, or null if the user has never chatted. */
  day: string | null;
  count: number;
}

export type ChatDecision =
  | { allowed: true; usage: ChatUsage; remaining: number | null }
  | { allowed: false; usage: ChatUsage; remaining: 0 };

/** The calendar day in Pakistan for a timestamp, as YYYY-MM-DD. */
export function karachiDay(now: number): string {
  return new Date(now + PKT_OFFSET_HOURS * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Decide whether one more user message is allowed and return the usage to store.
 * Free: counted per Karachi day, reset when the day changes. Plus and Teams: never limited and never counted.
 * When the answer is "no", the returned usage is the (possibly rolled-over) current state and nothing is added.
 */
export function consumeChat(plan: PlanId, usage: ChatUsage, now: number, limit: number = PRICING.free.chatPerDay): ChatDecision {
  if (isPaidPlan(plan)) return { allowed: true, usage, remaining: null };
  const today = karachiDay(now);
  const used = usage.day === today ? Math.max(0, usage.count) : 0;
  if (used >= limit) return { allowed: false, usage: { day: today, count: used }, remaining: 0 };
  return { allowed: true, usage: { day: today, count: used + 1 }, remaining: limit - used - 1 };
}

export const canUseVoice = (plan: PlanId) => isPaidPlan(plan);

/** Only Plus and Teams ever get the monthly check-in. Free is always false, whatever the dates say. */
export function isCheckinDue(plan: PlanId, lastCheckinAt: string | null, now: number, everyDays: number = CHECKIN_EVERY_DAYS): boolean {
  if (!isPaidPlan(plan)) return false;
  if (!lastCheckinAt) return true;
  const last = new Date(lastCheckinAt).getTime();
  if (Number.isNaN(last)) return true;
  return now - last >= everyDays * 24 * 60 * 60 * 1000;
}
