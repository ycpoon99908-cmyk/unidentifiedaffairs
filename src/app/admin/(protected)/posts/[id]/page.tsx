import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/requireAdmin";
import { updatePost } from "../actions";
import { ThumbnailUploader } from "../ThumbnailUploader";

export default async function AdminEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        categoryId: true,
        status: true,
        displaySlot: true,
        displayOrder: true,
        isPinned: true,
        publishedAt: true,
        thumbnailPath: true,
      },
    }),
    prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  if (!post) notFound();

  const publishedAtDefault = post.publishedAt
    ? new Date(post.publishedAt.getTime() - post.publishedAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-lg font-semibold text-white/90">編輯文章</div>
        <div className="mt-1 text-sm text-white/55">{post.title}</div>
      </div>

      <form action={updatePost} className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <input type="hidden" name="id" value={post.id} />
        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.22em] text-white/45">標題</span>
            <input
              name="title"
              defaultValue={post.title}
              className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs tracking-[0.22em] text-white/45">Slug</span>
            <input
              name="slug"
              defaultValue={post.slug}
              className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs tracking-[0.22em] text-white/45">摘要（可選）</span>
            <input
              name="excerpt"
              defaultValue={post.excerpt ?? ""}
              className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs tracking-[0.22em] text-white/45">內容</span>
            <textarea
              name="content"
              defaultValue={post.content}
              className="min-h-[320px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/85 outline-none focus:border-white/25"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">分類</span>
              <select
                name="categoryId"
                defaultValue={post.categoryId ?? ""}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              >
                <option value="">未分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">狀態</span>
              <select
                name="status"
                defaultValue={post.status}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已發佈</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">顯示位置</span>
              <select
                name="displaySlot"
                defaultValue={post.displaySlot}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              >
                <option value="GRID">網格</option>
                <option value="FEATURED">置頂</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">排序</span>
              <input
                name="displayOrder"
                defaultValue={post.displayOrder}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/75">
              <input type="checkbox" name="isPinned" className="h-4 w-4 accent-red-500" defaultChecked={post.isPinned} />
              釘選
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">發佈時間（可選）</span>
              <input
                name="publishedAt"
                type="datetime-local"
                defaultValue={publishedAtDefault}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
              />
            </label>
            <div />
          </div>

          <ThumbnailUploader name="thumbnailPath" initialPath={post.thumbnailPath} />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/55"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
