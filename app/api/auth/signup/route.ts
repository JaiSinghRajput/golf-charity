import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = signupSchema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      selectedCharityId: parsed.data.charityId,
      contributionPercent: parsed.data.contributionPercent
    }
  });

  const token = await signSession({ sub: user.id, role: user.role, email: user.email });
  await setSessionCookie(token);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
