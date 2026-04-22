import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_YEARLY_PRICE_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation error", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
