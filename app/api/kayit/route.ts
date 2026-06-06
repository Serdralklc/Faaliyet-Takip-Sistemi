import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ad, soyad, email, telefon, sifre, gorev, bolgeId, ilId } = body;

  if (!ad || !soyad || !email || !sifre) {
    return NextResponse.json({ error: "Ad, soyad, e-posta ve şifre zorunludur" }, { status: 400 });
  }
  if (sifre.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(sifre, 12);

  const user = await prisma.user.create({
    data: {
      ad,
      soyad,
      email,
      telefon: telefon || null,
      passwordHash,
      role: "BEKLEYEN",
      status: "BEKLEMEDE",
    },
  });

  // Audit log
  const adminUser = await prisma.user.findFirst({ where: { role: "SISTEM_ADMIN" } });
  if (adminUser) {
    await createAuditLog({
      userId: adminUser.id,
      action: ACTIONS.USER_CREATED,
      entity: "User",
      entityId: user.id,
      newValue: { email, gorev, bolgeId, ilId },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      description: `Kendi kaydını oluşturdu: ${ad} ${soyad} (${gorev ?? "belirtilmedi"})`,
    });
  }

  return NextResponse.json({ success: true });
}
