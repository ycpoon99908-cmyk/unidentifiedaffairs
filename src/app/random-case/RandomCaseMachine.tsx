"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { playClickTick, playHoverWhisper } from "@/components/horrorAudio";
import { playEnvelopeTransition } from "@/components/transitions/envelope";

type RandomPost = {
  title: string;
  slug: string;
  preview: string;
  thumbnailPath: string | null;
  publishedAt: string | null;
  category: { name: string; slug: string } | null;
  views: number;
  commentCount: number;
};

function envelopeTriangleStyle(direction: "top" | "bottomLeft" | "bottomRight") {
  if (direction === "top") return { clipPath: "polygon(0 0, 100% 0, 50% 62%)" } as const;
  if (direction === "bottomLeft") return { clipPath: "polygon(0 100%, 50% 38%, 0 0)" } as const;
  return { clipPath: "polygon(100% 100%, 50% 38%, 100% 0)" } as const;
}

export function RandomCaseMachine() {
  const router = useRouter();
  const [post, setPost] = useState<RandomPost | null>(null);
  const [opened, setOpened] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [mixing, setMixing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [drawnSlugs, setDrawnSlugs] = useState<string[]>([]);

  const excludeParam = useMemo(() => {
    if (!drawnSlugs.length) return "";
    return drawnSlugs.map((s) => encodeURIComponent(s)).join(",");
  }, [drawnSlugs]);

  const draw = useCallback(async () => {
    if (drawing) return;
    const mixStartedAt = Date.now();
    setDrawing(true);
    setMixing(true);
    setErrorText("");
    setOpened(false);
    setPost(null);

    const res = await fetch(`/api/posts/random${excludeParam ? `?exclude=${excludeParam}` : ""}`, { cache: "no-store" }).catch(() => null);
    const json = res
      ? ((await res.json().catch(() => null)) as { post?: RandomPost; error?: string } | null)
      : null;

    const elapsed = Date.now() - mixStartedAt;
    const minMixMs = 900;
    if (elapsed < minMixMs) {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), minMixMs - elapsed);
      });
    }

    if (!res || !json || !res.ok) {
      const isEmpty = json?.error === "empty" || res?.status === 404;
      if (isEmpty) {
        setDrawnSlugs([]);
        setErrorText("檔案櫃被你翻完了。再抽一次會重新洗牌。");
      } else {
        setErrorText("抽取失敗。請稍後再試。");
      }
      setMixing(false);
      setDrawing(false);
      return;
    }

    if (json.post) {
      const slug = json.post.slug;
      if (slug) {
        setDrawnSlugs((prev) => (prev.includes(slug) ? prev : [slug, ...prev].slice(0, 40)));
      }
      setPost(json.post);
    }
    setMixing(false);
    setDrawing(false);
  }, [drawing, excludeParam]);

  const openArticle = useCallback(async () => {
    if (!post) return;
    await playEnvelopeTransition();
    router.push(`/posts/${encodeURIComponent(post.slug)}`);
  }, [post, router]);

  useEffect(() => {
    if (!post) return;
    const id = window.setTimeout(() => {
      setOpened(true);
    }, 540);
    return () => window.clearTimeout(id);
  }, [post]);

  const headerMeta = useMemo(() => {
    if (!post) return null;
    const parts: string[] = [];
    if (post.category?.name) parts.push(post.category.name);
    if (post.publishedAt) {
      const d = new Date(post.publishedAt);
      if (!Number.isNaN(d.getTime())) parts.push(new Intl.DateTimeFormat("zh-Hant", { dateStyle: "medium" }).format(d));
    }
    return parts.join(" · ");
  }, [post]);

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs tracking-[0.22em] text-white/45">隨機案件</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide text-white/90">隨機抽取案件</div>
            <div className="mt-2 max-w-2xl text-sm leading-6 text-white/55">攪珠完成後，信封會吐出一份檔案。你可以重抽，也可以拆封閱讀。</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onMouseEnter={() => void playHoverWhisper()}
              onClick={() => void draw()}
              disabled={drawing}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {post ? (drawing ? "抽取中…" : "再次抽取") : drawing ? "抽取中…" : "抽取案件"}
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-5 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              返回檔案室
            </Link>
          </div>
        </div>
        <div className="mt-4 text-xs text-white/45">{errorText || " "}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur lg:col-span-2">
          <div className="grid place-items-center py-8">
            <div className="relative w-[320px] max-w-[92vw]">
              <div
                className={[
                  "relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl",
                  "transition-transform duration-500",
                  drawing ? "scale-[0.99]" : "scale-100",
                ].join(" ")}
              >
                <div className="pointer-events-none absolute inset-0 crack opacity-20" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(122,11,21,0.22),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.05),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.62))]" />

                <div className="relative h-[240px]">
                  {mixing ? (
                    <div className="absolute inset-0 z-30 grid place-items-center">
                      <div className="ua-mix-drum" aria-hidden="true">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <span
                            key={i}
                            className="ua-mix-bead"
                            style={{
                              ["--i" as never]: String(i),
                              ["--h" as never]: String(4 + ((i * 17) % 12)),
                              ["--t" as never]: `${1400 + (i % 6) * 180}ms`,
                              ["--d" as never]: `${-(i * 120)}ms`,
                              ["--s" as never]: `${6 + (i % 4) * 2}px`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-16 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs tracking-[0.22em] text-white/75 backdrop-blur">
                          <span className="inline-flex h-2 w-2 rounded-full bg-red-300/70 ua-mix-pulse" />
                          正在為你調取案件
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div
                    className={[
                      "absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
                      "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]",
                      "transition-transform duration-700 ease-out",
                      post && opened ? "-translate-y-5" : "translate-y-10",
                    ].join(" ")}
                  >
                    <div className={["px-4 py-4 transition-opacity duration-500", post && opened ? "opacity-100" : "opacity-0"].join(" ")}>
                      {post ? (
                        <div className="grid gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] tracking-[0.22em] text-white/45">{headerMeta || "未知檔案"}</div>
                            <div className="text-[11px] tracking-[0.18em] text-white/35">
                              觀看 {post.views.toLocaleString("zh-Hant")} · 留言 {post.commentCount.toLocaleString("zh-Hant")}
                            </div>
                          </div>
                          <div className="text-base font-semibold leading-7 text-white/90">{post.title}</div>
                          <div className="text-sm leading-6 text-white/65">{post.preview || "未留下摘要。你得親自拆開內容。"} </div>
                        </div>
                      ) : (
                        <div className="px-1 py-1 text-sm text-white/55">信封裡還是空的。</div>
                      )}
                    </div>
                    <div className="pointer-events-none absolute inset-x-4 top-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 top-0 h-[56%] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0))]" style={envelopeTriangleStyle("top")} />
                    <div className="absolute bottom-0 left-0 h-[58%] w-[54%] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0))]" style={envelopeTriangleStyle("bottomLeft")} />
                    <div className="absolute bottom-0 right-0 h-[58%] w-[54%] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0))]" style={envelopeTriangleStyle("bottomRight")} />
                    <div className="absolute inset-x-0 bottom-0 h-[52%] border-t border-white/10 bg-black/10" />
                  </div>

                  <div
                    className={[
                      "absolute left-1/2 top-[54%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10",
                      "bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.14),rgba(122,11,21,0.55)_55%,rgba(0,0,0,0.75)_100%)]",
                      "shadow-[0_18px_60px_rgba(0,0,0,0.7)]",
                      "grid place-items-center",
                      "transition-opacity duration-700",
                      post ? "opacity-100" : "opacity-60",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    <div className="text-xs font-semibold tracking-[0.22em] text-white/80 pl-[0.22em]">N</div>
                  </div>

                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    void playClickTick();
                    if (!post) return;
                    setOpened((v) => !v);
                  }}
                  disabled={!post || mixing}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 px-5 text-sm text-white/75 transition enabled:hover:border-white/20 enabled:hover:bg-black/40 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {opened ? "闔上信封" : "打開信封"}
                </button>
                <button
                  type="button"
                  onClick={() => void openArticle()}
                  disabled={!post || mixing}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/35 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  打開文章
                </button>
              </div>

              <div className="pointer-events-none mt-4 grid gap-2 text-center text-xs tracking-[0.18em] text-white/35">
                <div>抽取規則：只會從已發佈檔案中抽出 1 份。</div>
                <div>為了不重複，系統會先避開你本次已抽過的檔案。</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <div className="text-xs tracking-[0.22em] text-white/45">抽獎記錄</div>
          <div className="mt-3 text-sm text-white/55">本次已抽 {drawnSlugs.length.toLocaleString("zh-Hant")} 份</div>
          <div className="mt-4 grid gap-2">
            {drawnSlugs.length ? (
              drawnSlugs.slice(0, 10).map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    void playClickTick();
                    router.push(`/posts/${encodeURIComponent(slug)}`);
                  }}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-left text-xs text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white"
                >
                  <span className="truncate tracking-[0.12em]">{slug}</span>
                  <span className="text-[10px] text-white/30">OPEN</span>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-white/55">尚未抽取任何檔案。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
