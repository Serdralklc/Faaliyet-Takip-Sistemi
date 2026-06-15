import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseJson, zAdSoyad, zTelefon, zEmail, zPassword, zKisaMetinOptional } from "@/lib/validation";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendEmailVerification } from "@/lib/mail";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    adSoyad:     zAdSoyad,
    telefon:     zTelefon,
    email:       zEmail,
    sifre:       zPassword,
    ogrenim:     z.enum(["ILKOKUL", "ORTAOKUL", "LISE", "UNIVERSITE"]),
    ogrenimTuru: z.enum(["ONLISANS", "LISANS", "YUKSEK_LISANS", "DOKTORA"]).optional().nullable(),
    bolum:       zKisaMetinOptional,
    okul:        zKisaMetinOptional,
    il:          zKisaMetinOptional,
    // SerGenç ana rol — başvuruda seçilir
    serGencRol:  z.enum(["UNIVERSITE", "LISE"]).optional().nullable(),
  });

export async function POST(req: NextRequest) {
  const rl = rateLimit(`gonullu-kayit:${clientIp(req)}`, 5, 300);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const r = await parseJson(req, schema);
    if ("error" in r) return r.error;
    const { adSoyad, telefon, email, sifre, ogrenim, ogrenimTuru, bolum, okul, il, serGencRol } = r.data;

    // Telefon tekrar kontrolü — zTelefon normalize ettiği için
    // "0555 123 45 67" ile "05551234567" artık aynı kayda çarpar
    const existing = await prisma.volunteer.findUnique({ where: { telefon } });
    if (existing) {
      return NextResponse.json({ error: "Bu telefon numarası zaten kayıtlı." }, { status: 409 });
    }

    const existingEmail = await prisma.volunteer.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(sifre, 12);

    const volunteer = await prisma.volunteer.create({
      data: {
        adSoyad,
        telefon,
        email,
        passwordHash,
        ogrenim,
        ogrenimTuru: ogrenim === "UNIVERSITE" && ogrenimTuru ? ogrenimTuru : null,
        bolum:       ogrenim === "UNIVERSITE" && bolum ? bolum : null,
        okul:        ogrenim === "UNIVERSITE" && okul ? okul : null,
        il:          il || null,
        serGencRol:  serGencRol ?? null,
      },
      select: { id: true, adSoyad: true, telefon: true, email: true },
    });

    // Doğrulama e-postası — başarısız olsa bile kayıt tamamlanır
    try {
      const token = await createAuthToken("EPOSTA_DOGRULAMA_VOLUNTEER", { volunteerId: volunteer.id });
      const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
      await sendEmailVerification(volunteer.email!, volunteer.adSoyad, `${base}/eposta-dogrula/${token}`);
    } catch (e) {
      console.error("[gonullu/kayit] doğrulama e-postası gönderilemedi:", e);
    }

    return NextResponse.json({ ok: true, volunteer: { id: volunteer.id, adSoyad: volunteer.adSoyad, telefon: volunteer.telefon } }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/kayit]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
