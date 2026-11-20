import type { Answers } from "./types";
import { computePlan } from "./plan";

export const SAMPLE_ANSWERS: Answers = {
  name: "Sana", email: "sana@example.com", lang: "en", city: "Karachi", ageRange: "25_34",
  work: "salaried", dependents: "1_2", incomeBand: "60_100", savesIn: ["committee", "bank"],
  emergencyMonths: "1", hasInterestDebt: "no", knowledge: "none", goal: "emergency",
  horizon: "3_5", monthly: 5000, risk: "wait", lessonDay: 0,
};

export const SAMPLE_PLAN = computePlan(SAMPLE_ANSWERS);
