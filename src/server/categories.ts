import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export const DEFAULT_CATEGORIES = [
  { name: "都市傳說", slug: "urban-legends", order: 1 },
  { name: "靈異事件", slug: "paranormal", order: 2 },
  { name: "未解之謎", slug: "unsolved", order: 3 },
  { name: "禁忌檔案", slug: "forbidden", order: 4 },
  { name: "詭異物件", slug: "creepy-objects", order: 5 },
  { name: "兇宅檔案", slug: "haunted-houses", order: 6 },
  { name: "靈異照片", slug: "ghost-photos", order: 7 },
  { name: "失蹤事件", slug: "missing-persons", order: 8 },
  { name: "怪談傳說", slug: "kaidan", order: 9 },
  { name: "神秘學", slug: "occult", order: 10 },
  { name: "民間信仰", slug: "folk-beliefs", order: 11 },
  { name: "禁忌儀式", slug: "taboos-rituals", order: 12 },
  { name: "超自然現象", slug: "supernatural", order: 13 },
  { name: "夜半怪聲", slug: "midnight-sounds", order: 14 },
  { name: "鏡面異象", slug: "mirror-anomalies", order: 15 },
  { name: "靈界生物", slug: "entities", order: 16 },
  { name: "靈媒紀錄", slug: "medium-logs", order: 17 },
  { name: "科學未解", slug: "scientific-unexplained", order: 18 },
  { name: "夢境與預兆", slug: "dreams-omens", order: 19 },
  { name: "黑暗歷史", slug: "dark-history", order: 20 },
];

export async function ensureDefaultCategories() {
  const slugs = DEFAULT_CATEGORIES.map((c) => c.slug);
  const existing = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((c) => c.slug));
  const missing = DEFAULT_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));
  if (!missing.length) return;
  try {
    await prisma.category.createMany({ data: missing });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  }
}
