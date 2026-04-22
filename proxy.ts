import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get("golfpro_session")?.value;
  if (!token || !secret.length) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as { role?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const session = await hasValidSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
};