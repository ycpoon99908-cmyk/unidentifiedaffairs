"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApiComment = {
  id: string;
  authorName: string | null;
  content: string;
  createdAt: string;
};

export function PostEngagement({
  slug,
  initialViews,
  initialCommentTotal,
}: {
  slug: string;
  initialViews: number;
  initialCommentTotal: number;
}) {
  const [views, setViews] = useState(initialViews);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [total, setTotal] = useState(initialCommentTotal);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");

  const postSlug = useMemo(() => encodeURIComponent(slug), [slug]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setErrorText("");
    const res = await fetch(`/api/posts/${postSlug}/comments?take=30`).catch(() => null);
    const json = res ? ((await res.json().catch(() => null)) as { comments?: ApiComment[]; total?: number } | null) : null;
    if (!res || !res.ok || !json) {
      setLoading(false);
      setErrorText("讀取留言失敗。");
      return;
    }
    setComments(Array.isArray(json.comments) ? json.comments : []);
    setTotal(typeof json.total === "number" ? json.total : 0);
    setLoading(false);
  }, [postSlug]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/posts/${postSlug}/view`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { views?: number } | null) => {
        if (cancelled) return;
        if (typeof data?.views === "number") setViews(data.views);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/posts/${postSlug}/comments?take=30`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { comments?: ApiComment[]; total?: number } | null) => {
        if (cancelled) return;
        if (!data) {
          setErrorText("讀取留言失敗。");
          setLoading(false);
          return;
        }
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorText("讀取留言失敗。");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  const canSubmit = useMemo(() => content.trim().length >= 1 && content.trim().length <= 1200 && !sending, [content, sending]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setSending(true);
      setErrorText("");

      const payload: { authorName?: string; content: string } = { content };
      const name = authorName.trim();
      if (name) payload.authorName = name;

      const res = await fetch(`/api/posts/${postSlug}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);

      const json = res ? ((await res.json().catch(() => null)) as { comment?: ApiComment; error?: string } | null) : null;
      if (!res || !json || !res.ok) {
        const next = json?.error === "rate_limited" ? "留言太頻繁，請稍後再試。" : "送出留言失敗。";
        setErrorText(next);
        setSending(false);
        return;
      }

      if (json.comment) {
        setComments((prev) => [json.comment as ApiComment, ...prev].slice(0, 30));
        setTotal((t) => t + 1);
      }
      setContent("");
      setSending(false);
    },
    [authorName, canSubmit, content, postSlug],
  );

  return (
    <section className="mt-6 grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs tracking-[0.22em] text-white/45">觀看次數</div>
          <div className="text-sm text-white/80">{views.toLocaleString("zh-Hant")}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="text-lg font-semibold text-white/90">留言</div>
          <div className="text-xs tracking-[0.18em] text-white/45">{total.toLocaleString("zh-Hant")} 則</div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="grid gap-2 sm:col-span-1">
              <span className="text-xs tracking-[0.22em] text-white/45">署名（可選）</span>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="匿名"
              />
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-xs tracking-[0.22em] text-white/45">內容</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[110px] resize-y rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="留下你的目擊紀錄…"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-xs text-white/45">{errorText || " "}</div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void loadComments()}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-5 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
              >
                重新整理
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "送出中…" : "送出留言"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 grid gap-3">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-white/55">讀取中…</div>
          ) : comments.length ? (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs tracking-[0.2em] text-white/45">{c.authorName?.trim() || "匿名"}</div>
                  <div className="text-[11px] tracking-[0.18em] text-white/35">
                    {new Intl.DateTimeFormat("zh-Hant", { dateStyle: "medium", timeStyle: "short" }).format(new Date(c.createdAt))}
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/80">{c.content}</div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-white/55">還沒有留言。</div>
          )}
        </div>
      </div>
    </section>
  );
}
