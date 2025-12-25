import Link from "next/link";
import { requireAdmin } from "@/server/requireAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin } = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link href="/admin" className="text-sm tracking-[0.25em] text-white/80 hover:text-white">
              後台
            </Link>
            <div className="min-w-0 truncate text-xs tracking-[0.2em] text-white/35">{admin.username}</div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
            >
              前台
            </Link>
            <form
              action={async () => {
                "use server";
                const { clearAdminSession } = await import("@/server/session");
                const { logAudit } = await import("@/server/audit");
                await logAudit({ action: "admin_logout", entityType: "AdminUser", entityId: admin.id, adminUserId: admin.id });
                await clearAdminSession();
              }}
            >
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/70 transition hover:border-white/20 hover:bg-black/35 hover:text-white/90"
              >
                登出
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">{children}</main>
    </div>
  );
}
