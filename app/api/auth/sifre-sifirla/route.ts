import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseJson, zPassword } from "@/lib/validation";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { createAuditLog } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(32).max(128),
  tip: z.enum(["yonetici", "gonullu"]),
  password: zPassword,
});

/** Token ile yeni şifre belirleme (tek kullanımlık) */
export async function POST(req: NextRequest) {
  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const { token, tip, password } = r.data;

  const invalid = NextResponse.json(
    { error: "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama talebi oluşturun." },
    { status: 400 }
  );

  const passwordHash = await bcrypt.hash(password, 10);

  if (tip === "yonetici") {
    const record = await consumeAuthToken("SIFRE_SIFIRLAMA_USER", token);
    if (!record?.userId) return invalid;

    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await createAuditLog({
      userId: record.userId,
      action: "SIFRE_SIFIRLANDI",
      entity: "User",
      entityId: record.userId,
      description: "Şifre, e-posta sıfırlama bağlantısı ile değiştirildi.",
    });
  } else {
    const record = await consumeAuthToken("SIFRE_SIFIRLAMA_VOLUNTEER", token);
    if (!record?.volunteerId) return invalid;

    await prisma.volunteer.update({ where: { id: record.volunteerId }, data: { passwordHash } });
  }

  return NextResponse.json({ ok: true, message: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
}
