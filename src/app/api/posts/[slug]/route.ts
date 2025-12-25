import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const now = new Date();

  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { lte: now },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      thumbnailPath: true,
      views: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ post });
}
