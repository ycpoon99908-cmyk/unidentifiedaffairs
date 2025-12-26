import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["prisma/dev.db", "prisma/migrations/**", "prisma/schema.prisma", "prisma.config.ts"],
  },
};

export default nextConfig;
