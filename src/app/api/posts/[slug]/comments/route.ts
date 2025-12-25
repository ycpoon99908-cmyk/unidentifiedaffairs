import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getRequestMetaAsync } from "@/server/session";
import { logAudit } from "@/server/audit";

const CreateCommentSchema = z.object({
  authorName: z.string().trim().min(1).max(60).optional(),
  content: z.string().trim().min(1).max(1200),
});

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const takeRaw = Number(searchParams.get("take") ?? 30);
  const take = Number.isFinite(takeRaw) ? Math.min(50, Math.max(1, takeRaw)) : 30;
  const now = new Date();

  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, authorName: true, content: true, createdAt: true },
  });

  const total = await prisma.comment.count({ where: { postId: post.id } });
  return NextResponse.json({ comments, total });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const now = new Date();
  const meta = await getRequestMetaAsync();

  if (meta.ip) {
    const since = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.auditLog.count({
      where: { action: "post_comment_create", createdAt: { gte: since }, ip: meta.ip },
    });
    if (recentCount >= 6) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = CreateCommentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: now } },
    select: { id: true, title: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorName: parsed.data.authorName,
      content: parsed.data.content,
    },
    select: { id: true, authorName: true, content: true, createdAt: true },
  });

  await logAudit({
    action: "post_comment_create",
    entityType: "Comment",
    entityId: comment.id,
    metadata: { postId: post.id, slug, ip: meta.ip },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

