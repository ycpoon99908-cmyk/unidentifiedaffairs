import Link from "next/link";
import { RandomCaseMachine } from "./RandomCaseMachine";

export default function RandomCasePage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="text-sm tracking-[0.25em] text-white/70 hover:text-white">
              返回
            </Link>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-[0.25em] text-white/80">隨機案件</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/submit"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/80 transition hover:border-white/20 hover:bg-black/35 hover:text-white"
            >
              投稿
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white/80 transition hover:border-white/20 hover:bg-black/35 hover:text-white"
            >
              登入
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <RandomCaseMachine />
      </main>
    </div>
  );
}

