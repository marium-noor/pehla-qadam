// Every price and limit lives here so it is easy to change. Amounts are in PKR.
// Nothing in this file is a secret: it is shown on the /pricing page.

export type PlanId = "free" | "plus" | "teams";

export const PRICING = {
  free: {
    priceMonthly: 0,
    /** Text chat: user messages per Asia/Karachi day. */
    chatPerDay: 10,
    voice: false,
  },
  plus: {
    priceMonthly: 299,
    priceYearly: 2999,
    voice: true,
  },
  teams: {
    pricePerPersonMonthly: 199,
    minPeople: 20,
    voice: true,
  },
} as const;

/** Plus and Teams get a plan check-in email about this often. */
export const CHECKIN_EVERY_DAYS = 30;

/** Pakistan is UTC+5 all year (no daylight saving). Used for the "day" in the chat limit. */
export const PKT_OFFSET_HOURS = 5;

/** Public contact address for "Talk to us". Empty string means the link is hidden. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/** How much a year of Plus saves compared with twelve months. */
export const PLUS_YEARLY_SAVING = PRICING.plus.priceMonthly * 12 - PRICING.plus.priceYearly;

export const PLAN_IDS: readonly PlanId[] = ["free", "plus", "teams"];

/** Anything unexpected is treated as the lowest plan. */
export function asPlanId(x: unknown): PlanId {
  return x === "plus" || x === "teams" ? x : "free";
}

export const isPaidPlan = (p: PlanId) => p === "plus" || p === "teams";

export const pkrAmount = (n: number) => n.toLocaleString("en-US");
