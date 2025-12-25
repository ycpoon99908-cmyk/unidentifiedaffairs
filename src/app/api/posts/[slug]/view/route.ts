import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getRequestMetaAsync } from "@/server/session";
import { logAudit } from "@/server/audit";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const now = new Date();
  const meta = await getRequestMetaAsync();

  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
    select: { views: true },
  });

  await logAudit({
    action: "post_view",
    entityType: "Post",
    entityId: post.id,
    metadata: { slug, ip: meta.ip },
  });

  return NextResponse.json({ views: updated.views });
}

