import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";


export async function PUT(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  try {
    const { telefon, email, eskiSifre, yeniSifre } = await req.json();

    const volunteer = await prisma.volunteer.findUnique({ where: { id: session.id } });
    if (!volunteer) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

    const updateData: Record<string, string | null> = {};

    if (telefon && telefon.trim() !== volunteer.telefon) {
      const conflict = await prisma.volunteer.findUnique({ where: { telefon: telefon.trim() } });
      if (conflict) return NextResponse.json({ error: "Bu telefon başka bir hesapta kullanılıyor." }, { status: 409 });
      updateData.telefon = telefon.trim();
    }

    if (email !== undefined) {
      const newEmail = email?.trim() || null;
      if (newEmail !== volunteer.email) {
        if (newEmail) {
          const conflict = await prisma.volunteer.findUnique({ where: { email: newEmail } });
          if (conflict) return NextResponse.json({ error: "Bu e-posta başka bir hesapta kullanılıyor." }, { status: 409 });
        }
        updateData.email = newEmail;
      }
    }

    if (yeniSifre) {
      if (!eskiSifre) return NextResponse.json({ error: "Mevcut şifre girilmedi." }, { status: 400 });
      const match = await bcrypt.compare(eskiSifre, volunteer.passwordHash);
      if (!match) return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 400 });
      if (yeniSifre.length < 6) return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalıdır." }, { status: 400 });
      updateData.passwordHash = await bcrypt.hash(yeniSifre, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Değiştirilecek alan bulunamadı." }, { status: 400 });
    }

    await prisma.volunteer.update({ where: { id: session.id }, data: updateData });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gonullu/profil PUT]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
