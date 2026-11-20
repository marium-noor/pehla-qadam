import { describe, expect, it } from "vitest";
import { computePlan, emergencyTarget, futureValue, realValue, riskStyle, startStep } from "./plan";
import type { Answers } from "./types";

const base: Answers = {
  name: "Sana", email: "s@example.com", lang: "en", city: "Karachi", ageRange: "25_34",
  work: "salaried", dependents: "1_2", incomeBand: "60_100", savesIn: ["committee"],
  emergencyMonths: "1", hasInterestDebt: "no", knowledge: "none", goal: "emergency",
  horizon: "3_5", monthly: 10_000, risk: "wait", lessonDay: 0,
};

describe("plan", () => {
  it("estimates emergency fund as 3 months of 70% of band midpoint", () => {
    // 80,000 * 0.7 = 56,000 per month, x3
    expect(emergencyTarget(base)).toBe(168_000);
  });
  it("uses 6 months with 3+ dependents", () => {
    expect(emergencyTarget({ ...base, dependents: "3plus" })).toBe(336_000);
  });
  it("puts debt first", () => {
    expect(startStep({ ...base, hasInterestDebt: "yes" })).toBe("debt");
  });
  it("starts with the safety net when it is thin", () => {
    expect(startStep(base)).toBe("emergency");
    expect(startStep({ ...base, emergencyMonths: "3" })).toBe("invest");
  });
  it("forces cautious on a short horizon or no safety net, even if brave", () => {
    expect(riskStyle({ ...base, risk: "buy", horizon: "lt1" })).toBe("cautious");
    expect(riskStyle({ ...base, risk: "buy", emergencyMonths: "0" })).toBe("cautious");
  });
  it("gives growth only for brave + long horizon", () => {
    expect(riskStyle({ ...base, risk: "buy", horizon: "5plus", emergencyMonths: "3" })).toBe("growth");
    expect(riskStyle({ ...base, risk: "wait", horizon: "3_5", emergencyMonths: "3" })).toBe("balanced");
  });
  it("mix always totals 100", () => {
    for (const risk of ["sell", "wait", "buy"] as const) {
      const m = computePlan({ ...base, risk, emergencyMonths: "6plus", horizon: "5plus" }).mix;
      expect(m.cash + m.income + m.equity + m.gold).toBe(100);
    }
  });
  it("months to emergency fund rounds up", () => {
    // have 1 month = 56,000; target 168,000; gap 112,000; at 10,000/mo -> 12 months
    expect(computePlan(base).monthsToEmergency).toBe(12);
  });
});

describe("projection", () => {
  it("zero rate equals plain saving", () => {
    expect(futureValue(10_000, 5, 0)).toBe(600_000);
  });
  it("matches the annuity formula", () => {
    // 1,000/mo, 1 year, 12% => i=1% => 1000*((1.01^12-1)/0.01) = 12,682.50
    expect(futureValue(1_000, 1, 0.12)).toBeCloseTo(12_682.5, 1);
  });
  it("inflation shrinks value", () => {
    expect(realValue(110_000, 1, 0.1)).toBeCloseTo(100_000, 5);
  });
  it("handles empty input", () => {
    expect(futureValue(0, 5, 0.1)).toBe(0);
    expect(futureValue(1000, 0, 0.1)).toBe(0);
  });
});
