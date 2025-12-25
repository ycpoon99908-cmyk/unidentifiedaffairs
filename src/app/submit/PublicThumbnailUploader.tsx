"use client";

import NextImage from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { useCallback, useMemo, useRef, useState } from "react";

async function loadImage(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
  return img;
}

async function cropToDataUrlFixed(imageSrc: string, area: Area, outWidth = 1280, outHeight = 720) {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas_context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function PublicThumbnailUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (path: string) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!value) return "";
    return value.startsWith("/") ? value : "";
  }, [value]);

  const onSelectFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    const src = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("file_read_failed"));
      reader.readAsDataURL(file);
    });
    setImageSrc(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const onCancel = useCallback(() => {
    setImageSrc(null);
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const onConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setStatus("uploading");
    const dataUrl = await cropToDataUrlFixed(imageSrc, croppedAreaPixels).catch(() => null);
    if (!dataUrl) {
      setStatus("error");
      return;
    }
    const res = await fetch("/api/submissions/upload-image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setStatus("error");
      return;
    }
    const json = (await res.json().catch(() => null)) as { path?: string } | null;
    if (!json?.path) {
      setStatus("error");
      return;
    }
    onChange(json.path);
    setImageSrc(null);
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  }, [croppedAreaPixels, imageSrc, onChange]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs tracking-[0.22em] text-white/45">縮圖（可選）</div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onSelectFile}
            className="text-xs text-white/55 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-black/25 file:px-3 file:py-2 file:text-xs file:text-white/70 hover:file:border-white/20 hover:file:bg-black/35"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/60 transition hover:border-red-400/30 hover:bg-red-900/30 hover:text-white/85"
          >
            移除
          </button>
        </div>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
          <div className="relative h-40 w-full">
            <NextImage src={previewUrl} alt="" fill sizes="(min-width: 640px) 520px, 100vw" className="object-cover" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">未設定縮圖。</div>
      )}

      {imageSrc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold tracking-wide text-white/85">裁切縮圖（16:9，輸出 1280×720）</div>
              <button type="button" onClick={onCancel} className="text-sm text-white/60 hover:text-white/85">
                關閉
              </button>
            </div>

            <div className="relative h-[55vh] w-full bg-black sm:h-[420px]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full sm:max-w-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-5 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={status === "uploading"}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "uploading" ? "上傳中…" : "完成上傳"}
                </button>
              </div>
            </div>

            {status === "error" ? <div className="px-5 pb-5 text-sm text-red-200/80">上傳失敗，請再試一次。</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
