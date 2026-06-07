import { NextResponse } from "next/server";
import { clearGonulluCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearGonulluCookie();
  return NextResponse.json({ ok: true });
}
