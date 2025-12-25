import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

function toPreviewText(input: string) {
  const withoutCode = input.replace(/```[\s\S]*?```/g, " ");
  const withoutImages = withoutCode.replace(/!\[[^\]]*?\]\([^\)]*?\)/g, " ");
  const withoutLinks = withoutImages.replace(/\[([^\]]+?)\]\([^\)]*?\)/g, "$1");
  const withoutInlineCode = withoutLinks.replace(/`[^`]*?`/g, " ");
  const withoutMd = withoutInlineCode.replace(/[#>*_\-|~]/g, " ");
  const normalized = withoutMd.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > 180 ? `${normalized.slice(0, 180).trim()}…` : normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeRaw = searchParams.get("exclude") ?? "";
  const exclude = excludeRaw
    .split(",")
    .map((s) => decodeURIComponent(s).trim())
    .filter(Boolean)
    .slice(0, 40);

  const now = new Date();
  const where = {
    status: "PUBLISHED" as const,
    publishedAt: { lte: now },
    ...(exclude.length ? { slug: { notIn: exclude } } : {}),
  };

  const count = await prisma.post.count({ where });
  if (count <= 0) return NextResponse.json({ error: "empty" }, { status: 404 });

  const offset = crypto.randomInt(0, count);
  const found = await prisma.post.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }],
    skip: offset,
    take: 1,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      thumbnailPath: true,
      publishedAt: true,
      views: true,
      category: { select: { name: true, slug: true } },
      _count: { select: { comments: true } },
    },
  });

  const post = found[0];
  if (!post) return NextResponse.json({ error: "empty" }, { status: 404 });

  const preview = (post.excerpt ?? "").trim() || toPreviewText(post.content);

  return NextResponse.json({
    post: {
      title: post.title,
      slug: post.slug,
      thumbnailPath: post.thumbnailPath,
      publishedAt: post.publishedAt,
      category: post.category,
      views: post.views,
      commentCount: post._count.comments,
      preview,
    },
  });
}

