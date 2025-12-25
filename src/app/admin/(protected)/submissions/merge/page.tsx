import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";
import { ensureDefaultCategories } from "@/server/categories";
import { createPostFromMerged } from "../actions";

type SearchParams = { ids?: string };

export default async function MergeSubmissionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  await ensureDefaultCategories();
  const sp = await searchParams;
  const ids = (sp.ids ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const [submissions, categories] = await Promise.all([
    ids.length
      ? prisma.submission.findMany({
          where: { id: { in: ids } },
          orderBy: [{ createdAt: "asc" }],
          select: { id: true, title: true, content: true, createdAt: true },
        })
      : Promise.resolve([]),
    prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  const merged = submissions
    .map((s, idx) => `## 投稿 ${idx + 1}\n\n**${s.title}**\n\n${s.content}\n`)
    .join("\n---\n\n");

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-lg font-semibold text-white/90">合併投稿</div>
        <div className="mt-1 text-sm text-white/55">將多篇投稿整合成一篇新文章</div>
      </div>

      {submissions.length < 2 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/60 backdrop-blur">
          需要至少選擇兩篇投稿。
        </div>
      ) : (
        <form action={createPostFromMerged} className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <input type="hidden" name="submissionIds" value={ids.join(",")} />
          <div className="grid grid-cols-1 gap-4">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">標題</span>
              <input
                name="title"
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                placeholder="合併後文章標題"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">Slug</span>
              <input
                name="slug"
                defaultValue={ids[0]?.slice(0, 10)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">摘要（可選）</span>
              <input
                name="excerpt"
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">內容</span>
              <textarea
                name="content"
                defaultValue={merged}
                className="min-h-[360px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/85 outline-none focus:border-white/25"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                name="categoryId"
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                defaultValue=""
              >
                <option value="">未分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue="DRAFT"
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已發佈</option>
              </select>
              <input
                name="publishedAt"
                type="datetime-local"
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/55"
            >
              建立文章
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
