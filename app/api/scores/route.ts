import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const action = formData.get("action")?.toString();
  if (action === "delete") {
    const id = formData.get("id")?.toString();
    if (id) {
      await prisma.scoreEntry.deleteMany({
        where: {
          id,
          userId: user.id
        }
      });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const form = Object.fromEntries(formData.entries());
  const parsed = scoreSchema.safeParse(form);

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);

  if (parsed.data.id) {
    await prisma.scoreEntry.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: {
        score: parsed.data.score,
        date
      }
    });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const existingForDate = await prisma.scoreEntry.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date
      }
    }
  });

  if (existingForDate) {
    await prisma.scoreEntry.update({
      where: { id: existingForDate.id },
      data: { score: parsed.data.score }
    });
  } else {
    const existing = await prisma.scoreEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    });

    if (existing.length >= 5) {
      const oldest = existing[existing.length - 1];
      await prisma.scoreEntry.delete({ where: { id: oldest.id } });
    }

    await prisma.scoreEntry.create({
      data: {
        userId: user.id,
        score: parsed.data.score,
        date
      }
    });
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Score id is required" }, { status: 400 });
  }

  await prisma.scoreEntry.deleteMany({
    where: {
      id,
      userId: user.id
    }
  });

  return NextResponse.json({ ok: true });
}
