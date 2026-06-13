import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import {
  gecerliBirim, paketleDosya, talepGorunurlukWhere,
  TALEP_OLUSTURAN_ROLLERI, TALEP_PANEL_ROLLERI, TALEP_HEDEF,
} from "@/lib/istisare";
import type { TalepBirim, TalepDurum } from "@/lib/istisare";
import { bildirimKullanicilara, talepHedefKullaniciIdleri, talepLink } from "@/lib/bildirim";
import type { Sistem, TalepBirim as PBirim } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

// GET: erişilebilir talepler (rol-kapsamlı) + opsiyonel ?durum
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id: userId, role } = session.user;
  if (![...TALEP_OLUSTURAN_ROLLERI, ...TALEP_PANEL_ROLLERI].includes(role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum");

  const where: Record<string, unknown> = { ...talepGorunurlukWhere(userId, role, session.user.teknikYetkisi) };
  if (durum) where.durum = durum as TalepDurum;

  const talepler = await prisma.talep.findMany({
    where,
    orderBy: { sonMesajAt: "desc" },
    take: 300,
    select: {
      id: true, baslik: true, birim: true, durum: true, sistem: true,
      createdAt: true, sonMesajAt: true,
      olusturan: { select: { ad: true, soyad: true } },
      _count: { select: { mesajlar: true } },
    },
  });

  return NextResponse.json(talepler);
}

const createSchema = z.object({
  baslik: z.string().trim().min(3, "Başlık en az 3 karakter").max(200),
  birim:  z.string(),
  mesaj:  z.string().trim().min(1, "Mesaj boş olamaz").max(5000),
  dosyalar: z.array(z.object({ ad: z.string().max(255), url: z.string().max(2000) })).max(10).optional().default([]),
});

// POST: yeni talep oluştur (il/bölge sorumluları)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id: userId, role, sistem } = session.user;
  if (!TALEP_OLUSTURAN_ROLLERI.includes(role)) {
    return NextResponse.json({ error: "Talep oluşturma yetkiniz yok" }, { status: 403 });
  }

  const r = await parseJson(req, createSchema);
  if ("error" in r) return r.error;
  const { baslik, birim, mesaj, dosyalar } = r.data;

  if (!gecerliBirim(sistem, birim)) {
    return NextResponse.json({ error: "Bu birime talep oluşturamazsınız" }, { status: 400 });
  }

  const talep = await prisma.talep.create({
    data: {
      baslik,
      birim: birim as PBirim,
      sistem: sistem as Sistem,
      olusturanId: userId,
      durum: "YENI",
      mesajlar: {
        create: { gonderenId: userId, mesaj, dosyalar: dosyalar.map(paketleDosya) },
      },
    },
    select: { id: true },
  });

  await createAuditLog({
    userId, action: ACTIONS.TALEP_CREATED, entity: "Talep", entityId: talep.id,
    newValue: { baslik, birim, hedef: TALEP_HEDEF[birim as TalepBirim].etiket },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `İstişare talebi oluşturuldu: ${baslik}`,
  }).catch(() => {});

  // Karşılayan merkez sorumlusuna otomatik bildirim
  try {
    const ad = `${session.user.ad} ${session.user.soyad}`;
    const hedefIds = await talepHedefKullaniciIdleri(birim as TalepBirim);
    await bildirimKullanicilara({
      userIds: hedefIds.filter(x => x !== userId),
      baslik: "🔔 Yeni Talep Oluşturuldu",
      mesaj: `Gönderen: ${ad}\nKonu: ${baslik}`,
      tip: "BILGILENDIRME",
      link: talepLink(talep.id),
      createdById: userId,
      createdByName: ad,
    });
  } catch (e) { console.error("Talep bildirimi:", e); }

  return NextResponse.json({ id: talep.id }, { status: 201 });
}
