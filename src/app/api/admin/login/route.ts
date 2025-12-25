import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { logAudit } from "@/server/audit";
import { setAdminSession, getRequestMetaAsync } from "@/server/session";

const LoginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { username, password } = parsed.data;
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    await logAudit({ action: "admin_login_failed", entityType: "AdminUser", metadata: { username } });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    await logAudit({ action: "admin_login_failed", entityType: "AdminUser", entityId: admin.id, adminUserId: admin.id, metadata: { username } });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const meta = await getRequestMetaAsync();
  await prisma.auditLog.create({
    data: {
      action: "admin_login",
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
