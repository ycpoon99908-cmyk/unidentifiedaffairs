"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function SubmissionMergeClient({ ids }: { ids: string[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(() => ids.filter((id) => selected[id]), [ids, selected]);
  const href = useMemo(() => {
    const sp = new URLSearchParams();
    if (selectedIds.length) sp.set("ids", selectedIds.join(","));
    return `/admin/submissions/merge?${sp.toString()}`;
  }, [selectedIds]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white/85">內容整合</div>
          <div className="mt-1 text-xs text-white/45">勾選多篇投稿後合併編輯成新文章</div>
        </div>
        <Link
          href={href}
          className={[
            "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm transition",
            selectedIds.length
              ? "border-white/10 bg-red-900/40 text-white/85 hover:border-white/20 hover:bg-red-900/55"
              : "pointer-events-none border-white/5 bg-black/15 text-white/30",
          ].join(" ")}
        >
          合併（{selectedIds.length}）
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <label key={id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              className="h-4 w-4 accent-red-500"
              checked={!!selected[id]}
              onChange={(e) => setSelected((prev) => ({ ...prev, [id]: e.target.checked }))}
            />
            <span className="truncate">{id.slice(0, 8)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

