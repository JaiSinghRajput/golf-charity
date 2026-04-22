import { UserRole, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ winnerId: string }> }
) {
  const user = await currentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { winnerId } = await params;
  const form = await request.formData();
  const verificationStatus =
    form.get("verificationStatus")?.toString() === "APPROVED"
      ? VerificationStatus.APPROVED
      : VerificationStatus.REJECTED;
  const proofUrl = form.get("proofUrl")?.toString();

  await prisma.drawWinner.update({
    where: { id: winnerId },
    data: {
      verificationStatus,
      proofUrl: proofUrl || null,
      reviewedAt: new Date()
    }
  });

  return NextResponse.redirect(new URL("/admin", request.url));
}
