import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { veriTabloWhere } from "@/lib/veri-tablosu";

export const dynamic = "force-dynamic";

/** GET — kullanıcıya açık (yayında) veri tabloları + kendi girdiği satır sayısı */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = veriTabloWhere(session.user);
  if (!where) return NextResponse.json([]); // bölge/il sorumlusu değilse boş

  const tablolar = await prisma.veriTablosu.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, baslik: true, aciklama: true, createdByName: true, createdAt: true,
      _count: { select: { sutunlar: true } },
    },
  });

  // Kendi satır sayılarım
  const tabloIds = tablolar.map(t => t.id);
  const gruplar = tabloIds.length
    ? await prisma.veriTabloKayit.groupBy({
        by: ["tabloId"],
        where: { tabloId: { in: tabloIds }, userId: session.user.id },
        _count: { _all: true },
      })
    : [];
  const satirSayim = new Map(gruplar.map(g => [g.tabloId, g._count._all]));

  return NextResponse.json(
    tablolar.map(t => ({
      id: t.id,
      baslik: t.baslik,
      aciklama: t.aciklama,
      createdByName: t.createdByName,
      createdAt: t.createdAt,
      sutunSayisi: t._count.sutunlar,
      benimSatirSayim: satirSayim.get(t.id) ?? 0,
    }))
  );
}
