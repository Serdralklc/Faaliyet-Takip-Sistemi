import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

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

  await prisma.$transaction(async (tx) => {
    // Aktif atamaları bitir
    await tx.roleAssignment.updateMany({
      where: { userId: id, status: "AKTIF" },
      data: { status: "TAMAMLANDI", endedAt: new Date(), endedById: session.user.id },
    });

    // Kullanıcıyı bekleyene düşür
    await tx.user.update({
      where: { id },
      data: { role: "BEKLEYEN", status: "BEKLEMEDE" },
    });
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.USER_DEACTIVATED,
    entity: "User",
    entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: "Kullanıcı yetkisi alındı",
  });

  return NextResponse.json({ success: true });
}
