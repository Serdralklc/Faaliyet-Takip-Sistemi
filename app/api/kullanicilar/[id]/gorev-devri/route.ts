import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { rolAtayabilir } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: yeniKullaniciId } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!rolAtayabilir(session.user.role, session.user.icerikYoneticisi)) {
    return NextResponse.json({ error: "Rol devretme yetkiniz yok" }, { status: 403 });
  }

  const { ilId, bolgeId, role } = await req.json();

  // Admin rolü hiçbir şekilde atanamaz (yalnızca veritabanından).
  if (role === "SISTEM_ADMIN") {
    return NextResponse.json({ error: "Admin rolü atanamaz." }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    const mevcutAtama = await tx.roleAssignment.findFirst({
      where: {
        ilId: ilId || undefined,
        bolgeId: bolgeId || undefined,
        status: "AKTIF",
      },
    });

    if (mevcutAtama) {
      await tx.roleAssignment.update({
        where: { id: mevcutAtama.id },
        data: { status: "TAMAMLANDI", endedAt: new Date(), endedById: session.user.id },
      });
      await tx.user.update({
        where: { id: mevcutAtama.userId },
        data: { role: "BEKLEYEN" },
      });
    }

    await tx.roleAssignment.create({
      data: { userId: yeniKullaniciId, role, ilId: ilId || null, bolgeId: bolgeId || null },
    });

    await tx.user.update({
      where: { id: yeniKullaniciId },
      data: { role, status: "AKTIF" },
    });
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.TASK_TRANSFERRED,
    entity: "RoleAssignment",
    entityId: yeniKullaniciId,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `Görev devri yapıldı`,
  });

  return NextResponse.json({ success: true });
}
