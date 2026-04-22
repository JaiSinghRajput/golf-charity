import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { publishDraw } from "@/lib/draw";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const form = await request.formData();
  const drawId = form.get("drawId")?.toString();
  if (!drawId) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  await publishDraw(drawId);
  return NextResponse.redirect(new URL("/admin", request.url));
}
