import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const form = await request.formData();
  const charityId = form.get("charityId")?.toString();
  const amount = Number(form.get("amount") ?? 0);

  if (!charityId || Number.isNaN(amount) || amount < 1) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  await prisma.donation.create({
    data: {
      userId: user.id,
      charityId,
      amountCents: Math.floor(amount * 100),
      source: "DIRECT"
    }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "UPDATE",
      title: "Direct donation received",
      message: `Thank you for donating GBP ${amount.toFixed(2)}.`
    }
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
