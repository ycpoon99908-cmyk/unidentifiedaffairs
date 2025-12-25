import Link from "next/link";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";
import { deletePost } from "./actions";

export default async function AdminPostsPage() {
  await requireAdmin();
  const posts = await prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      category: { select: { name: true } },
    },
    take: 200,
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-white/90">文章管理</div>
            <div className="mt-1 text-sm text-white/55">草稿、已發佈與定時發佈</div>
          </div>
          <Link
            href="/admin/posts/new"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/55"
          >
            新增文章
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="grid gap-3">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-white/85">{p.title}</div>
                  <div className="text-[11px] tracking-[0.2em] text-white/35">{p.status}</div>
                </div>
                <div className="mt-1 text-xs text-white/45">
                  {p.category?.name ?? "未分類"} · {p.slug}
                  {p.publishedAt ? (
                    <>
                      {" "}
                      · {new Intl.DateTimeFormat("zh-Hant", { dateStyle: "medium", timeStyle: "short" }).format(p.publishedAt)}
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`/admin/posts/${encodeURIComponent(p.id)}`}
                  className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
                >
                  編輯
                </Link>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/60 transition hover:border-red-400/30 hover:bg-red-900/30 hover:text-white/85"
                  >
                    刪除
                  </button>
                </form>
              </div>
            </div>
          ))}
          {posts.length === 0 ? <div className="text-sm text-white/55">尚無文章。</div> : null}
        </div>
      </div>
    </div>
  );
}
