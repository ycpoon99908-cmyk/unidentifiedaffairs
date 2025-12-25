"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export function PublicVideoUploader({
  value,
  onChange,
  poster,
}: {
  value: string;
  onChange: (path: string) => void;
  poster?: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [lastError, setLastError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!value) return "";
    return value.startsWith("/") ? value : "";
  }, [value]);

  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setLastError("");

    const body = new FormData();
    body.set("file", file);

    const res = await fetch("/api/submissions/upload-video", { method: "POST", body }).catch(() => null);
    if (!res || !res.ok) {
      const json = (await res?.json().catch(() => null)) as { error?: string } | null;
      setLastError(json?.error || "upload_failed");
      setStatus("error");
      return;
    }

    const json = (await res.json().catch(() => null)) as { path?: string } | null;
    if (!json?.path) {
      setLastError("upload_failed");
      setStatus("error");
      return;
    }

    onChange(json.path);
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  }, [onChange]);

  const onClear = useCallback(() => {
    onChange("");
    setStatus("idle");
    setLastError("");
    if (fileRef.current) fileRef.current.value = "";
  }, [onChange]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs tracking-[0.22em] text-white/45">影片（可選）</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={onSelectFile}
            disabled={status === "uploading"}
            className="text-xs text-white/55 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-black/25 file:px-3 file:py-2 file:text-xs file:text-white/70 hover:file:border-white/20 hover:file:bg-black/35 disabled:opacity-60"
          />
          {previewUrl ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-xs text-white/65 transition hover:border-white/20 hover:bg-black/35 hover:text-white/85"
            >
              移除
            </button>
          ) : null}
        </div>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          <video
            src={previewUrl}
            poster={poster}
            controls
            preload="metadata"
            className="aspect-video w-full bg-black"
          />
        </div>
      ) : null}

      {status === "uploading" ? <div className="text-sm text-white/55">上傳中…</div> : null}
      {status === "error" ? (
        <div className="text-sm text-red-200/85">
          上傳失敗。{lastError ? <span className="text-red-200/60">（{lastError}）</span> : null}
        </div>
      ) : null}
    </div>
  );
}

