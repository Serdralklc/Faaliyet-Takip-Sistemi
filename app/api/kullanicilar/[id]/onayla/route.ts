import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { rolAtayabilir } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!rolAtayabilir(session.user.role, session.user.icerikYoneticisi)) {
    return NextResponse.json({ error: "Başvuru onaylama (rol atama) yetkiniz yok" }, { status: 403 });
  }

  const { action, ilId, bolgeId, role, sistem } = await req.json();

  if (action === "reddet") {
    await prisma.user.update({ where: { id }, data: { status: "PASIF" } });
    await createAuditLog({
      userId: session.user.id,
      action: ACTIONS.USER_REJECTED,
      entity: "User",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });
    return NextResponse.json({ success: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        role: role || "IL_SORUMLUSU",
        status: "AKTIF",
        ...(sistem ? { sistem } : {}),
      },
    });
    if (ilId || bolgeId) {
      await tx.roleAssignment.create({
        data: { userId: id, role: role || "IL_SORUMLUSU", ilId: ilId || null, bolgeId: bolgeId || null },
      });
    }
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.USER_APPROVED,
    entity: "User",
    entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true });
}
