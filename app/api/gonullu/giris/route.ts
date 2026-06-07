import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { setGonulluCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  try {
    const { telefon, sifre } = await req.json();

    if (!telefon || !sifre) {
      return NextResponse.json({ error: "Telefon ve şifre zorunludur." }, { status: 400 });
    }

    const volunteer = await prisma.volunteer.findUnique({ where: { telefon: telefon.trim() } });
    if (!volunteer) {
      return NextResponse.json({ error: "Telefon numarası veya şifre hatalı." }, { status: 401 });
    }

    const match = await bcrypt.compare(sifre, volunteer.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Telefon numarası veya şifre hatalı." }, { status: 401 });
    }

    await setGonulluCookie({ id: volunteer.id, adSoyad: volunteer.adSoyad, telefon: volunteer.telefon });

    return NextResponse.json({ ok: true, adSoyad: volunteer.adSoyad });
  } catch (err) {
    console.error("[gonullu/giris]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
