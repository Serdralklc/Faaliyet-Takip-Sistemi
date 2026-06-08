import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { Sistem } from "@/app/generated/prisma/client";

const VALID_SISTEM: Sistem[] = ["EGITIMCI", "UNIVERSITE", "LISE"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ad, soyad, email, telefon, sifre, gorev, bolgeId, ilId, sistem } = body;

  if (!ad || !soyad || !email || !sifre) {
    return NextResponse.json({ error: "Ad, soyad, e-posta ve şifre zorunludur" }, { status: 400 });
  }
  if (sifre.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır" }, { status: 400 });
  }

  // Yönetici başvurusu: bolge/il zorunlu değil
  const YONETICI_GOREVCLER = ["TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "GENEL_MERKEZ"];
  const isYoneticiBasvuru = YONETICI_GOREVCLER.includes(gorev ?? "")
    && !bolgeId && !ilId;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(sifre, 12);
  const sistemValue: Sistem = VALID_SISTEM.includes(sistem) ? sistem : "EGITIMCI";

  const user = await prisma.user.create({
    data: {
      ad,
      soyad,
      email,
      telefon: telefon || null,
      passwordHash,
      role:   "BEKLEYEN",
      status: "BEKLEMEDE",
      sistem: sistemValue,
      basvuruGorev:   gorev   || null,
      basvuruBolgeId: bolgeId || null,
      basvuruIlId:    ilId    || null,
    },
  });

  const adminUser = await prisma.user.findFirst({ where: { role: "SISTEM_ADMIN" } });
  if (adminUser) {
    await createAuditLog({
      userId:      adminUser.id,
      action:      ACTIONS.USER_CREATED,
      entity:      "User",
      entityId:    user.id,
      newValue:    { email, gorev, bolgeId, ilId, sistem: sistemValue },
      ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
      description: `Kendi kaydını oluşturdu: ${ad} ${soyad} (${gorev ?? "belirtilmedi"}) [${sistemValue}]`,
    });
  }

  return NextResponse.json({ success: true });
}
