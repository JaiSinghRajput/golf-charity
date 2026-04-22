import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = loginSchema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const token = await signSession({ sub: user.id, role: user.role, email: user.email });
  await setSessionCookie(token);

  const target = user.role === "ADMIN" ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(target, request.url));
}
