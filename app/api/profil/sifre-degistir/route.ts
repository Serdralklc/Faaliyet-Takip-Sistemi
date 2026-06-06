import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { eskiSifre, yeniSifre } = await req.json();

  if (!eskiSifre || !yeniSifre) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
  }
  if (yeniSifre.length < 8) {
    return NextResponse.json({ error: "Yeni şifre en az 8 karakter olmalıdır" }, { status: 400 });
  }

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
