import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const inv = await prisma.invitation.findUnique({ where: { token } });

  if (!inv || inv.usedAt || inv.expiresAt < new Date()) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı" }, { status: 400 });
  }

  return NextResponse.json({ email: inv.email, role: inv.role });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { password } = await req.json();

  const inv = await prisma.invitation.findUnique({ where: { token } });

  if (!inv || inv.usedAt || inv.expiresAt < new Date()) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email: inv.email },
      data: { passwordHash: hash, status: "AKTIF" },
    });
    await tx.invitation.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  });

  const user = await prisma.user.findUnique({ where: { email: inv.email } });
  if (user) {
    await createAuditLog({
      userId: user.id,
      action: ACTIONS.PASSWORD_SET,
      entity: "User",
      entityId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });
  }

  return NextResponse.json({ success: true });
}
