import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/validation";
import { consumeAuthToken } from "@/lib/auth-tokens";

const schema = z.object({ token: z.string().min(32).max(128) });

/** Gönüllü e-posta doğrulama (tek kullanımlık token) */
export async function POST(req: NextRequest) {
  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;

  const record = await consumeAuthToken("EPOSTA_DOGRULAMA_VOLUNTEER", r.data.token);
  if (!record?.volunteerId) {
    return NextResponse.json(
      { error: "Doğrulama bağlantısı geçersiz veya süresi dolmuş." },
      { status: 400 }
    );
  }

  await prisma.volunteer.update({
    where: { id: record.volunteerId },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true, message: "E-posta adresiniz doğrulandı." });
}
