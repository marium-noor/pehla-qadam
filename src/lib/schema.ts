import { z } from "zod";

export const answersSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(120),
  lang: z.enum(["en", "ur"]),
  city: z.string().trim().max(60).default(""),
  ageRange: z.enum(["18_24", "25_34", "35_44", "45_54", "55plus"]),
  work: z.enum(["salaried", "business", "dailywage", "homemaker", "student", "other"]),
  dependents: z.enum(["0", "1_2", "3plus"]),
  incomeBand: z.enum(["lt30", "30_60", "60_100", "100_200", "gt200"]),
  savesIn: z.array(z.enum(["bank", "committee", "gold", "cash", "property", "none"])).max(6),
  emergencyMonths: z.enum(["0", "1", "3", "6plus"]),
  hasInterestDebt: z.enum(["yes", "no"]),
  knowledge: z.enum(["none", "heard", "tried"]),
  goal: z.enum(["emergency", "hajj", "marriage", "house", "education", "retirement", "grow"]),
  horizon: z.enum(["lt1", "1_3", "3_5", "5plus"]),
  monthly: z.number().int().min(500).max(10_000_000),
  risk: z.enum(["sell", "wait", "buy"]),
  lessonDay: z.number().int().min(0).max(6),
});

export const routeSchema = z.enum(["fund", "bank", "gold"]);

export const chatSchema = z.object({
  /** Profile token. Only used to look the plan up on the server; the client never says what its plan is. */
  token: z.string().max(64).optional(),
  lang: z.enum(["en", "ur"]).default("ur"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
    .min(1)
    .max(12),
  audio: z.object({ mime: z.string().max(40), data: z.string().max(4_000_000) }).optional(),
  context: z
    .object({
      route: routeSchema.optional(),
      monthly: z.number().optional(),
      goal: z.string().max(30).optional(),
      riskStyle: z.string().max(20).optional(),
    })
    .optional(),
});

export const TOKEN_RE = /^[a-f0-9]{48}$/;

export const planRequestSchema = z.object({
  token: z.string().regex(TOKEN_RE),
  plan: z.literal("plus"),
});

export const monthlySchema = z.number().int().min(500).max(10_000_000);
