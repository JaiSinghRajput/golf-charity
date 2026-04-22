import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createOrSimulateDraw } from "@/lib/draw";
import { drawSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = drawSchema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  await createOrSimulateDraw(parsed.data.month, parsed.data.year, parsed.data.logic);
  return NextResponse.redirect(new URL("/admin", request.url));
}
