import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import {
  parseJson,
  zAdSoyad,
  zEmailOptional,
  zKisaMetin,
  zTelefon,
  zUzunMetin,
} from "@/lib/validation";

export const dynamic = "force-dynamic";


/** Gönüllünün kendi başvurularını listele */
export async function GET() {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const basvurular = await prisma.bursBasvuru.findMany({
    where: { volunteerId: session.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, adSoyad: true, universite: true, fakulteBolum: true,
      sinif: true, il: true, durum: true, yoneticiNotu: true, createdAt: true,
    },
  });

  return NextResponse.json(basvurular);
}

/** Yeni burs başvurusu */
const bursSchema = z.object({
  adSoyad: zAdSoyad,
  telefon: zTelefon,
  email: zEmailOptional,
  universite: zKisaMetin,
  fakulteBolum: zKisaMetin,
  sinif: zKisaMetin,
  il: zKisaMetin,
  madiDurum: zKisaMetin,
  aciklama: zUzunMetin,
});

export async function POST(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const r = await parseJson(req, bursSchema);
  if ("error" in r) return r.error;
  const { adSoyad, telefon, email, universite, fakulteBolum, sinif, il, madiDurum, aciklama } = r.data;

  try {
    // Bekleyen başvuru var mı kontrol
    const mevcut = await prisma.bursBasvuru.findFirst({
      where: { volunteerId: session.id, durum: { in: ["BEKLEMEDE", "INCELENIYOR"] } },
    });
    if (mevcut) {
      return NextResponse.json({ error: "Zaten aktif bir başvurunuz bulunmaktadır." }, { status: 409 });
    }

    const basvuru = await prisma.bursBasvuru.create({
      data: {
        volunteerId:  session.id,
        adSoyad,
        telefon, // zTelefon normalize edilmiş değeri döndürür
        email:        email ?? null,
        universite,
        fakulteBolum,
        sinif,
        il,
        madiDurum,
        aciklama,
        belgeler:     [],
      },
    });

    return NextResponse.json({ ok: true, id: basvuru.id }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/burs POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
