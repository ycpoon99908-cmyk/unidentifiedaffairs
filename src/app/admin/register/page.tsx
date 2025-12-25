"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const canSubmit = useMemo(() => {
    if (status === "sending") return false;
    if (username.trim().length <= 0) return false;
    if (password.length <= 0) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [confirmPassword, password, status, username]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || status === "sending") return;
      setStatus("sending");
      setErrorText("");

      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      }).catch(() => null);

      if (!res || !res.ok) {
        const json = (await res?.json().catch(() => null)) as { error?: string } | null;
        const code = json?.error || "register_failed";
        if (code === "username_taken") setErrorText("帳號已被使用");
        else if (code === "invalid_input") setErrorText("輸入格式不正確");
        else setErrorText("註冊失敗");
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
          <div className="text-sm tracking-[0.2em] text-white/50">註冊</div>
          <Link href="/admin/login" className="text-sm tracking-[0.2em] text-white/60 hover:text-white/85">
            登入
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-16 pt-12">
        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">帳號</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="username"
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
                autoComplete="new-password"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs tracking-[0.22em] text-white/45">確認密碼</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-white/25"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-white/45">{status === "error" ? errorText || "註冊失敗" : " "}</div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-red-900/40 px-5 text-sm text-white/85 transition enabled:hover:border-white/20 enabled:hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "建立中…" : "建立帳號"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
