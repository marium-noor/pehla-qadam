import type { Answers } from "./types";

export interface Opt<V extends string = string> {
  value: V;
  en: string;
  ur: string;
}

type O<K extends keyof Answers> = Opt<Extract<Answers[K], string>>[];

export const AGE: O<"ageRange"> = [
  { value: "18_24", en: "18 to 24", ur: "18 سے 24" },
  { value: "25_34", en: "25 to 34", ur: "25 سے 34" },
  { value: "35_44", en: "35 to 44", ur: "35 سے 44" },
  { value: "45_54", en: "45 to 54", ur: "45 سے 54" },
  { value: "55plus", en: "55 or more", ur: "55 یا زیادہ" },
];

export const WORK: O<"work"> = [
  { value: "salaried", en: "Job with a salary", ur: "نوکری (تنخواہ دار)" },
  { value: "business", en: "Own business", ur: "اپنا کاروبار" },
  { value: "dailywage", en: "Daily wage or freelance", ur: "روزانہ اجرت یا فری لانس" },
  { value: "homemaker", en: "Running the home", ur: "گھر سنبھالتی/سنبھالتا ہوں" },
  { value: "student", en: "Student", ur: "طالب علم" },
  { value: "other", en: "Something else", ur: "کچھ اور" },
];

export const DEPENDENTS: O<"dependents"> = [
  { value: "0", en: "Only me", ur: "صرف میں" },
  { value: "1_2", en: "1 or 2 people", ur: "1 یا 2 افراد" },
  { value: "3plus", en: "3 or more", ur: "3 یا زیادہ" },
];

export const INCOME: O<"incomeBand"> = [
  { value: "lt30", en: "Under 30,000", ur: "30,000 سے کم" },
  { value: "30_60", en: "30,000 to 60,000", ur: "30,000 سے 60,000" },
  { value: "60_100", en: "60,000 to 100,000", ur: "60,000 سے 1,00,000" },
  { value: "100_200", en: "100,000 to 200,000", ur: "1,00,000 سے 2,00,000" },
  { value: "gt200", en: "Over 200,000", ur: "2,00,000 سے زیادہ" },
];

export const SAVES_IN: Opt[] = [
  { value: "bank", en: "Bank account", ur: "بینک اکاؤنٹ" },
  { value: "committee", en: "Committee (BC)", ur: "کمیٹی (BC)" },
  { value: "gold", en: "Gold", ur: "سونا" },
  { value: "cash", en: "Cash at home", ur: "گھر میں نقد" },
  { value: "property", en: "Plot or property", ur: "پلاٹ یا جائیداد" },
  { value: "none", en: "Nothing yet", ur: "ابھی کچھ نہیں" },
];

export const EMERGENCY: O<"emergencyMonths"> = [
  { value: "0", en: "Nothing", ur: "کچھ نہیں" },
  { value: "1", en: "About 1 month", ur: "تقریباً 1 مہینہ" },
  { value: "3", en: "About 3 months", ur: "تقریباً 3 مہینے" },
  { value: "6plus", en: "6 months or more", ur: "6 مہینے یا زیادہ" },
];

export const DEBT: O<"hasInterestDebt"> = [
  { value: "yes", en: "Yes", ur: "جی ہاں" },
  { value: "no", en: "No", ur: "نہیں" },
];

export const KNOWLEDGE: O<"knowledge"> = [
  { value: "none", en: "Never", ur: "کبھی نہیں" },
  { value: "heard", en: "I know a little", ur: "تھوڑا سنا ہے" },
  { value: "tried", en: "Yes, a few times", ur: "جی، چند بار" },
];

export const GOAL: O<"goal"> = [
  { value: "emergency", en: "A safety net", ur: "ہنگامی بچت" },
  { value: "hajj", en: "Hajj or Umrah", ur: "حج یا عمرہ" },
  { value: "marriage", en: "A wedding", ur: "شادی" },
  { value: "house", en: "A home or plot", ur: "گھر یا پلاٹ" },
  { value: "education", en: "Education", ur: "تعلیم" },
  { value: "retirement", en: "Later in life", ur: "بڑھاپے کا سہارا" },
  { value: "grow", en: "Grow my savings", ur: "بچت کو بڑھانا" },
];

export const HORIZON: O<"horizon"> = [
  { value: "lt1", en: "Under 1 year", ur: "1 سال سے کم" },
  { value: "1_3", en: "1 to 3 years", ur: "1 سے 3 سال" },
  { value: "3_5", en: "3 to 5 years", ur: "3 سے 5 سال" },
  { value: "5plus", en: "More than 5 years", ur: "5 سال سے زیادہ" },
];

export const RISK: O<"risk"> = [
  { value: "sell", en: "Sell everything to stop the loss", ur: "نقصان روکنے کے لیے سب بیچ دوں" },
  { value: "wait", en: "Wait and see", ur: "انتظار کروں" },
  { value: "buy", en: "Put in a little more", ur: "تھوڑا اور ڈالوں" },
];

export const DAYS: Opt[] = [
  { value: "0", en: "Sunday", ur: "اتوار" },
  { value: "1", en: "Monday", ur: "پیر" },
  { value: "2", en: "Tuesday", ur: "منگل" },
  { value: "3", en: "Wednesday", ur: "بدھ" },
  { value: "4", en: "Thursday", ur: "جمعرات" },
  { value: "5", en: "Friday", ur: "جمعہ" },
  { value: "6", en: "Saturday", ur: "ہفتہ" },
];

export const QUICK_AMOUNTS = [2000, 5000, 10000, 20000];

export function labelOf(list: Opt[], value: string, lang: "en" | "ur"): string {
  const hit = list.find((o) => o.value === value);
  return hit ? hit[lang] : value;
}
