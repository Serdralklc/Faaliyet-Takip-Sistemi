import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { setGonulluCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest) {
  try {
    const { email, sifre } = await req.json();

    if (!email || !sifre) {
      return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
    }

    const volunteer = await prisma.volunteer.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!volunteer) {
      return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
    }

    const match = await bcrypt.compare(sifre, volunteer.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
    }

    await setGonulluCookie({ id: volunteer.id, adSoyad: volunteer.adSoyad, telefon: volunteer.telefon });

    return NextResponse.json({ ok: true, adSoyad: volunteer.adSoyad });
  } catch (err) {
    console.error("[gonullu/giris]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
