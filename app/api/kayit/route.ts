import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { Sistem } from "@/app/generated/prisma/client";
import {
  parseJson,
  zAdSoyad,
  zEmail,
  zKisaMetinOptional,
  zPassword,
  zTelefonOptional,
} from "@/lib/validation";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

const VALID_SISTEM: Sistem[] = ["EGITIMCI", "UNIVERSITE", "LISE"];

const kayitSchema = z.object({
  ad: zAdSoyad,
  soyad: zAdSoyad,
  email: zEmail,
  sifre: zPassword,
  telefon: zTelefonOptional,
  gorev: zKisaMetinOptional,
  bolgeId: zKisaMetinOptional,
  ilId: zKisaMetinOptional,
  // Geçersiz sistem değeri hata değil, EGITIMCI'ye düşer (mevcut davranış korunuyor)
  sistem: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(`kayit:${clientIp(req)}`, 5, 300);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const r = await parseJson(req, kayitSchema);
  if ("error" in r) return r.error;
  const { ad, soyad, email, telefon, sifre, gorev, bolgeId, ilId, sistem } = r.data;

  // Yönetici başvurusu: bolge/il zorunlu değil
  const YONETICI_GOREVCLER = ["TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "GENEL_MERKEZ"];
  const isYoneticiBasvuru = YONETICI_GOREVCLER.includes(gorev ?? "")
    && !bolgeId && !ilId;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(sifre, 12);
  const sistemValue: Sistem = VALID_SISTEM.includes(sistem as Sistem) ? (sistem as Sistem) : "EGITIMCI";

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
