"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { playClickTick, playHoverWhisper } from "@/components/horrorAudio";

type Category = { slug: string; name: string };

export function HamburgerSidebar({
  categories,
  titleTapToAdmin = false,
}: {
  categories: Category[];
  titleTapToAdmin?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const activeCategory = searchParams.get("category") ?? "";
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const applyParams = useCallback(
    (next: { q?: string; category?: string }) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (next.q !== undefined) {
        const v = next.q.trim();
        if (v) sp.set("q", v);
        else sp.delete("q");
      }
      if (next.category !== undefined) {
        const v = next.category.trim();
        if (v) sp.set("category", v);
        else sp.delete("category");
      }
      const qs = sp.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [router, searchParams],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      applyParams({ q });
      setOpen(false);
    },
    [applyParams, q],
  );

  const items = useMemo(() => [{ slug: "", name: "全部檔案" }, ...categories], [categories]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (titleTapToAdmin && e.key.toLowerCase() === "u" && e.ctrlKey && e.shiftKey) router.push("/admin/login");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, titleTapToAdmin]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="menu"
        className="group inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 backdrop-blur transition hover:border-white/20 hover:bg-black/40 active:scale-[0.98]"
        onClick={() => {
          void playClickTick();
          const next = !open;
          if (next) {
            setQ(searchParams.get("q") ?? "");
            void playHoverWhisper();
          }
          setOpen(next);
        }}
      >
        <span className="flex w-5 flex-col gap-1.5">
          <span className="h-0.5 w-full rounded bg-white/80 transition group-hover:bg-white" />
          <span className="h-0.5 w-full rounded bg-white/60 transition group-hover:bg-white/90" />
          <span className="h-0.5 w-full rounded bg-white/50 transition group-hover:bg-white/80" />
        </span>
      </button>

      {open && portalTarget
        ? createPortal(
            <div
              ref={overlayRef}
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[9999]"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
              <aside
                className="absolute left-0 top-0 flex h-full w-[320px] max-w-[86vw] flex-col overflow-hidden border-r border-white/10 bg-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pointer-events-none absolute inset-0 crack opacity-20 animate-pulse" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-transparent animate-pulse" />
                <div className="flex items-center justify-between px-5 py-5">
                  <div className="text-sm font-semibold tracking-[0.25em] text-white/80">檔案櫃</div>
                  <button
                    type="button"
                    className="h-9 rounded-lg px-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    關閉
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <form className="px-5" onSubmit={onSubmit}>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="搜尋：關鍵字、線索、地點…"
                      className="h-11 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-white/25"
                    />
                  </form>

                  <div className="mt-5 px-2">
                    {items.map((c) => {
                      const active = (c.slug || "") === activeCategory;
                      return (
                        <button
                          key={c.slug || "__all"}
                          type="button"
                          onClick={() => {
                            applyParams({ category: c.slug });
                            setOpen(false);
                          }}
                          className={[
                            "mx-2 my-1 flex w-[calc(100%-16px)] items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition",
                            active ? "bg-zinc-900 text-white" : "text-white/80 hover:bg-zinc-900 hover:text-white",
                          ].join(" ")}
                        >
                          <span className="tracking-wide">{c.name}</span>
                          <span className={active ? "text-[10px] text-red-300/80" : "text-[10px] text-white/25"}>▸</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        void playClickTick();
                        router.push("/random-case");
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-red-900/25 px-4 py-3 text-left text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/35"
                    >
                      <span className="tracking-wide">隨機案件</span>
                      <span className="text-[10px] tracking-[0.22em] text-red-200/80">DRAW</span>
                    </button>
                  </div>

                  <div className="mt-6 px-5 pb-6 text-xs leading-5 text-white/40">
                    <div>在黑暗裡，字句會回望你。</div>
                    {titleTapToAdmin ? <div className="mt-2">快速入口：`Ctrl`+`Shift`+`U`</div> : null}
                  </div>
                </div>
              </aside>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
