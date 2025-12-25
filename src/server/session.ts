import crypto from "crypto";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "__Host_ua";

type SessionPayload = {
  adminUserId: string;
  username: string;
  exp: number;
};

function base64UrlEncode(input: Buffer) {
  return input
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecodeToBuffer(input: string) {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function sign(data: string, secret: string) {
  return base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest());
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function getRequestMetaAsync() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
  const userAgent = h.get("user-agent") || undefined;
  return { ip, userAgent };
}

export async function setAdminSession(
  payload: { adminUserId: string; username: string },
  maxAgeSeconds = 60 * 60 * 24,
) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const body: SessionPayload = { ...payload, exp };
  const data = base64UrlEncode(Buffer.from(JSON.stringify(body), "utf8"));
  const sig = sign(data, secret);
  const value = `${data}.${sig}`;

  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  const expected = sign(data, secret);
  if (!timingSafeEqual(sig, expected)) return null;
  const payload = JSON.parse(base64UrlDecodeToBuffer(data).toString("utf8")) as SessionPayload;
  if (!payload?.adminUserId || !payload?.username || !payload?.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
