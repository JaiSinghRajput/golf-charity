import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const form = await request.formData();
  const winnerId = form.get("winnerId")?.toString();
  const proofUrl = form.get("proofUrl")?.toString();

  if (!winnerId || !proofUrl) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const winner = await prisma.drawWinner.findUnique({ where: { id: winnerId } });
  if (!winner || winner.userId !== user.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  await prisma.drawWinner.update({
    where: { id: winnerId },
    data: {
      proofUrl,
      verificationStatus: "PENDING"
    }
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
