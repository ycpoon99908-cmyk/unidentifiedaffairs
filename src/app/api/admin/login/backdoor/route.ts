import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { setAdminSession, getRequestMetaAsync } from "@/server/session";

const BackdoorSchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const expected = process.env.AUTH_BACKDOOR_CODE || "9308888";

  const json = await request.json().catch(() => null);
  const parsed = BackdoorSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  if (parsed.data.code !== expected) return NextResponse.json({ error: "invalid_code" }, { status: 401 });

  const admin = await prisma.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
  if (!admin) return NextResponse.json({ error: "no_admin" }, { status: 400 });

  const meta = await getRequestMetaAsync();
  await prisma.auditLog.create({
    data: {
      action: "admin_login_backdoor",
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

