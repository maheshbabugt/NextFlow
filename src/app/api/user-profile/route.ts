import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  return NextResponse.json({ displayName: profile?.displayName ?? null });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { displayName } = await req.json();
  if (!displayName?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: { displayName: displayName.trim() },
    create: { userId, displayName: displayName.trim() },
  });

  return NextResponse.json({ displayName: profile.displayName });
}
