import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeSlug } from "@/lib/utils";
import { charitySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = charitySchema.safeParse({
    ...form,
    featured: form.featured === "on"
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const events = JSON.parse(parsed.data.eventsJson || "[]");

  if (parsed.data.id) {
    await prisma.charity.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: makeSlug(parsed.data.name),
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        events,
        featured: parsed.data.featured
      }
    });
  } else {
    await prisma.charity.create({
      data: {
        name: parsed.data.name,
        slug: makeSlug(parsed.data.name),
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        events,
        featured: parsed.data.featured
      }
    });
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Charity id required" }, { status: 400 });
  }

  await prisma.charity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
