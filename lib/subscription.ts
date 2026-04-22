import { PlanType, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const PLAN_PRICES: Record<PlanType, number> = {
  MONTHLY: 1500,
  YEARLY: 15000
};

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" })
  : null;

export const getStripe = () => stripe;

export const activeSubscription = async (userId: string) => {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const monthlyPoolBreakdown = (
  activeSubscribers: number,
  rolloverCents = 0,
  monthlyPlanCents = PLAN_PRICES.MONTHLY
) => {
  const totalPoolCents = activeSubscribers * Math.floor(monthlyPlanCents * 0.5) + rolloverCents;
  return {
    totalPoolCents,
    fiveMatchPoolCents: Math.floor(totalPoolCents * 0.4),
    fourMatchPoolCents: Math.floor(totalPoolCents * 0.35),
    threeMatchPoolCents: Math.floor(totalPoolCents * 0.25)
  };
};
