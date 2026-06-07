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

    const normalizedEmail = email.trim().toLowerCase();

    // 1) Gönüllü tablosunda ara
    const volunteer = await prisma.volunteer.findUnique({ where: { email: normalizedEmail } });
    if (volunteer) {
      const match = await bcrypt.compare(sifre, volunteer.passwordHash);
      if (!match) {
        return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
      }
      await setGonulluCookie({ id: volunteer.id, adSoyad: volunteer.adSoyad, telefon: volunteer.telefon });
      return NextResponse.json({ ok: true, adSoyad: volunteer.adSoyad });
    }

    // 2) Staff (yönetici) tablosunda ara — admin/görevliler de gönüllü paneline girebilir
    const staffUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (staffUser && staffUser.passwordHash) {
      const match = await bcrypt.compare(sifre, staffUser.passwordHash);
      if (!match) {
        return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
      }
      const adSoyad = `${staffUser.ad} ${staffUser.soyad}`;
      const telefon = staffUser.telefon ?? "";
      await setGonulluCookie({ id: staffUser.id, adSoyad, telefon });
      return NextResponse.json({ ok: true, adSoyad });
    }

    return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
  } catch (err) {
    console.error("[gonullu/giris]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
