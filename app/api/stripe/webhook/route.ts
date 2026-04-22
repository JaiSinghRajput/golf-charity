import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type PlanType = "MONTHLY" | "YEARLY";

const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELED: "CANCELED",
  PAST_DUE: "PAST_DUE",
  INACTIVE: "INACTIVE"
} as const;

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" })
  : null;

export async function POST(request: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = (session.metadata?.plan as PlanType | undefined) ?? "MONTHLY";

    if (userId) {
      const subscriptionId = session.subscription as string;
      const amountCents = plan === "MONTHLY" ? 1500 : 15000;
      await prisma.subscription.updateMany({
        where: { userId, status: SUBSCRIPTION_STATUS.INACTIVE },
        data: {
          status: SUBSCRIPTION_STATUS.ACTIVE,
          stripeSubscriptionId: subscriptionId,
          currentPeriodEnd:
            plan === "MONTHLY"
              ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
              : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
        }
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.selectedCharityId) {
        await prisma.donation.create({
          data: {
            userId,
            charityId: user.selectedCharityId,
            amountCents: Math.floor((amountCents * user.contributionPercent) / 100),
            source: "SUBSCRIPTION"
          }
        });
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription & {
      current_period_end?: number;
      canceled_at?: number;
    };
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status:
          event.type === "customer.subscription.deleted"
            ? SUBSCRIPTION_STATUS.CANCELED
            : subscription.status === "active"
            ? SUBSCRIPTION_STATUS.ACTIVE
            : SUBSCRIPTION_STATUS.PAST_DUE,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      }
    });
  }

  return NextResponse.json({ received: true });
}
