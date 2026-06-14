import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ilAdindanKod, IL_BILGI } from "@/lib/turkiye-iller";

export const dynamic = "force-dynamic";

interface Agg { toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number; kategori: Record<string, number> }
const bosAgg = (): Agg => ({ toplam: 0, katilimci: 0, ilkKez: 0, yeniIntisap: 0, kategori: {} });
function ekle(a: Agg, b: Agg) {
  a.toplam += b.toplam; a.katilimci += b.katilimci; a.ilkKez += b.ilkKez; a.yeniIntisap += b.yeniIntisap;
  for (const c in b.kategori) a.kategori[c] = (a.kategori[c] ?? 0) + b.kategori[c];
}

/**
 * GET — Lise Gençlik Türkiye haritası verisi (yalnız LiseFaaliyet).
 * iller: il (coğrafi kod) bazında performans; bolgeler: bölge → birim (org il/ilçe) kırılımı.
 * ?yil opsiyonel.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  const sp = req.nextUrl.searchParams;
  const yilRaw = sp.get("yil");
  const yil = yilRaw ? parseInt(yilRaw, 10) : undefined;
  const donem = sp.get("donem");
  const kategori = sp.get("kategori");
  const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
  const KATEGORILER = ["ILIM_SOHBET", "SOSYAL", "SOSYAL_SORUMLULUK", "MUHABBET", "NAMAZ", "KAFILE", "DIGER"];

  const where: Record<string, unknown> = {};
  if (yil && !isNaN(yil)) where.yil = yil;
  if (donem && DONEMLER.includes(donem)) where.donem = donem;
  if (kategori && KATEGORILER.includes(kategori)) where.kategori = kategori;

  const [bolgeler, faal, yillarRaw] = await Promise.all([
    prisma.bolge.findMany({ select: { no: true, ad: true, iller: { select: { id: true, ad: true } } }, orderBy: { no: "asc" } }),
    prisma.liseFaaliyet.findMany({
      where,
      select: { ilId: true, kategori: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true },
    }),
    prisma.liseFaaliyet.findMany({ select: { yil: true }, distinct: ["yil"], orderBy: { yil: "desc" } }),
  ]);

  // org il → agg
  const ilAgg = new Map<string, Agg>();
  for (const f of faal) {
    let a = ilAgg.get(f.ilId);
    if (!a) { a = bosAgg(); ilAgg.set(f.ilId, a); }
    a.toplam += 1;
    a.katilimci += f.katilimci;
    a.ilkKez += f.ilkKezKatilan;
    a.yeniIntisap += f.yeniIntisap;
    a.kategori[f.kategori] = (a.kategori[f.kategori] ?? 0) + 1;
  }

  // coğrafi il (kod) bazında + bölge yapısı
  const iller: Record<string, Agg & { ad: string }> = {};
  const bolgeOut = bolgeler.map(b => {
    const birimler = b.iller.map(il => {
      const kod = ilAdindanKod(il.ad);
      const a = ilAgg.get(il.id) ?? bosAgg();
      if (kod) {
        let p = iller[kod];
        if (!p) { p = { ad: IL_BILGI[kod]?.ad ?? kod, ...bosAgg() }; iller[kod] = p; }
        ekle(p, a);
      }
      return { ilId: il.id, ad: il.ad, kod, toplam: a.toplam, katilimci: a.katilimci, ilkKez: a.ilkKez, yeniIntisap: a.yeniIntisap, kategori: a.kategori };
    });
    return { no: b.no, ad: b.ad, birimler };
  });

  return NextResponse.json({ yillar: yillarRaw.map(y => y.yil), iller, bolgeler: bolgeOut });
}
