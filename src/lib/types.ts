export type Lang = "en" | "ur";
export type Route = "fund" | "bank" | "gold";

export interface Answers {
  name: string;
  email: string;
  lang: Lang;
  city: string;
  ageRange: "18_24" | "25_34" | "35_44" | "45_54" | "55plus";
  work: "salaried" | "business" | "dailywage" | "homemaker" | "student" | "other";
  dependents: "0" | "1_2" | "3plus";
  incomeBand: "lt30" | "30_60" | "60_100" | "100_200" | "gt200";
  savesIn: string[];
  emergencyMonths: "0" | "1" | "3" | "6plus";
  hasInterestDebt: "yes" | "no";
  knowledge: "none" | "heard" | "tried";
  goal: "emergency" | "hajj" | "marriage" | "house" | "education" | "retirement" | "grow";
  horizon: "lt1" | "1_3" | "3_5" | "5plus";
  monthly: number;
  risk: "sell" | "wait" | "buy";
  lessonDay: number; // 0 = Sunday
}

export interface StoredProfile {
  answers: Answers;
  token?: string; // present when saved on the server
  route?: Route;
  done: number[];
  createdAt: number;
  unlockAll?: boolean;
}

export type RiskStyle = "cautious" | "balanced" | "growth";
export type StartStep = "debt" | "emergency" | "invest";

export interface Plan {
  riskStyle: RiskStyle;
  startStep: StartStep;
  monthly: number;
  emergencyTarget: number;
  monthsToEmergency: number | null;
  /** Long-term starting mix in percent, learning example only. */
  mix: { cash: number; income: number; equity: number; gold: number };
}
