import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { sifre } = await req.json();
  if (!sifre || sifre.length < 6) {
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(sifre, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.PASSWORD_SET,
    entity: "User",
    entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: "Kullanıcı şifresi admin tarafından atandı",
  });

  return NextResponse.json({ success: true });
}
