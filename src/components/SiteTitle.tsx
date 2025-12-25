"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

function SiteLogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="未知事務所">
      <defs>
        <linearGradient id="uaPaper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9b98e" />
          <stop offset="0.35" stopColor="#caa777" />
          <stop offset="1" stopColor="#b98a56" />
        </linearGradient>
        <radialGradient id="uaFog" cx="35%" cy="22%" r="75%">
          <stop offset="0" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="0.55" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.22)" />
        </radialGradient>
        <linearGradient id="uaStamp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5b5b" stopOpacity="0.08" />
          <stop offset="0.4" stopColor="#b60f1f" stopOpacity="0.95" />
          <stop offset="1" stopColor="#7a0b15" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="uaWax" cx="35%" cy="30%" r="72%">
          <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="0.55" stopColor="rgba(122,11,21,0.86)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.82)" />
        </radialGradient>
        <filter id="uaShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="rgba(0,0,0,0.55)" />
        </filter>
        <filter id="uaGrain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.65  0 0 0 0 0.5  0 0 0 0.22 0" />
        </filter>
      </defs>

      <rect x="18" y="18" width="476" height="476" rx="28" fill="url(#uaPaper)" />
      <rect x="18" y="18" width="476" height="476" rx="28" fill="url(#uaFog)" opacity="0.9" />
      <rect x="18" y="18" width="476" height="476" rx="28" filter="url(#uaGrain)" opacity="0.12" />

      <g transform="translate(0 0)">
        <g transform="rotate(-14 352 106)">
          <rect x="270" y="66" width="208" height="72" rx="10" fill="rgba(122,11,21,0.12)" />
          <rect x="278" y="74" width="192" height="56" rx="8" fill="none" stroke="url(#uaStamp)" strokeWidth="6" />
          <text
            x="374"
            y="115"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial"
            fontWeight="800"
            fontSize="36"
            letterSpacing="2"
            fill="#7a0b15"
          >
            TOP SECRET
          </text>
        </g>
      </g>

      <g>
        <text
          x="256"
          y="274"
          textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial"
          fontWeight="800"
          fontSize="56"
          letterSpacing="12"
          fill="#7a0b15"
        >
          未知事務所
        </text>
        <text
          x="256"
          y="324"
          textAnchor="middle"
          fontFamily={'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'}
          fontWeight="700"
          fontSize="22"
          letterSpacing="6"
          fill="#7a0b15"
          opacity="0.9"
        >
          UNIDENTIFIEDAFFAIRS
        </text>
      </g>

      <g filter="url(#uaShadow)">
        <path
          d="M120 396c22-18 44-23 62-12 14 9 26 28 30 50 3 18-1 34-12 45-17 17-46 20-74 6-31-15-48-54-35-89 5-14 14-24 29-31z"
          fill="rgba(122,11,21,0.12)"
        />
        <circle cx="132" cy="412" r="60" fill="url(#uaWax)" />
        <path
          d="M86 426c18 8 27 21 34 35 5 10 14 12 20 4 10-14 29-32 55-40 14-4 21-16 12-22-12-8-38-21-63-18-28 3-47 16-58 33z"
          fill="rgba(0,0,0,0.12)"
          opacity="0.55"
        />
        <circle cx="110" cy="392" r="18" fill="rgba(255,255,255,0.12)" opacity="0.8" />
        <circle cx="154" cy="448" r="10" fill="rgba(255,255,255,0.08)" opacity="0.7" />
        <circle cx="178" cy="420" r="6" fill="rgba(255,255,255,0.08)" opacity="0.7" />
      </g>

      <rect x="18" y="18" width="476" height="476" rx="28" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="4" />
    </svg>
  );
}

export function SiteTitle() {
  const router = useRouter();
  const tapsRef = useRef<number[]>([]);

  const onTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current = tapsRef.current.filter((t) => now - t < 4000);
    tapsRef.current.push(now);
    if (tapsRef.current.length >= 7) {
      tapsRef.current = [];
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <button type="button" onClick={onTap} className="group inline-flex select-none items-center gap-3 text-left">
      <SiteLogoMark className="h-11 w-11 overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-2xl transition group-hover:border-white/20 group-hover:bg-black/30" />
      <div className="min-w-0">
        <div className="text-sm tracking-[0.3em] text-white/80">未知事務所</div>
        <div className="text-[11px] tracking-[0.22em] text-white/35">UNIDENTIFIED AFFAIRS</div>
      </div>
    </button>
  );
}
