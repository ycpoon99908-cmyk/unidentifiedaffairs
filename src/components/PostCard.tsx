"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";
import { playHoverWhisper } from "@/components/horrorAudio";
import { playEnvelopeTransition } from "@/components/transitions/envelope";

export function PostCard({
  title,
  excerpt,
  slug,
  category,
  thumbnailPath,
}: {
  title: string;
  excerpt?: string | null;
  slug: string;
  category?: { name: string; slug: string } | null;
  thumbnailPath?: string | null;
}) {
  const router = useRouter();
  const lastPlayedAtRef = useRef<number>(0);
  const href = useMemo(() => `/posts/${encodeURIComponent(slug)}`, [slug]);

  const onHover = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayedAtRef.current < 240) return;
    lastPlayedAtRef.current = now;
    void playHoverWhisper();
  }, []);

  const onClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      await playEnvelopeTransition();
      router.push(href);
    },
    [href, router],
  );

  return (
    <a
      href={href}
      onMouseEnter={onHover}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 backdrop-blur transition hover:border-white/20 hover:bg-black/35"
    >
      {thumbnailPath ? (
        <div className="relative h-36 w-full overflow-hidden border-b border-white/10">
          <Image
            src={thumbnailPath}
            alt=""
            fill
            sizes="(min-width: 1024px) 350px, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-80 transition group-hover:opacity-95"
          />
          <div className="pointer-events-none absolute inset-0 crack" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      ) : (
        <div className="relative h-36 w-full overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/25 to-black/50" />
          <div className="pointer-events-none absolute inset-0 crack" />
        </div>
      )}
      <div className="relative p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[11px] tracking-[0.25em] text-white/45">
            {category?.name ?? "未知"}
          </div>
          <div className="text-[11px] tracking-[0.2em] text-red-300/60 opacity-0 transition group-hover:opacity-100">
            OPEN
          </div>
        </div>
        <h3 className="text-lg font-semibold leading-7 text-white/92 transition group-hover:text-white">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55 transition group-hover:text-white/70">
          {excerpt || "未留下摘要。"}
        </p>
      </div>
    </a>
  );
}
