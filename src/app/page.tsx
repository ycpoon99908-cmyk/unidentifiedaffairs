import Link from "next/link";
import { prisma } from "@/server/db";
import { HamburgerSidebar } from "@/components/HamburgerSidebar";
import { PostCard } from "@/components/PostCard";
import { SiteTitle } from "@/components/SiteTitle";
import { ensureDefaultCategories } from "@/server/categories";

type SearchParams = {
  category?: string;
  q?: string;
};

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const category = sp.category?.trim() || undefined;
  const q = sp.q?.trim() || undefined;
  const now = new Date();

  await ensureDefaultCategories();
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { slug: true, name: true },
  });

  const baseWhere = {
    status: "PUBLISHED" as const,
    publishedAt: { lte: now },
    ...(category ? { category: { slug: category } } : {}),
    ...(q
      ? {
          OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { content: { contains: q } }],
        }
      : {}),
  };

  const [featured, posts] = await Promise.all([
    prisma.post.findMany({
      where: { ...baseWhere, displaySlot: "FEATURED" },
      orderBy: [{ isPinned: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
      select: { title: true, slug: true, excerpt: true, thumbnailPath: true, category: { select: { name: true, slug: true } } },
      take: 3,
    }),
    prisma.post.findMany({
      where: { ...baseWhere, displaySlot: "GRID" },
      orderBy: [{ isPinned: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
      select: { title: true, slug: true, excerpt: true, thumbnailPath: true, category: { select: { name: true, slug: true } } },
      take: 60,
    }),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <HamburgerSidebar categories={categories} titleTapToAdmin />
            <SiteTitle />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/submit"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/80 transition hover:border-white/20 hover:bg-black/35 hover:text-white"
            >
              投稿
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/80 transition hover:border-white/20 hover:bg-black/35 hover:text-white"
            >
              登入
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-wide text-white/90">收件箱裡的黑暗</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/55">
            這裡保存著都市傳說、靈異事件與未解之謎。請挑選一個標題，別在半夜獨自閱讀太久。
          </p>
        </div>

        {featured.length ? (
          <section className="mb-6">
            <div className="mb-3 text-xs tracking-[0.22em] text-white/45">置頂檔案</div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {featured.map((p) => (
                <PostCard key={p.slug} title={p.title} excerpt={p.excerpt} slug={p.slug} category={p.category} thumbnailPath={p.thumbnailPath} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.slug} title={p.title} excerpt={p.excerpt} slug={p.slug} category={p.category} thumbnailPath={p.thumbnailPath} />
          ))}
        </section>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/25 p-6 text-sm text-white/60">
            找不到符合的內容。也許你正在搜尋不存在的目擊紀錄。
          </div>
        ) : null}
      </main>
    </div>
  );
}
