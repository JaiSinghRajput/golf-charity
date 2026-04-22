import { z } from "zod";

const DRAW_LOGIC_VALUES = ["RANDOM", "WEIGHTED"] as const;
const PLAN_TYPE_VALUES = ["MONTHLY", "YEARLY"] as const;

export const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  charityId: z.string().min(1),
  contributionPercent: z.coerce.number().int().min(10).max(90)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const scoreSchema = z.object({
  score: z.coerce.number().int().min(1).max(45),
  date: z.string().date(),
  id: z.string().optional()
});

export const charitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().min(30),
  imageUrl: z.string().url(),
  featured: z.boolean().default(false),
  eventsJson: z.string().default("[]")
});

export const drawSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2024),
  logic: z.enum(DRAW_LOGIC_VALUES)
});

export const subscriptionSchema = z.object({
  plan: z.enum(PLAN_TYPE_VALUES)
});

export const verifyWinnerSchema = z.object({
  verificationStatus: z.enum(["APPROVED", "REJECTED"]),
  proofUrl: z.string().url().optional().or(z.literal(""))
});
