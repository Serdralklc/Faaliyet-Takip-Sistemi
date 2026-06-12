import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { parseJson, zPassword } from "@/lib/validation";

const sifreDegistirSchema = z.object({
  eskiSifre: z.string().min(1, "Mevcut şifre zorunludur."),
  yeniSifre: zPassword,
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const r = await parseJson(req, sifreDegistirSchema);
  if ("error" in r) return r.error;
  const { eskiSifre, yeniSifre } = r.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const valid = await bcrypt.compare(eskiSifre, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(yeniSifre, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await createAuditLog({
    userId: user.id,
    action: ACTIONS.PASSWORD_SET,
    entity: "User",
    entityId: user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: "Kullanıcı kendi şifresini değiştirdi",
  });

  return NextResponse.json({ success: true });
}
