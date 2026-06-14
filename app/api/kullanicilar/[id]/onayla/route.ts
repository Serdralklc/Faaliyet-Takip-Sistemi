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
    return NextResponse.json({ error: "Başvuru onaylama yetkiniz yok" }, { status: 403 });
  }

  // Onaylanacak başvuru sahibinin sistemini doğrula (sistem sorumlusu yalnızca kendi sistemini)
  const hedef = await prisma.user.findUnique({ where: { id }, select: { role: true, sistem: true } });
  if (!hedef) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  if (!tamYetki && !sistemKapsamindaYonetebilir(session.user.role, session.user.sistem, hedef.role, hedef.sistem)) {
    return NextResponse.json({ error: "Bu başvuru sizin sisteminize ait değil" }, { status: 403 });
  }

  const { action, ilId, bolgeId, role, sistem } = await req.json();

  // Admin rolü onaylama yoluyla atanamaz (yalnızca veritabanından).
  if (role === "SISTEM_ADMIN") {
    return NextResponse.json({ error: "Admin rolü atanamaz." }, { status: 403 });
  }

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

  // Sistem sorumlusu yalnızca saha rolü atayabilir ve sistemi kendi sistemine sabitlenir
  const atananRol = role || "IL_SORUMLUSU";
  if (!tamYetki) {
    if (!["IL_SORUMLUSU", "BOLGE_SORUMLUSU"].includes(atananRol)) {
      return NextResponse.json({ error: "Bu rolü atama yetkiniz yok" }, { status: 403 });
    }
  }
  const atananSistem = tamYetki ? sistem : session.user.sistem;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        role: atananRol,
        status: "AKTIF",
        ...(atananSistem ? { sistem: atananSistem } : {}),
      },
    });
    if (ilId || bolgeId) {
      await tx.roleAssignment.create({
        data: { userId: id, role: atananRol, ilId: ilId || null, bolgeId: bolgeId || null },
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
