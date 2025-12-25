import fs from "fs/promises";
import path from "path";
import { requireAdminApi } from "@/server/adminApi";
import { logAudit } from "@/server/audit";

export const runtime = "nodejs";

function getSqliteFilePath() {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) throw new Error("unsupported_database_url");
  const withoutProtocol = raw.slice("file:".length);
  const noQuery = withoutProtocol.split("?")[0] ?? "";
  const p = noQuery.startsWith("/") ? noQuery : path.resolve(process.cwd(), noQuery);
  return p;
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });

  const filePath = getSqliteFilePath();
  const buf = await fs.readFile(filePath);

  await logAudit({
    action: "db_backup_download",
    entityType: "Database",
    entityId: path.basename(filePath),
    adminUserId: auth.admin.id,
    metadata: { bytes: buf.length },
  });

  const stamp = new Date().toISOString().replaceAll(":", "-");
  const fileName = `backup-${stamp}.db`;
  return new Response(buf, {
    status: 200,
    headers: {
      "content-type": "application/x-sqlite3",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}

