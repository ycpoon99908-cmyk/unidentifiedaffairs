import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getAdminSession } from "@/server/session";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: { id: true, username: true, lastLoginAt: true, createdAt: true },
  });

  if (!admin) redirect("/admin/login");
  return { admin, session };
}

