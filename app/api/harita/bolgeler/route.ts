import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ilAdindanKod } from "@/lib/turkiye-iller";

export const dynamic = "force-dynamic";

/** GET — il kodu → bölge eşlemesi (harita renklendirmesi için) */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const bolgeler = await prisma.bolge.findMany({
    select: { no: true, ad: true, iller: { select: { ad: true } } },
    orderBy: { no: "asc" },
  });

  // Coğrafi il kodu → bölge (bir ilin birden çok birimi varsa ilk/küçük no'lu bölge)
  const iller: Record<string, { bolgeNo: number; bolgeAd: string }> = {};
  for (const b of bolgeler) {
    for (const il of b.iller) {
      const kod = ilAdindanKod(il.ad);
      if (kod && !iller[kod]) iller[kod] = { bolgeNo: b.no, bolgeAd: b.ad };
    }
  }

  return NextResponse.json({ iller, bolgeler: bolgeler.map(b => ({ no: b.no, ad: b.ad })) });
}
