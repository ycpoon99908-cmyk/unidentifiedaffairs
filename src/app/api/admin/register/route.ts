import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { logAudit } from "@/server/audit";
import { setAdminSession, getRequestMetaAsync } from "@/server/session";

const RegisterSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { username, password } = parsed.data;
  const existing = await prisma.adminUser.findUnique({ where: { username }, select: { id: true } });
  if (existing) {
    await logAudit({ action: "admin_register_failed", entityType: "AdminUser", metadata: { username, reason: "username_taken" } });
    return NextResponse.json({ error: "username_taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.create({
    data: { username, passwordHash, lastLoginAt: new Date() },
    select: { id: true, username: true },
  });

  const meta = await getRequestMetaAsync();
  await prisma.auditLog.create({
    data: {
      action: "admin_register",
      entityType: "AdminUser",
      entityId: admin.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      adminUserId: admin.id,
    },
  });

  await setAdminSession({ adminUserId: admin.id, username: admin.username });
  return NextResponse.json({ ok: true });
}

