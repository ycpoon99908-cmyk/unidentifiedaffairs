import { prisma } from "@/server/db";
import { getAdminSession } from "@/server/session";

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: { id: true, username: true },
  });
  if (!admin) return null;
  return { admin, session };
}

