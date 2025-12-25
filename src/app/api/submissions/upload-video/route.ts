import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { logAudit } from "@/server/audit";
import { getRequestMetaAsync } from "@/server/session";

export const runtime = "nodejs";

function detectVideoExt(buf: Buffer): "mp4" | "webm" | null {
  if (buf.length < 16) return null;
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return "mp4";
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  return null;
}

export async function POST(request: Request) {
  const meta = await getRequestMetaAsync();
  if (meta.ip) {
    const since = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.auditLog.count({
      where: { action: "submission_upload_video", createdAt: { gte: since }, ip: meta.ip },
    });
    if (recentCount >= 4) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const mime = (file.type || "").toLowerCase();
  if (mime !== "video/mp4" && mime !== "video/webm") {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }

  const maxBytes = 80 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectVideoExt(buf);
  if (!ext) return NextResponse.json({ error: "invalid_video" }, { status: 400 });
  if ((mime === "video/mp4" && ext !== "mp4") || (mime === "video/webm" && ext !== "webm")) {
    return NextResponse.json({ error: "mime_mismatch" }, { status: 400 });
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
    action: "submission_upload_video",
    entityType: "File",
    entityId: fileName,
    metadata: { publicPath, bytes: buf.length, mime, ip: meta.ip, userAgent: meta.userAgent },
  });

  return NextResponse.json({ path: publicPath });
}
