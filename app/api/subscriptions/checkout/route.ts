import { PlanType, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES, getStripe } from "@/lib/subscription";
import { subscriptionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = subscriptionSchema.safeParse(form);
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const plan = parsed.data.plan as PlanType;
  const amountCents = PLAN_PRICES[plan];
  const stripe = getStripe();

  const existingActive = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: SubscriptionStatus.ACTIVE
    }
  });

  if (existingActive) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!stripe || !env.STRIPE_MONTHLY_PRICE_ID || !env.STRIPE_YEARLY_PRICE_ID) {
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: SubscriptionStatus.ACTIVE,
        amountCents,
        currentPeriodEnd:
          plan === PlanType.MONTHLY
            ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      }
    });

    const charityAmount = Math.floor((amountCents * user.contributionPercent) / 100);
    if (user.selectedCharityId) {
      await prisma.donation.create({
        data: {
          userId: user.id,
          charityId: user.selectedCharityId,
          amountCents: charityAmount,
          source: "SUBSCRIPTION"
        }
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "UPDATE",
        title: "Subscription active",
        message: `Your ${subscription.plan.toLowerCase()} subscription is now active.`
      }
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id }
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [
      {
        price: plan === PlanType.MONTHLY ? env.STRIPE_MONTHLY_PRICE_ID : env.STRIPE_YEARLY_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: `${env.APP_URL}/dashboard?checkout=success`,
    cancel_url: `${env.APP_URL}/dashboard?checkout=cancelled`,
    metadata: {
      userId: user.id,
      plan
    }
  });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan,
      status: SubscriptionStatus.INACTIVE,
      amountCents,
      stripeCustomerId: customer.id
    }
  });

  if (!checkoutSession.url) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.redirect(checkoutSession.url);
}
