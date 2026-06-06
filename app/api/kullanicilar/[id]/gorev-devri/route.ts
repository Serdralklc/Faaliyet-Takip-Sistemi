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

  const { ilId, bolgeId, role } = await req.json();
  const yeniKullaniciId = params.id;

  await prisma.$transaction(async (tx) => {
    // Mevcut aktif sorumluyu bul ve sonlandır
    const mevcutAtama = await tx.roleAssignment.findFirst({
      where: {
        ilId: ilId || undefined,
        bolgeId: bolgeId || undefined,
        status: "AKTIF",
      },
      include: { user: true },
    });

    if (mevcutAtama) {
      // Eski atamayı kapat
      await tx.roleAssignment.update({
        where: { id: mevcutAtama.id },
        data: { status: "TAMAMLANDI", endedAt: new Date(), endedById: session.user.id },
      });

      // Eski kullanıcıyı BEKLEYEN yap
      await tx.user.update({
        where: { id: mevcutAtama.userId },
        data: { role: "BEKLEYEN" },
      });
    }

    // Yeni atama oluştur
    await tx.roleAssignment.create({
      data: {
        userId: yeniKullaniciId,
        role,
        ilId: ilId || null,
        bolgeId: bolgeId || null,
      },
    });

    // Yeni kullanıcıyı aktif yap
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
    description: `Görev devri: ${ilId ? "İl" : "Bölge"} ataması yapıldı`,
  });

  return NextResponse.json({ success: true });
}
