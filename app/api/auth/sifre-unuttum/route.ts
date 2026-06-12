import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJson, zEmail } from "@/lib/validation";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

const schema = z.object({
  email: zEmail,
  tip: z.enum(["yonetici", "gonullu"]),
});

/**
 * Şifre sıfırlama talebi.
 * Hesabın var olup olmadığını sızdırmamak için her durumda aynı yanıt döner.
 */
export async function POST(req: NextRequest) {
  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const { email, tip } = r.data;

  const genericOk = NextResponse.json({
    ok: true,
    message: "Bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.",
  });

  try {
    const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

    if (tip === "yonetici") {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (user) {
        const token = await createAuthToken("SIFRE_SIFIRLAMA_USER", { userId: user.id });
        await sendPasswordResetEmail(user.email, `${user.ad} ${user.soyad}`, `${base}/sifre-sifirla/${token}?tip=yonetici`);
      }
    } else {
      const volunteer = await prisma.volunteer.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (volunteer?.email) {
        const token = await createAuthToken("SIFRE_SIFIRLAMA_VOLUNTEER", { volunteerId: volunteer.id });
        await sendPasswordResetEmail(volunteer.email, volunteer.adSoyad, `${base}/sifre-sifirla/${token}?tip=gonullu`);
      }
    }
  } catch (e) {
    // Hata olsa da hesap varlığını sızdırma — sadece logla
    console.error("Şifre sıfırlama e-postası gönderilemedi:", e);
  }

  return genericOk;
}
