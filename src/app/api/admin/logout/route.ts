import { NextResponse } from "next/server";
import { clearAdminSession } from "@/server/session";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}

