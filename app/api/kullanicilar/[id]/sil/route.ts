import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (session.user.role !== "SISTEM_ADMIN") {
    return NextResponse.json({ error: "Sadece sistem admini kullanıcı silebilir" }, { status: 403 });
  }

  // Kendini silemez
  if (id === session.user.id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz" }, { status: 400 });
  }

  const hedef = await prisma.user.findUnique({ where: { id }, select: { ad: true, soyad: true, email: true, role: true } });
  if (!hedef) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Log kaydı önce oluştur (kullanıcı silinince referans kalmasın)
  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.USER_DEACTIVATED,
    entity: "User",
    entityId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `Kullanıcı hesabı silindi: ${hedef.ad} ${hedef.soyad} (${hedef.email})`,
  });

  // Bağlı verileri temizle, sonra kullanıcıyı sil
  await prisma.$transaction(async (tx) => {
    await tx.roleAssignment.deleteMany({ where: { userId: id } });
    await tx.invitation.deleteMany({ where: { invitedById: id } });
    await tx.user.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
