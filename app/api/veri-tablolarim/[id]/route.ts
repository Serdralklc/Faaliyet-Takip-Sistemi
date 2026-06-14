import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { veriTabloWhere, kayitlarSchema } from "@/lib/veri-tablosu";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

/** GET — doldurulacak tablo (görünürlük kontrolü) + kullanıcının kendi satırları */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = veriTabloWhere(session.user);
  if (!where) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const tablo = await prisma.veriTablosu.findFirst({
    where: { id, ...where },
    include: { sutunlar: { orderBy: { sira: "asc" } } },
  });
  if (!tablo) return NextResponse.json({ error: "Veri tablosu bulunamadı veya size açık değil." }, { status: 404 });

  const benimSatirlarim = await prisma.veriTabloKayit.findMany({
    where: { tabloId: id, userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, degerler: true },
  });

  return NextResponse.json({ ...tablo, benimSatirlarim });
}

/** POST — kullanıcının kendi satırlarını TOPLU kaydeder (eski satırları değiştirir; sınırsız satır) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = veriTabloWhere(session.user);
  if (!where) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const tablo = await prisma.veriTablosu.findFirst({
    where: { id, ...where },
    include: { sutunlar: true },
  });
  if (!tablo) return NextResponse.json({ error: "Veri tablosu bulunamadı veya size açık değil." }, { status: 404 });

  const r = await parseJson(req, kayitlarSchema);
  if ("error" in r) return r.error;
  const { satirlar } = r.data;

  // Tamamen boş satırları at; zorunlu sütun kontrolü
  const zorunluSutunlar = tablo.sutunlar.filter(s => s.zorunlu);
  const dolu = (v: unknown) =>
    !(v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0));

  const temizSatirlar = satirlar.filter(satir =>
    tablo.sutunlar.some(s => dolu((satir as Record<string, unknown>)[s.id]))
  );

  for (const satir of temizSatirlar) {
    for (const s of zorunluSutunlar) {
      if (!dolu((satir as Record<string, unknown>)[s.id])) {
        return NextResponse.json({ error: `"${s.baslik}" sütunu zorunludur (bir satırda boş bırakılmış).` }, { status: 400 });
      }
    }
  }

  // Bilinmeyen sütun anahtarlarını ele
  const sutunIdler = new Set(tablo.sutunlar.map(s => s.id));
  const kayitVerileri = temizSatirlar.map(satir => {
    const degerler = Object.fromEntries(Object.entries(satir).filter(([k]) => sutunIdler.has(k)));
    return {
      tabloId: id,
      userId: session.user.id,
      userName: `${session.user.ad} ${session.user.soyad}`,
      degerler: degerler as Prisma.InputJsonValue,
    };
  });

  // Kendi eski satırlarını sil, yenilerini oluştur (tek işlem)
  await prisma.$transaction([
    prisma.veriTabloKayit.deleteMany({ where: { tabloId: id, userId: session.user.id } }),
    ...(kayitVerileri.length ? [prisma.veriTabloKayit.createMany({ data: kayitVerileri })] : []),
  ]);

  return NextResponse.json({ ok: true, satirSayisi: kayitVerileri.length }, { status: 201 });
}
