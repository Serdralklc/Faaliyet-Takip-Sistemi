import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const admin = await prisma.user.findUnique({ where: { email: "admin@sistem.com" } });
    return NextResponse.json({
      ok: true,
      userCount,
      adminFound: !!admin,
      adminHasPassword: !!admin?.passwordHash,
      adminRole: admin?.role,
      adminStatus: admin?.status,
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
