import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import {
  parseJson,
  zAdSoyad,
  zKisaMetin,
  zKisaMetinOptional,
  zTelefon,
  zTelefonOptional,
} from "@/lib/validation";

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

const ekKayitSchema = z.object({
  ogrenciAd: zAdSoyad,
  ogrenciSoyad: zAdSoyad,
  telefon: zTelefon,
  geldigiUlke: zKisaMetinOptional,
  geldigiIl: zKisaMetinOptional,
  geldigiIlce: zKisaMetinOptional,
  gidecegiBolge: zKisaMetinOptional,
  gidecegiIl: zKisaMetinOptional,
  gidecegiIlce: zKisaMetinOptional,
  universite: zKisaMetin,
  fakulte: zKisaMetin,
  bolum: zKisaMetin,
  kayitTipi: zKisaMetin,
  veliAdSoyad: zKisaMetinOptional,
  veliTelefon: zTelefonOptional,
  referansAdSoyad: zKisaMetinOptional,
  referansTelefon: zTelefonOptional,
  referansGorev: zKisaMetinOptional,
});

export async function POST(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const r = await parseJson(req, ekKayitSchema);
  if ("error" in r) return r.error;
  const {
    ogrenciAd, ogrenciSoyad, telefon,
    geldigiUlke, geldigiIl, geldigiIlce,
    gidecegiBolge, gidecegiIl, gidecegiIlce,
    universite, fakulte, bolum, kayitTipi,
    veliAdSoyad, veliTelefon,
    referansAdSoyad, referansTelefon, referansGorev,
  } = r.data;

  try {
    const basvuru = await prisma.ekKayitBasvuru.create({
      data: {
        volunteerId:     session.id,
        ogrenciAd,
        ogrenciSoyad,
        telefon, // zTelefon normalize edilmiş değeri döndürür
        geldigiUlke:     geldigiUlke     || null,
        geldigiIl:       geldigiIl       || null,
        geldigiIlce:     geldigiIlce     || null,
        gidecegiBolge:   gidecegiBolge   || null,
        gidecegiIl:      gidecegiIl      || null,
        gidecegiIlce:    gidecegiIlce    || null,
        universite,
        fakulte,
        bolum,
        kayitTipi,
        veliAdSoyad:     veliAdSoyad     || null,
        veliTelefon:     veliTelefon     || null,
        referansAdSoyad: referansAdSoyad || null,
        referansTelefon: referansTelefon || null,
        referansGorev:   referansGorev   || null,
      },
    });

    return NextResponse.json({ ok: true, id: basvuru.id }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/ek-kayit POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
