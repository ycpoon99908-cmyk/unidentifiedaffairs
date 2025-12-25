"use server";

import fs from "fs/promises";
import path from "path";
import { requireAdmin } from "@/server/requireAdmin";
import { logAudit } from "@/server/audit";

function getSqliteFilePath() {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) throw new Error("unsupported_database_url");
  const withoutProtocol = raw.slice("file:".length);
  const noQuery = withoutProtocol.split("?")[0] ?? "";
  const p = noQuery.startsWith("/") ? noQuery : path.resolve(process.cwd(), noQuery);
  return p;
}

function isSqliteHeader(buf: Buffer) {
  if (buf.length < 16) return false;
  return buf.subarray(0, 16).toString("utf8") === "SQLite format 3\u0000";
}

export async function restoreDatabase(formData: FormData) {
  const { admin } = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return;

  const maxBytes = 50 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) return;

  const buf = Buffer.from(await file.arrayBuffer());
  if (!isSqliteHeader(buf)) return;

  const filePath = getSqliteFilePath();
  const tmpPath = `${filePath}.tmp-${Date.now()}`;
  await fs.writeFile(tmpPath, buf);
  await fs.rename(tmpPath, filePath);

  await logAudit({
    action: "db_restore",
    entityType: "Database",
    entityId: path.basename(filePath),
    adminUserId: admin.id,
    metadata: { bytes: buf.length, originalName: file.name },
  });
}

