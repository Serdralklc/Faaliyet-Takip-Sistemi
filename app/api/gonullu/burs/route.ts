import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getGonulluFromCookie } from "@/lib/gonullu-auth";

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
export async function POST(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  try {
    const body = await req.json();
    const { adSoyad, telefon, email, universite, fakulteBolum, sinif, il, madiDurum, aciklama } = body;

    if (!adSoyad || !telefon || !universite || !fakulteBolum || !sinif || !il || !madiDurum || !aciklama) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
    }

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
        adSoyad:      adSoyad.trim(),
        telefon:      telefon.trim(),
        email:        email?.trim() || null,
        universite:   universite.trim(),
        fakulteBolum: fakulteBolum.trim(),
        sinif:        sinif.trim(),
        il:           il.trim(),
        madiDurum:    madiDurum.trim(),
        aciklama:     aciklama.trim(),
        belgeler:     [],
      },
    });

    return NextResponse.json({ ok: true, id: basvuru.id }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/burs POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
