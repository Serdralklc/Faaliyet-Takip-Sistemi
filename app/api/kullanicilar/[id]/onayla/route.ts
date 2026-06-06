import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { action, ilId, bolgeId, role } = await req.json();

  if (action === "reddet") {
    await prisma.user.update({
      where: { id: params.id },
      data: { status: "PASIF" },
    });

    await createAuditLog({
      userId: session.user.id,
      action: ACTIONS.USER_REJECTED,
      entity: "User",
      entityId: params.id,
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true });
  }

  // Onayla
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.id },
      data: { role: role || "IL_SORUMLUSU", status: "AKTIF" },
    });

    if (ilId || bolgeId) {
      await tx.roleAssignment.create({
        data: {
          userId: params.id,
          role: role || "IL_SORUMLUSU",
          ilId: ilId || null,
          bolgeId: bolgeId || null,
        },
      });
    }
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.USER_APPROVED,
    entity: "User",
    entityId: params.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true });
}
