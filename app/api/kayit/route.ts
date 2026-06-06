import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ad, soyad, email, telefon, ilId, bolgeId } = body;

  if (!ad || !soyad || !email) {
    return NextResponse.json({ error: "Ad, soyad ve e-posta zorunludur" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      ad, soyad, email, telefon,
      role: "BEKLEYEN",
      status: "BEKLEMEDE",
    },
  });

  // Kayıt log — sistem adına
  const adminUser = await prisma.user.findFirst({ where: { role: "SISTEM_ADMIN" } });
  if (adminUser) {
    await createAuditLog({
      userId: adminUser.id,
      action: ACTIONS.USER_CREATED,
      entity: "User",
      entityId: user.id,
      newValue: { email, ilId, bolgeId },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      description: `Kendi kaydını oluşturdu: ${ad} ${soyad}`,
    });
  }

  return NextResponse.json({ success: true });
}
