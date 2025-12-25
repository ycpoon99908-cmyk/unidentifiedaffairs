import { requireAdmin } from "@/server/requireAdmin";
import { prisma } from "@/server/db";
import { createCategory, deleteCategory, updateCategory, seedDefaultCategories } from "./actions";
import { ensureDefaultCategories } from "@/server/categories";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  await ensureDefaultCategories();
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, order: true },
  });
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-lg font-semibold text-white/90">主題管理</div>
        <div className="mt-1 text-sm text-white/55">用於前台側欄分類與文章歸檔</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs tracking-[0.22em] text-white/45">新增主題</div>
          <form action={seedDefaultCategories}>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-xs text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              導入恐怖主題
            </button>
          </form>
        </div>
        <form action={createCategory} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            name="name"
            placeholder="名稱（例如：都市傳說）"
            className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
          />
          <input
            name="slug"
            placeholder="slug（例如：urban-legends）"
            className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
          />
          <input
            name="order"
            placeholder="順序"
            defaultValue={0}
            className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/55"
          >
            新增
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="mb-3 text-xs tracking-[0.22em] text-white/45">現有主題</div>
        <div className="grid gap-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <form action={updateCategory} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="name"
                  defaultValue={c.name}
                  className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                />
                <input
                  name="slug"
                  defaultValue={c.slug}
                  className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                />
                <input
                  name="order"
                  defaultValue={c.order}
                  className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-5 text-sm text-white/75 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
                >
                  儲存
                </button>
              </form>
              <form action={deleteCategory} className="mt-3 flex justify-end">
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/60 transition hover:border-red-400/30 hover:bg-red-900/30 hover:text-white/85"
                >
                  刪除
                </button>
              </form>
            </div>
          ))}
          {categories.length === 0 ? <div className="text-sm text-white/55">尚無主題。</div> : null}
        </div>
      </div>
    </div>
  );
}
