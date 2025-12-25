import Link from "next/link";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";

export default async function AdminHome() {
  await requireAdmin();

  const [postCounts, submissionCounts, categoryCount] = await Promise.all([
    prisma.post.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.submission.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.category.count(),
  ]);

  const posts = Object.fromEntries(postCounts.map((x) => [x.status, x._count._all])) as Record<string, number>;
  const subs = Object.fromEntries(submissionCounts.map((x) => [x.status, x._count._all])) as Record<string, number>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-xs tracking-[0.22em] text-white/45">文章</div>
        <div className="mt-3 text-3xl font-semibold text-white/90">{(posts.PUBLISHED ?? 0) + (posts.DRAFT ?? 0)}</div>
        <div className="mt-3 text-sm text-white/55">已發佈：{posts.PUBLISHED ?? 0}，草稿：{posts.DRAFT ?? 0}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-xs tracking-[0.22em] text-white/45">投稿</div>
        <div className="mt-3 text-3xl font-semibold text-white/90">
          {(subs.PENDING ?? 0) + (subs.APPROVED ?? 0) + (subs.REJECTED ?? 0)}
        </div>
        <div className="mt-3 text-sm text-white/55">
          待審：{subs.PENDING ?? 0}，通過：{subs.APPROVED ?? 0}，拒絕：{subs.REJECTED ?? 0}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-xs tracking-[0.22em] text-white/45">主題</div>
        <div className="mt-3 text-3xl font-semibold text-white/90">{categoryCount}</div>
        <div className="mt-3 text-sm text-white/55">可調整顯示順序與分類名稱</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur lg:col-span-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-white/90">管理工具</div>
            <div className="mt-1 text-sm text-white/55">文章、主題、投稿審核都在這裡完成</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/posts"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              文章
            </Link>
            <Link
              href="/admin/submissions"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              投稿
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              主題
            </Link>
            <Link
              href="/admin/tools"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              工具
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
