import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q")?.trim() || undefined;

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: now },
      ...(categorySlug
        ? {
            category: {
              slug: categorySlug,
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { excerpt: { contains: q } },
              { content: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ isPinned: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      thumbnailPath: true,
      displaySlot: true,
      displayOrder: true,
      isPinned: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
    take: 60,
  });

  return NextResponse.json({ posts });
}

