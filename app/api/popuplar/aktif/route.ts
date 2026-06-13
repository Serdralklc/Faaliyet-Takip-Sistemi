import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET — şu an gösterilebilir pop-up'lar (aktif + tarih aralığında).
 * TEK_SEFER olup bu kullanıcının daha önce gördükleri çıkarılır.
 * HER_GIRIS/SUREKLI gösterim sıklığı istemci tarafında yönetilir.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json([]);

  const now = new Date();
  const popuplar = await prisma.popup.findMany({
    where: { aktif: true, baslangic: { lte: now }, bitis: { gte: now } },
    orderBy: { createdAt: "desc" },
    select: { id: true, baslik: true, aciklama: true, gorselUrl: true, link: true, gosterim: true },
  });

  const tekSeferIds = popuplar.filter(p => p.gosterim === "TEK_SEFER").map(p => p.id);
  if (tekSeferIds.length) {
    const gorulen = await prisma.popupGorulme.findMany({
      where: { userId: session.user.id, popupId: { in: tekSeferIds } },
      select: { popupId: true },
    });
    const seen = new Set(gorulen.map(g => g.popupId));
    return NextResponse.json(popuplar.filter(p => p.gosterim !== "TEK_SEFER" || !seen.has(p.id)));
  }
  return NextResponse.json(popuplar);
}
