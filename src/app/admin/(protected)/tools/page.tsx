import { requireAdmin } from "@/server/requireAdmin";
import { restoreDatabase } from "./actions";

export default async function AdminToolsPage() {
  await requireAdmin();

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <div className="text-lg font-semibold text-white/90">管理工具</div>
        <div className="mt-1 text-sm text-white/55">資料庫備份與還原</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <div className="text-xs tracking-[0.22em] text-white/45">備份</div>
          <div className="mt-3 text-sm text-white/55">下載目前 SQLite 資料庫檔案。</div>
          <a
            href="/api/admin/db-backup"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/25 px-5 text-sm text-white/75 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
          >
            下載備份
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <div className="text-xs tracking-[0.22em] text-white/45">還原</div>
          <div className="mt-3 text-sm text-white/55">上傳 SQLite 備份檔案，寫回目前資料庫。完成後請重啟伺服器。</div>

          <form action={restoreDatabase} className="mt-4 grid gap-3">
            <input
              type="file"
              name="file"
              accept=".db,.sqlite,.sqlite3,application/x-sqlite3"
              className="block w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/75 file:mr-4 file:rounded-lg file:border-0 file:bg-black/30 file:px-3 file:py-2 file:text-sm file:text-white/70"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition hover:border-white/20 hover:bg-red-900/55"
            >
              執行還原
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

