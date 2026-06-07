import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OgrenimDurum, OgrenimTuru } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";


const VALID_OGRENIM: OgrenimDurum[] = ["ILKOKUL", "ORTAOKUL", "LISE", "UNIVERSITE"];
const VALID_OGRENIM_TURU: OgrenimTuru[] = ["ONLISANS", "LISANS", "YUKSEK_LISANS", "DOKTORA"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adSoyad, telefon, email, sifre, ogrenim, ogrenimTuru, bolum, okul, il } = body;

    if (!adSoyad || !telefon || !sifre || !ogrenim) {
      return NextResponse.json({ error: "Ad Soyad, telefon, şifre ve öğrenim durumu zorunludur." }, { status: 400 });
    }

    if (!VALID_OGRENIM.includes(ogrenim)) {
      return NextResponse.json({ error: "Geçersiz öğrenim durumu." }, { status: 400 });
    }

    if (ogrenim === "UNIVERSITE" && ogrenimTuru && !VALID_OGRENIM_TURU.includes(ogrenimTuru)) {
      return NextResponse.json({ error: "Geçersiz öğrenim türü." }, { status: 400 });
    }

    if (sifre.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    // Telefon tekrar kontrolü
    const existing = await prisma.volunteer.findUnique({ where: { telefon } });
    if (existing) {
      return NextResponse.json({ error: "Bu telefon numarası zaten kayıtlı." }, { status: 409 });
    }

    // E-posta tekrar kontrolü
    if (email) {
      const existingEmail = await prisma.volunteer.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(sifre, 12);

    const volunteer = await prisma.volunteer.create({
      data: {
        adSoyad:     adSoyad.trim(),
        telefon:     telefon.trim(),
        email:       email?.trim() || null,
        passwordHash,
        ogrenim:     ogrenim as OgrenimDurum,
        ogrenimTuru: (ogrenim === "UNIVERSITE" && ogrenimTuru) ? ogrenimTuru as OgrenimTuru : null,
        bolum:       (ogrenim === "UNIVERSITE" && bolum) ? bolum.trim() : null,
        okul:        (ogrenim === "UNIVERSITE" && okul)  ? okul.trim()  : null,
        il:          il?.trim() || null,
      },
      select: { id: true, adSoyad: true, telefon: true },
    });

    return NextResponse.json({ ok: true, volunteer }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/kayit]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
