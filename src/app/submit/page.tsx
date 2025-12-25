"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicThumbnailUploader } from "./PublicThumbnailUploader";
import { PublicVideoUploader } from "./PublicVideoUploader";

type Category = { id: string; name: string; slug: string; order: number };

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [contact, setContact] = useState("");
  const [categorySuggestion, setCategorySuggestion] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [thumbnailPath, setThumbnailPath] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const titleLen = useMemo(() => title.trim().length, [title]);
  const contentLen = useMemo(() => content.trim().length, [content]);
  const canSubmit = useMemo(() => titleLen >= 2 && contentLen >= 20, [contentLen, titleLen]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.categories) ? (data.categories as Category[]) : [];
        setCategories(list);
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || status === "sending") return;
      setStatus("sending");
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          authorName: authorName.trim() || undefined,
          contact: contact.trim() || undefined,
          categorySuggestion: categorySuggestion.trim() || undefined,
          thumbnailPath: thumbnailPath || undefined,
          videoPath: videoPath || undefined,
        }),
      }).catch(() => null);
      if (!res || !res.ok) {
        setStatus("error");
        return;
      }
      setStatus("ok");
      setTitle("");
      setContent("");
      setAuthorName("");
      setContact("");
      setCategorySuggestion("");
      setThumbnailPath("");
      setVideoPath("");
    },
    [authorName, canSubmit, categorySuggestion, contact, content, status, title, thumbnailPath, videoPath],
  );

  return (
    <div className="min-h-dvh">
      {status === "sending" ? <div className="ua-sending-overlay" aria-hidden="true" /> : null}
      <header className="border-b border-white/10 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
          <Link href="/" className="text-sm tracking-[0.25em] text-white/70 hover:text-white">
            返回
          </Link>
          <div className="text-sm tracking-[0.2em] text-white/50">投稿</div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10">
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/25 p-6 text-sm leading-6 text-white/60 backdrop-blur">
          你的內容會先進入審核區，通過後才會公開。請避免填入敏感個資；必要時可使用匿名。
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <div className="grid grid-cols-1 gap-4">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">標題</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="例如：凌晨四點的敲門聲"
              />
              <div className="text-xs text-white/35">至少 2 字（目前 {titleLen}）</div>
            </label>

            <div className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">文章縮圖（選擇後裁切，輸出 1280×720）</span>
              <PublicThumbnailUploader value={thumbnailPath} onChange={setThumbnailPath} />
            </div>

            <div className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">影片（MP4 / WebM）</span>
              <PublicVideoUploader value={videoPath} onChange={setVideoPath} poster={thumbnailPath || undefined} />
            </div>

            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">內容</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[220px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="請詳述時間、地點、經過與任何你記得的細節。"
              />
              <div className="text-xs text-white/35">至少 20 字（目前 {contentLen}）</div>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.22em] text-white/45">署名（可選）</span>
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                  placeholder="匿名"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.22em] text-white/45">聯絡方式（可選）</span>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                  placeholder="Email / 其他"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.22em] text-white/45">主題（可選）</span>
                <select
                  value={categorySuggestion}
                  onChange={(e) => setCategorySuggestion(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                >
                  <option value="">未選擇</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-xs text-white/45">
              {status === "ok"
                ? "已送出。等待審核。"
                : status === "error"
                  ? "送出失敗，請稍後再試。"
                  : !canSubmit
                    ? "標題需至少 2 字、內容需至少 20 字。"
                    : " "}
            </div>
            <button
              type="submit"
              disabled={!canSubmit || status === "sending"}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "送出中…" : "送出投稿"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
