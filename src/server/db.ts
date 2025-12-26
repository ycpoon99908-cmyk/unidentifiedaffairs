import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function runtimeModelHasField(client: PrismaClient, modelName: string, fieldName: string) {
  const anyClient = client as unknown as {
    _runtimeDataModel?: { models?: Record<string, { fields?: Array<{ name: string }> }> };
    _dmmf?: { datamodel?: { models?: Array<{ name: string; fields?: Array<{ name: string }> }> } };
  };

  const runtimeFields = anyClient._runtimeDataModel?.models?.[modelName]?.fields;
  if (Array.isArray(runtimeFields)) return runtimeFields.some((f) => f.name === fieldName);

  const dmmfModels = anyClient._dmmf?.datamodel?.models;
  if (Array.isArray(dmmfModels)) {
    const model = dmmfModels.find((m) => m.name === modelName);
    return Array.isArray(model?.fields) ? model.fields.some((f) => f.name === fieldName) : false;
  }

  return true;
}

function makeClient() {
  const url =
    process.env.DATABASE_URL ??
    (process.env.VERCEL ? "file:/tmp/dev.db" : "file:./dev.db");
  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }
  const Ctor = PrismaClient as unknown as { new (opts: { errorFormat?: "minimal" | "colorless" | "pretty" }): PrismaClient };
  return new Ctor({ errorFormat: "minimal" });
}
const cached = globalForPrisma.prisma;
export const prisma = cached && runtimeModelHasField(cached, "Post", "views") ? cached : makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
