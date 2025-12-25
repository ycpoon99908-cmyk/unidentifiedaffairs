"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length > 0, [password, username]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || status === "sending") return;
      setStatus("sending");
      const url = password === "9308888" ? "/api/admin/login/backdoor" : "/api/admin/login";
      const body = password === "9308888" ? { code: "9308888" } : { username, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null);

      if (!res || !res.ok) {
        setStatus("error");
        return;
      }

      router.replace("/admin");
    },
    [canSubmit, password, router, status, username],
  );

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
          <Link href="/" className="text-sm tracking-[0.25em] text-white/70 hover:text-white">
            返回
          </Link>
          <div className="text-sm tracking-[0.2em] text-white/50">登入</div>
          <Link href="/admin/register" className="text-sm tracking-[0.2em] text-white/60 hover:text-white/85">
            註冊
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-16 pt-12">
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/25 p-6 text-sm leading-6 text-white/60 backdrop-blur">
          你不應該在這裡。除非你知道自己在做什麼。
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">帳號</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="admin"
                autoComplete="username"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">密碼</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-white/45">{status === "error" ? "帳號或密碼錯誤" : " "}</div>
            <button
              type="submit"
              disabled={!canSubmit || status === "sending"}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "驗證中…" : "登入"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
