import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** GET — bir veri tablosunun TÜM kayıtları (yönetici sonuç ekranı).
 *  Her kayıtta, satırı giren kullanıcının bölge/il konumu da döner (Faz 6 gruplama için). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const tablo = await prisma.veriTablosu.findUnique({
    where: { id },
    include: { sutunlar: { orderBy: { sira: "asc" } } },
  });
  if (!tablo) return NextResponse.json({ error: "Veri tablosu bulunamadı." }, { status: 404 });

  const kayitlar = await prisma.veriTabloKayit.findMany({
    where: { tabloId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, userName: true, degerler: true, createdAt: true },
  });

  // Satırı giren kullanıcıların aktif konumu (bölge/il) — gruplama için
  const userIds = [...new Set(kayitlar.map(k => k.userId))];
  const atamalar = userIds.length
    ? await prisma.roleAssignment.findMany({
        where: { userId: { in: userIds }, status: "AKTIF" },
        select: { userId: true, il: { select: { ad: true, bolge: { select: { no: true, ad: true } } } }, bolge: { select: { no: true, ad: true } } },
      })
    : [];
  const konumMap = new Map<string, { bolgeNo: number | null; bolgeAd: string; ilAd: string }>();
  for (const a of atamalar) {
    if (konumMap.has(a.userId)) continue;
    const bolge = a.il?.bolge ?? a.bolge ?? null;
    konumMap.set(a.userId, {
      bolgeNo: bolge?.no ?? null,
      bolgeAd: bolge?.ad ?? "—",
      ilAd: a.il?.ad ?? "—",
    });
  }

  const kayitlarKonumlu = kayitlar.map(k => ({
    ...k,
    konum: konumMap.get(k.userId) ?? { bolgeNo: null, bolgeAd: "—", ilAd: "—" },
  }));

  return NextResponse.json({ ...tablo, kayitlar: kayitlarKonumlu });
}
