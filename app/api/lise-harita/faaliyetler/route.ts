import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ilAdindanKod } from "@/lib/turkiye-iller";

export const dynamic = "force-dynamic";

/** GET — bir il (kod) veya tek birim (ilId) için son Lise faaliyetleri */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const kod = sp.get("kod");
  const ilId = sp.get("ilId");
  const yilRaw = sp.get("yil");
  const yil = yilRaw ? parseInt(yilRaw, 10) : undefined;

  let ilIdler: string[] | undefined;
  if (ilId) {
    ilIdler = [ilId];
  } else if (kod) {
    const iller = await prisma.il.findMany({ select: { id: true, ad: true } });
    ilIdler = iller.filter(i => ilAdindanKod(i.ad) === kod).map(i => i.id);
    if (!ilIdler.length) return NextResponse.json([]);
  } else {
    return NextResponse.json({ error: "kod veya ilId gerekli" }, { status: 400 });
  }

  const faaliyetler = await prisma.liseFaaliyet.findMany({
    where: { ilId: { in: ilIdler }, ...(yil && !isNaN(yil) ? { yil } : {}) },
    orderBy: { tarih: "desc" },
    take: 20,
    select: { id: true, tarih: true, kategori: true, faaliyetAdi: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true },
  });

  return NextResponse.json(faaliyetler);
}
