import { requireAdmin } from "@/server/requireAdmin";
import { prisma } from "@/server/db";
import { SubmissionMergeClient } from "./SubmissionMergeClient";
import { createPostFromSubmission, deleteSubmission, updateSubmission } from "./actions";
import { ensureDefaultCategories } from "@/server/categories";
import Image from "next/image";

export default async function AdminSubmissionsPage() {
  await requireAdmin();
  await ensureDefaultCategories();
  const [submissions, categories] = await Promise.all([
    prisma.submission.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        authorName: true,
        contact: true,
        categorySuggestion: true,
        thumbnailPath: true,
        videoPath: true,
        adminNotes: true,
        createdAt: true,
      },
      take: 200,
    }),
    prisma.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-lg font-semibold text-white/90">投稿處理</div>
        <div className="mt-1 text-sm text-white/55">審核、編輯、刪除，並可轉為正式文章</div>
      </div>

      <SubmissionMergeClient ids={submissions.map((s) => s.id)} />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="grid gap-3">
          {submissions.map((s) => (
            <details key={s.id} className="group rounded-xl border border-white/10 bg-black/25 p-4">
              <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-white/85">{s.title}</div>
                    <div className="text-[11px] tracking-[0.2em] text-white/35">{s.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    {s.authorName ?? "匿名"} ·{" "}
                    {new Intl.DateTimeFormat("zh-Hant", { dateStyle: "medium", timeStyle: "short" }).format(s.createdAt)}
                  </div>
                </div>
              </summary>

                <div className="mt-4 grid gap-4">
                  <div className="flex flex-wrap justify-end gap-2">
                  <form action="/admin/submissions/set-status" method="post">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
                    >
                      通過
                    </button>
                  </form>
                  <form action="/admin/submissions/set-status" method="post">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/60 transition hover:border-red-400/30 hover:bg-red-900/30 hover:text-white/85"
                    >
                      拒絕
                    </button>
                  </form>
                </div>

                {s.thumbnailPath || s.videoPath ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {s.thumbnailPath ? (
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <div className="border-b border-white/10 px-4 py-3 text-xs tracking-[0.22em] text-white/45">縮圖</div>
                        <div className="relative aspect-video w-full bg-black">
                          <Image
                            src={s.thumbnailPath}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 640px, 100vw"
                            className="object-cover opacity-85"
                          />
                          <div className="pointer-events-none absolute inset-0 crack opacity-25" />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        </div>
                      </div>
                    ) : null}

                    {s.videoPath ? (
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <div className="border-b border-white/10 px-4 py-3 text-xs tracking-[0.22em] text-white/45">影片</div>
                        <video
                          src={s.videoPath}
                          poster={s.thumbnailPath ?? undefined}
                          controls
                          preload="metadata"
                          className="aspect-video w-full bg-black"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                    <div className="text-[11px] tracking-[0.2em] text-white/35">聯絡</div>
                    <div className="mt-2 break-words">{s.contact ?? "—"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                    <div className="text-[11px] tracking-[0.2em] text-white/35">分類建議</div>
                    <div className="mt-2 break-words">{s.categorySuggestion ?? "—"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                    <div className="text-[11px] tracking-[0.2em] text-white/35">ID</div>
                    <div className="mt-2 break-words">{s.id}</div>
                  </div>
                </div>

                <form action={updateSubmission} className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <input type="hidden" name="id" value={s.id} />
                  <div className="grid gap-2">
                    <div className="text-xs tracking-[0.22em] text-white/45">編輯投稿</div>
                    <input
                      name="title"
                      defaultValue={s.title}
                      className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                    />
                    <textarea
                      name="content"
                      defaultValue={s.content}
                      className="min-h-[160px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/85 outline-none focus:border-white/25"
                    />
                    <textarea
                      name="adminNotes"
                      defaultValue={s.adminNotes ?? ""}
                      placeholder="管理員備註（可選）"
                      className="min-h-[90px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/75 outline-none placeholder:text-white/25 focus:border-white/25"
                    />
                    <select
                      name="status"
                      defaultValue={s.status}
                      className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                    >
                      <option value="PENDING">待審</option>
                      <option value="APPROVED">通過</option>
                      <option value="REJECTED">拒絕</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
                    >
                      儲存投稿
                    </button>
                  </div>
                </form>

                <form action={createPostFromSubmission} className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <input type="hidden" name="submissionId" value={s.id} />
                  <div className="text-xs tracking-[0.22em] text-white/45">轉為文章</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      name="title"
                      defaultValue={s.title}
                      className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25 sm:col-span-2"
                      placeholder="文章標題"
                    />
                    <input
                      name="slug"
                      defaultValue={s.id.slice(0, 10)}
                      className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                      placeholder="slug"
                    />
                  </div>
                  <input
                    name="excerpt"
                    className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none focus:border-white/25"
                    placeholder="摘要（可選）"
                  />
                  <textarea
                    name="content"
                    defaultValue={s.content}
                    className="min-h-[160px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/85 outline-none focus:border-white/25"
                  />
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
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/55"
                    >
                      建立文章
                    </button>
                  </div>
                </form>

                <form action={deleteSubmission} className="flex justify-end">
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/60 transition hover:border-red-400/30 hover:bg-red-900/30 hover:text-white/85"
                  >
                    刪除投稿
                  </button>
                </form>
              </div>
            </details>
          ))}
          {submissions.length === 0 ? <div className="text-sm text-white/55">尚無投稿。</div> : null}
        </div>
      </div>
    </div>
  );
}
