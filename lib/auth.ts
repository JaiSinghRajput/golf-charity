import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type UserRole = "USER" | "ADMIN";

const COOKIE_NAME = "golfpro_session";

type SessionPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const hashPassword = (password: string) => hash(password, 12);
export const verifyPassword = (password: string, passwordHash: string) =>
  compare(password, passwordHash);

export const signSession = async (payload: SessionPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
};

export const readSession = async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<SessionPayload>(token, secret);
    return verified.payload;
  } catch {
    return null;
  }
};

export const setSessionCookie = async (token: string) => {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });
};

export const clearSessionCookie = async () => {
  (await cookies()).delete(COOKIE_NAME);
};

export const currentUser = async () => {
  const session = await readSession();
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      selectedCharity: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
};

export const requireUser = async () => {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", env.APP_URL));
  }
  return user;
};

export const requireAdmin = async () => {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", env.APP_URL));
  }
  return user;
};
