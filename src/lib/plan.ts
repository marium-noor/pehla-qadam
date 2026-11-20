import type { Answers, Plan, RiskStyle, StartStep } from "./types";

const INCOME_MID: Record<Answers["incomeBand"], number> = {
  lt30: 25_000,
  "30_60": 45_000,
  "60_100": 80_000,
  "100_200": 150_000,
  gt200: 300_000,
};

/** Rough monthly spending: 70% of the middle of the income band. A labelled estimate, not a measurement. */
export function estimateMonthlySpend(band: Answers["incomeBand"]): number {
  return Math.round((INCOME_MID[band] * 0.7) / 1000) * 1000;
}

export function emergencyTarget(a: Pick<Answers, "incomeBand" | "dependents">): number {
  const months = a.dependents === "3plus" ? 6 : 3;
  return estimateMonthlySpend(a.incomeBand) * months;
}

const EMERGENCY_HAVE_MONTHS: Record<Answers["emergencyMonths"], number> = {
  "0": 0,
  "1": 1,
  "3": 3,
  "6plus": 6,
};

const HORIZON_SCORE: Record<Answers["horizon"], number> = { lt1: 0, "1_3": 1, "3_5": 2, "5plus": 3 };
const RISK_SCORE: Record<Answers["risk"], number> = { sell: 0, wait: 1, buy: 2 };

export function riskStyle(a: Pick<Answers, "risk" | "horizon" | "emergencyMonths" | "dependents">): RiskStyle {
  // Short horizon or no safety net always means cautious, whatever the person says about nerves.
  if (a.horizon === "lt1" || a.emergencyMonths === "0") return "cautious";
  const score = RISK_SCORE[a.risk] + HORIZON_SCORE[a.horizon];
  if (score >= 4 && a.dependents !== "3plus") return "growth";
  if (score >= 3) return "balanced";
  return "cautious";
}

export function startStep(a: Pick<Answers, "hasInterestDebt" | "emergencyMonths" | "dependents">): StartStep {
  if (a.hasInterestDebt === "yes") return "debt";
  const need = a.dependents === "3plus" ? 6 : 3;
  if (EMERGENCY_HAVE_MONTHS[a.emergencyMonths] < Math.min(need, 3)) return "emergency";
  return "invest";
}

const MIX: Record<RiskStyle, Plan["mix"]> = {
  cautious: { cash: 70, income: 20, equity: 0, gold: 10 },
  balanced: { cash: 40, income: 20, equity: 30, gold: 10 },
  growth: { cash: 20, income: 10, equity: 60, gold: 10 },
};

export function computePlan(a: Answers): Plan {
  const target = emergencyTarget(a);
  const have = EMERGENCY_HAVE_MONTHS[a.emergencyMonths] * estimateMonthlySpend(a.incomeBand);
  const gap = Math.max(0, target - have);
  const step = startStep(a);
  const months = step === "emergency" && a.monthly > 0 ? Math.ceil(gap / a.monthly) : null;
  const style = riskStyle(a);
  return {
    riskStyle: style,
    startStep: step,
    monthly: a.monthly,
    emergencyTarget: target,
    monthsToEmergency: months,
    mix: MIX[style],
  };
}

/** Future value of a monthly deposit with monthly compounding. annualRate is a fraction, e.g. 0.1. */
export function futureValue(monthly: number, years: number, annualRate: number): number {
  const n = Math.round(years * 12);
  if (n <= 0 || monthly <= 0) return 0;
  const i = annualRate / 12;
  if (i === 0) return monthly * n;
  return monthly * ((Math.pow(1 + i, n) - 1) / i);
}

/** What a future amount is worth in today's money. */
export function realValue(amount: number, years: number, inflation: number): number {
  return amount / Math.pow(1 + inflation, years);
}

export function pkr(n: number): string {
  return "PKR " + Math.round(n).toLocaleString("en-US");
}
