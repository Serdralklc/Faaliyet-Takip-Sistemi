import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ilAdindanKod } from "@/lib/turkiye-iller";

export const dynamic = "force-dynamic";

const KATEGORILER = ["ILIM_SOHBET", "SOSYAL", "SOSYAL_SORUMLULUK", "MUHABBET", "NAMAZ", "KAFILE", "DIGER"];
const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

/** GET — Lise Gençlik faaliyetlerinin il bazında (coğrafi il kodu) toplamı; yıl/dönem/kategori filtreli */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const yil = sp.get("yil") ? parseInt(sp.get("yil")!, 10) : undefined;
  const donem = sp.get("donem");
  const kategori = sp.get("kategori");

  // ilId → coğrafi il kodu
  const iller = await prisma.il.findMany({ select: { id: true, ad: true } });
  const ilIdKod = new Map<string, string>();
  for (const il of iller) {
    const k = ilAdindanKod(il.ad);
    if (k) ilIdKod.set(il.id, k);
  }

  const where: Record<string, unknown> = {};
  if (yil && !isNaN(yil)) where.yil = yil;
  if (donem && DONEMLER.includes(donem)) where.donem = donem;
  if (kategori && KATEGORILER.includes(kategori)) where.kategori = kategori;

  const faal = await prisma.liseFaaliyet.findMany({
    where,
    select: { ilId: true, kategori: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true },
  });

  type Agg = { kategori: Record<string, number>; toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number };
  const aggregate: Record<string, Agg> = {};
  for (const f of faal) {
    const kod = ilIdKod.get(f.ilId);
    if (!kod) continue;
    let a = aggregate[kod];
    if (!a) { a = { kategori: {}, toplam: 0, katilimci: 0, ilkKez: 0, yeniIntisap: 0 }; aggregate[kod] = a; }
    a.kategori[f.kategori] = (a.kategori[f.kategori] ?? 0) + 1;
    a.toplam += 1;
    a.katilimci += f.katilimci;
    a.ilkKez += f.ilkKezKatilan;
    a.yeniIntisap += f.yeniIntisap;
  }

  const yillar = (await prisma.liseFaaliyet.findMany({ select: { yil: true }, distinct: ["yil"], orderBy: { yil: "desc" } })).map(y => y.yil);

  return NextResponse.json({ iller: aggregate, yillar });
}
