import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { rolAtayabilir, sistemSorumlusu, sistemKapsamindaYonetebilir } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const tamYetki = rolAtayabilir(session.user.role, session.user.icerikYoneticisi);
  if (!tamYetki && !sistemSorumlusu(session.user.role)) {
    return NextResponse.json({ error: "Rol değiştirme yetkiniz yok" }, { status: 403 });
  }

  const hedef = await prisma.user.findUnique({ where: { id }, select: { role: true, ad: true, soyad: true, sistem: true } });
  if (!hedef) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Sadece SISTEM_ADMIN başka bir SISTEM_ADMIN'in yetkisini alabilir
  if (hedef.role === "SISTEM_ADMIN" && session.user.role !== "SISTEM_ADMIN") {
    return NextResponse.json({ error: "Sistem adminin yetkisini sadece başka bir sistem admini alabilir" }, { status: 403 });
  }

  // Sistem sorumlusu yalnızca kendi sistemindeki saha kullanıcısının yetkisini alabilir
  if (!tamYetki && !sistemKapsamindaYonetebilir(session.user.role, session.user.sistem, hedef.role, hedef.sistem)) {
    return NextResponse.json({ error: "Bu kullanıcı sizin sisteminize ait değil" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.roleAssignment.updateMany({
      where: { userId: id, status: "AKTIF" },
      data: { status: "TAMAMLANDI", endedAt: new Date(), endedById: session.user.id },
    });
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
    description: `Kullanıcı yetkisi alındı: ${hedef.ad} ${hedef.soyad}`,
  });

  return NextResponse.json({ success: true });
}
