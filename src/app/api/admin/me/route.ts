import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getAdminSession } from "@/server/session";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ admin: null }, { status: 200 });

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: { id: true, username: true, lastLoginAt: true },
  });

  return NextResponse.json({ admin: admin ?? null });
}

