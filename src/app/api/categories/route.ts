import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ensureDefaultCategories } from "@/server/categories";

export async function GET() {
  await ensureDefaultCategories();
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, order: true },
  });

  return NextResponse.json({ categories });
}
