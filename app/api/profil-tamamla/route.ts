import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Sadece BEKLEYEN statüsündeki kullanıcılar bu endpointi kullanabilir
  if (session.user.role !== "BEKLEYEN") {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  const { gorev, bolgeId, ilId, telefon } = await req.json();

  if (!gorev || !bolgeId) {
    return NextResponse.json({ error: "Görev ve bölge zorunludur" }, { status: 400 });
  }
  if (gorev === "IL_SORUMLUSU" && !ilId) {
    return NextResponse.json({ error: "İl seçimi zorunludur" }, { status: 400 });
  }

  // Bölge kontrolü
  const bolge = await prisma.bolge.findUnique({ where: { id: bolgeId } });
  if (!bolge) return NextResponse.json({ error: "Bölge bulunamadı" }, { status: 400 });

  let il = null;
  if (ilId) {
    il = await prisma.il.findUnique({ where: { id: ilId } });
    if (!il) return NextResponse.json({ error: "İl bulunamadı" }, { status: 400 });
  }

  // Kullanıcı telefon kaydını güncelle (varsa)
  if (telefon) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { telefon },
    });
  }

  // Audit log'a başvuru bilgilerini ekle
  const bolgeAdi = bolge.ad;
  const ilAdi = il?.ad ?? "-";
  const gorevAdi = gorev === "IL_SORUMLUSU" ? "İl Sorumlusu" : "Bölge Sorumlusu";

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.USER_CREATED,
    entity: "User",
    entityId: session.user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `Google hesabıyla kayıt: ${gorevAdi} - ${bolgeAdi}${gorev === "IL_SORUMLUSU" ? ` / ${ilAdi}` : ""} için başvurdu`,
    newValue: { gorev, bolgeId, ilId: ilId || null },
  });

  return NextResponse.json({ success: true });
}
