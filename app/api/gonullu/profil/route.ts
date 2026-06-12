import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import bcrypt from "bcryptjs";
import { parseJson, zEmail, zPassword, zTelefonOptional } from "@/lib/validation";

export const dynamic = "force-dynamic";


const profilSchema = z.object({
  telefon: zTelefonOptional,
  // "" ve null e-postayı silme talebi olarak korur; dolu değer formata uymalı
  email: z.preprocess(
    v => (typeof v === "string" && v.trim() === "" ? null : v),
    zEmail.nullable().optional()
  ),
  eskiSifre: z.string().optional(),
  // Boş string "şifre değiştirme yok" demektir; dolu ise en az 8 karakter
  yeniSifre: z.preprocess(
    v => (typeof v === "string" && v === "" ? undefined : v),
    zPassword.optional()
  ),
});

export async function PUT(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const r = await parseJson(req, profilSchema);
  if ("error" in r) return r.error;
  const { telefon, email, eskiSifre, yeniSifre } = r.data;

  try {
    const volunteer = await prisma.volunteer.findUnique({ where: { id: session.id } });
    if (!volunteer) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

    const updateData: Record<string, string | null> = {};

    if (telefon && telefon !== volunteer.telefon) {
      // zTelefonOptional normalize edilmiş değeri döndürür
      const conflict = await prisma.volunteer.findUnique({ where: { telefon } });
      if (conflict) return NextResponse.json({ error: "Bu telefon başka bir hesapta kullanılıyor." }, { status: 409 });
      updateData.telefon = telefon;
    }

    if (email !== undefined) {
      const newEmail = email; // zod ile normalize: küçük harf / null
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
