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
    const volunteer = await prisma.volunteer.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (volunteer) {
      const match = await bcrypt.compare(sifre, volunteer.passwordHash);
      if (!match) {
        return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
      }
      await setGonulluCookie({
        id:      volunteer.id,
        adSoyad: volunteer.adSoyad,
        telefon: volunteer.telefon,
        role:    "GONULLU",
      });
      return NextResponse.json({ ok: true, adSoyad: volunteer.adSoyad });
    }

    // 2) Staff (yönetici/admin) tablosunda ara — gönüllü paneline de erişebilir
    const staffUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!staffUser) {
      return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
    }

    if (!staffUser.passwordHash) {
      return NextResponse.json(
        { error: "Bu hesap Google ile oluşturulmuş. Lütfen Görevli Girişi'nden Google ile giriş yapın." },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(sifre, staffUser.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "E-posta adresi veya şifre hatalı." }, { status: 401 });
    }

    const adSoyad = `${staffUser.ad} ${staffUser.soyad}`;
    const telefon = staffUser.telefon ?? "";

    await setGonulluCookie({
      id:      staffUser.id,
      adSoyad,
      telefon,
      role:    staffUser.role, // SISTEM_ADMIN, GENEL_MERKEZ, vb.
    });

    return NextResponse.json({ ok: true, adSoyad });
  } catch (err) {
    console.error("[gonullu/giris]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
