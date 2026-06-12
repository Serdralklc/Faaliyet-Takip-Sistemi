import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET — Bildirim Takibi: alıcı bazında görüldü durumu (yönetici) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const bildirim = await prisma.bildirim.findUnique({
    where: { id },
    include: { alimlar: { orderBy: [{ goruldu: "desc" }, { aliciAd: "asc" }] } },
  });
  if (!bildirim) return NextResponse.json({ error: "Bildirim bulunamadı." }, { status: 404 });

  return NextResponse.json({
    id: bildirim.id,
    baslik: bildirim.baslik,
    mesaj: bildirim.mesaj,
    tip: bildirim.tip,
    kanalEposta: bildirim.kanalEposta,
    epostaGonderilen: bildirim.epostaGonderilen,
    createdAt: bildirim.createdAt,
    createdByName: bildirim.createdByName,
    alimlar: bildirim.alimlar.map(a => ({
      id: a.id,
      aliciAd: a.aliciAd,
      aliciTip: a.userId ? "Görevli" : "Gönüllü",
      goruldu: !!a.goruldu,
      gorulmeTarihi: a.goruldu,
    })),
  });
}
