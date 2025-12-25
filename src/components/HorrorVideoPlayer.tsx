"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function HorrorVideoPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string | null;
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(1, Math.max(0, currentTime / duration));
  }, [currentTime, duration]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setShowUi(true);
    hideTimerRef.current = window.setTimeout(() => setShowUi(false), 2200);
  }, []);

  const syncFromVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setIsPlaying(!v.paused && !v.ended);
    setIsMuted(v.muted || v.volume === 0);
    setCurrentTime(Number.isFinite(v.currentTime) ? v.currentTime : 0);
    setDuration(Number.isFinite(v.duration) ? v.duration : 0);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = isMuted;
  }, [isMuted, volume]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoadedMetadata = () => {
      setIsReady(true);
      syncFromVideo();
    };
    const onTimeUpdate = () => syncFromVideo();
    const onPlay = () => syncFromVideo();
    const onPause = () => syncFromVideo();
    const onVolumeChange = () => syncFromVideo();

    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("volumechange", onVolumeChange);
    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("volumechange", onVolumeChange);
    };
  }, [syncFromVideo]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onFs = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const active = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(active);
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs as EventListener);
    };
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setShowUi(false), 2200);
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    scheduleHide();
    if (v.paused || v.ended) {
      await v.play().catch(() => null);
    } else {
      v.pause();
    }
  }, [scheduleHide]);

  const toggleMute = useCallback(() => {
    scheduleHide();
    setIsMuted((m) => !m);
  }, [scheduleHide]);

  const onVolume = useCallback(
    (next: number) => {
      scheduleHide();
      setVolume(next);
      if (next > 0) setIsMuted(false);
      if (next === 0) setIsMuted(true);
    },
    [scheduleHide],
  );

  const onSeek = useCallback(
    (nextProgress: number) => {
      const v = videoRef.current;
      if (!v || !duration) return;
      scheduleHide();
      const nextTime = Math.max(0, Math.min(duration, duration * nextProgress));
      v.currentTime = nextTime;
      syncFromVideo();
    },
    [duration, scheduleHide, syncFromVideo],
  );

  const requestFullscreen = useCallback(async () => {
    const el = containerRef.current;
    const v = videoRef.current;
    if (!el || !v) return;
    scheduleHide();
    const anyVideo = v as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        await el.requestFullscreen().catch(() => null);
        return;
      }
      if (anyVideo.webkitEnterFullscreen) {
        anyVideo.webkitEnterFullscreen();
      }
      return;
    }
    await document.exitFullscreen().catch(() => null);
  }, [scheduleHide]);

  const onKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        await togglePlay();
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        await requestFullscreen();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const v = videoRef.current;
        if (!v) return;
        scheduleHide();
        const delta = e.key === "ArrowRight" ? 5 : -5;
        v.currentTime = Math.max(0, Math.min(duration || 0, (v.currentTime || 0) + delta));
        syncFromVideo();
      }
    },
    [duration, requestFullscreen, scheduleHide, syncFromVideo, toggleMute, togglePlay],
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={scheduleHide}
      onPointerDown={scheduleHide}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 outline-none focus:border-white/25"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        preload="metadata"
        playsInline
        className="aspect-video w-full bg-black"
        onClick={togglePlay}
      />

      <div
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0",
          "bg-gradient-to-t from-black/85 via-black/35 to-transparent",
          showUi ? "opacity-100" : "opacity-0",
          "transition-opacity duration-200",
        ].join(" ")}
      >
        <div className="pointer-events-auto px-4 pb-4 pt-10">
          {title ? <div className="mb-2 line-clamp-1 text-xs tracking-[0.22em] text-white/55">{title}</div> : null}

          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => onSeek(Number(e.target.value) / 1000)}
            className="h-2 w-full cursor-pointer accent-red-300"
            aria-label="進度"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-black/35 px-4 text-xs tracking-[0.2em] text-white/80 transition hover:border-white/20 hover:bg-black/45 hover:text-white"
                aria-label={isPlaying ? "暫停" : "播放"}
              >
                {isPlaying ? "暫停" : "播放"}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-black/35 px-4 text-xs tracking-[0.2em] text-white/75 transition hover:border-white/20 hover:bg-black/45 hover:text-white"
                aria-label={isMuted ? "取消靜音" : "靜音"}
              >
                {isMuted ? "靜音中" : "音量"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((isMuted ? 0 : volume) * 100)}
                onChange={(e) => onVolume(Number(e.target.value) / 100)}
                className="h-2 w-28 cursor-pointer accent-red-300"
                aria-label="音量"
              />
              <div className="text-xs text-white/55 tabular-nums">
                {formatTime(currentTime)} / {isReady ? formatTime(duration) : "—:—"}
              </div>
            </div>

            <button
              type="button"
              onClick={requestFullscreen}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-red-900/35 px-4 text-xs tracking-[0.2em] text-white/85 transition hover:border-white/20 hover:bg-red-900/50 hover:text-white"
              aria-label={isFullscreen ? "離開全螢幕" : "全螢幕"}
            >
              {isFullscreen ? "退出" : "全螢幕"}
            </button>
          </div>
        </div>
      </div>

      <div
        className={[
          "pointer-events-none absolute inset-0",
          "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-[radial-gradient(circle_at_20%_10%,rgba(255,0,0,0.08),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.05),transparent_55%)]",
        ].join(" ")}
        aria-hidden="true"
      />
    </div>
  );
}
