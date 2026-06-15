import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ilAdindanKod } from "@/lib/turkiye-iller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const kod = sp.get("kod");
  const ilId = sp.get("ilId");
  const bolgeNo = sp.get("bolgeNo");
  const yilRaw = sp.get("yil");
  const yil = yilRaw ? parseInt(yilRaw, 10) : undefined;
  const donem = sp.get("donem");
  const kategori = sp.get("kategori");

  let ilIdler: string[] | undefined;
  if (ilId) {
    ilIdler = [ilId];
  } else if (kod) {
    const iller = await prisma.il.findMany({ select: { id: true, ad: true } });
    ilIdler = iller.filter(i => ilAdindanKod(i.ad) === kod).map(i => i.id);
    if (!ilIdler.length) return NextResponse.json([]);
  } else if (bolgeNo) {
    const no = parseInt(bolgeNo, 10);
    if (isNaN(no)) return NextResponse.json({ error: "geçersiz bolgeNo" }, { status: 400 });
    const bolge = await prisma.bolge.findFirst({ where: { no }, select: { iller: { select: { id: true } } } });
    if (!bolge) return NextResponse.json([]);
    ilIdler = bolge.iller.map(i => i.id);
  } else {
    return NextResponse.json({ error: "kod, ilId veya bolgeNo gerekli" }, { status: 400 });
  }

  const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
  const KATEGORILER = ["ILIM_SOHBET", "KULUP", "SOSYAL", "SOSYAL_SORUMLULUK", "MUHABBET", "NAMAZ", "KAFILE", "KYK", "DIGER"];
  const where: Record<string, unknown> = { ilId: { in: ilIdler } };
  if (yil && !isNaN(yil)) where.yil = yil;
  if (donem && DONEMLER.includes(donem)) where.donem = donem;
  if (kategori && KATEGORILER.includes(kategori)) where.kategori = kategori;

  const faaliyetler = await prisma.universiteFaaliyet.findMany({
    where,
    orderBy: { tarih: "desc" },
    take: bolgeNo ? 50 : 20,
    select: { id: true, tarih: true, kategori: true, faaliyetAdi: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true },
  });

  return NextResponse.json(faaliyetler);
}
