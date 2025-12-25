import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/server/adminApi";
import { logAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { getRequestMetaAsync } from "@/server/session";

export const runtime = "nodejs";

const UploadSchema = z.object({
  dataUrl: z.string().min(10).max(10_000_000),
});

function detectExt(buf: Buffer): "png" | "jpg" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50)
    return "webp";
  return null;
}

function readUInt32BE(buf: Buffer, offset: number) {
  return ((buf[offset] ?? 0) << 24) | ((buf[offset + 1] ?? 0) << 16) | ((buf[offset + 2] ?? 0) << 8) | (buf[offset + 3] ?? 0);
}

function readUInt16BE(buf: Buffer, offset: number) {
  return ((buf[offset] ?? 0) << 8) | (buf[offset + 1] ?? 0);
}

function getPngSize(buf: Buffer) {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  if (buf[12] !== 0x49 || buf[13] !== 0x48 || buf[14] !== 0x44 || buf[15] !== 0x52) return null;
  const width = readUInt32BE(buf, 16);
  const height = readUInt32BE(buf, 20);
  if (!width || !height) return null;
  return { width, height };
}

function getJpegSize(buf: Buffer) {
  if (buf.length < 4) return null;
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (!marker) return null;
    if (marker === 0xd9 || marker === 0xda) return null;
    const len = readUInt16BE(buf, i + 2);
    if (len < 2) return null;
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      const height = readUInt16BE(buf, i + 5);
      const width = readUInt16BE(buf, i + 7);
      if (!width || !height) return null;
      return { width, height };
    }
    i += 2 + len;
  }
  return null;
}

function getWebpSize(buf: Buffer) {
  if (buf.length < 30) return null;
  if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return null;
  if (buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50) return null;
  const chunk = String.fromCharCode(buf[12] ?? 0, buf[13] ?? 0, buf[14] ?? 0, buf[15] ?? 0);
  if (chunk === "VP8X") {
    if (buf.length < 30) return null;
    const widthMinus1 = (buf[24] ?? 0) | ((buf[25] ?? 0) << 8) | ((buf[26] ?? 0) << 16);
    const heightMinus1 = (buf[27] ?? 0) | ((buf[28] ?? 0) << 8) | ((buf[29] ?? 0) << 16);
    const width = widthMinus1 + 1;
    const height = heightMinus1 + 1;
    if (!width || !height) return null;
    return { width, height };
  }
  if (chunk === "VP8 ") {
    if (buf.length < 30) return null;
    const start = 20;
    if (buf[start] !== 0x9d || buf[start + 1] !== 0x01 || buf[start + 2] !== 0x2a) return null;
    const width = ((buf[start + 3] ?? 0) | ((buf[start + 4] ?? 0) << 8)) & 0x3fff;
    const height = ((buf[start + 5] ?? 0) | ((buf[start + 6] ?? 0) << 8)) & 0x3fff;
    if (!width || !height) return null;
    return { width, height };
  }
  if (chunk === "VP8L") {
    if (buf.length < 25) return null;
    if (buf[20] !== 0x2f) return null;
    const b0 = buf[21] ?? 0;
    const b1 = buf[22] ?? 0;
    const b2 = buf[23] ?? 0;
    const b3 = buf[24] ?? 0;
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    if (!width || !height) return null;
    return { width, height };
  }
  return null;
}

function getImageSize(buf: Buffer, ext: "png" | "jpg" | "webp") {
  if (ext === "png") return getPngSize(buf);
  if (ext === "jpg") return getJpegSize(buf);
  return getWebpSize(buf);
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const meta = await getRequestMetaAsync();
  if (meta.ip) {
    const since = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.auditLog.count({
      where: { action: "upload_image", adminUserId: auth.admin.id, createdAt: { gte: since }, ip: meta.ip },
    });
    if (recentCount >= 10) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = UploadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const match = parsed.data.dataUrl.match(/^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return NextResponse.json({ error: "unsupported_type" }, { status: 400 });

  const mime = match[1] as "image/png" | "image/jpeg" | "image/webp";
  const b64 = match[2];
  const buf = Buffer.from(b64, "base64");
  if (buf.length === 0 || buf.length > 2_500_000) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const ext = detectExt(buf);
  if (!ext) return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  if ((mime === "image/png" && ext !== "png") || (mime === "image/jpeg" && ext !== "jpg") || (mime === "image/webp" && ext !== "webp")) {
    return NextResponse.json({ error: "mime_mismatch" }, { status: 400 });
  }

  const size = getImageSize(buf, ext);
  if (!size) return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  const maxDimension = 4096;
  const maxPixels = 8_000_000;
  if (size.width > maxDimension || size.height > maxDimension || size.width * size.height > maxPixels) {
    return NextResponse.json({ error: "too_large_dimensions" }, { status: 413 });
  }

  const fileName = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
  let publicPath: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(fileName, buf, { access: "public", contentType: mime, token: process.env.BLOB_READ_WRITE_TOKEN });
    publicPath = blob.url;
  } else {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buf, { flag: "wx" });
    publicPath = `/uploads/${fileName}`;
  }
  await logAudit({
    action: "upload_image",
    entityType: "File",
    entityId: fileName,
    adminUserId: auth.admin.id,
    metadata: { publicPath, bytes: buf.length, width: size.width, height: size.height, mime },
  });

  return NextResponse.json({ path: publicPath });
}
