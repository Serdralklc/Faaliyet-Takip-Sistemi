import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const basvurular = await prisma.ekKayitBasvuru.findMany({
    where: { volunteerId: session.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, ogrenciAd: true, ogrenciSoyad: true, universite: true,
      fakulte: true, bolum: true, kayitTipi: true, gidecegiIl: true,
      durum: true, yoneticiNotu: true, createdAt: true,
    },
  });

  return NextResponse.json(basvurular);
}

export async function POST(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  try {
    const body = await req.json();
    const {
      ogrenciAd, ogrenciSoyad, telefon,
      geldigiUlke, geldigiIl, geldigiIlce,
      gidecegiBolge, gidecegiIl, gidecegiIlce,
      universite, fakulte, bolum, kayitTipi,
      veliAdSoyad, veliTelefon,
      referansAdSoyad, referansTelefon, referansGorev,
    } = body;

    if (!ogrenciAd || !ogrenciSoyad || !telefon || !universite || !fakulte || !bolum || !kayitTipi) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 400 });
    }

    const basvuru = await prisma.ekKayitBasvuru.create({
      data: {
        volunteerId:     session.id,
        ogrenciAd:       ogrenciAd.trim(),
        ogrenciSoyad:    ogrenciSoyad.trim(),
        telefon:         telefon.trim(),
        geldigiUlke:     geldigiUlke?.trim() || null,
        geldigiIl:       geldigiIl?.trim()   || null,
        geldigiIlce:     geldigiIlce?.trim() || null,
        gidecegiBolge:   gidecegiBolge?.trim() || null,
        gidecegiIl:      gidecegiIl?.trim()  || null,
        gidecegiIlce:    gidecegiIlce?.trim() || null,
        universite:      universite.trim(),
        fakulte:         fakulte.trim(),
        bolum:           bolum.trim(),
        kayitTipi:       kayitTipi.trim(),
        veliAdSoyad:     veliAdSoyad?.trim()     || null,
        veliTelefon:     veliTelefon?.trim()     || null,
        referansAdSoyad: referansAdSoyad?.trim() || null,
        referansTelefon: referansTelefon?.trim() || null,
        referansGorev:   referansGorev?.trim()   || null,
      },
    });

    return NextResponse.json({ ok: true, id: basvuru.id }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/ek-kayit POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
