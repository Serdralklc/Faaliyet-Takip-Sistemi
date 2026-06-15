import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { ilAdindanKod, IL_BILGI } from "@/lib/turkiye-iller";

export const dynamic = "force-dynamic";

interface Agg {
  toplamFaaliyet: number;
  yeniIntisap: number;
  ilimSohbet: number;
  dergah: number;
  kafile: number;
  ziyaret: number;
}
const bosAgg = (): Agg => ({ toplamFaaliyet: 0, yeniIntisap: 0, ilimSohbet: 0, dergah: 0, kafile: 0, ziyaret: 0 });
function ekle(a: Agg, b: Agg) {
  a.toplamFaaliyet += b.toplamFaaliyet;
  a.yeniIntisap    += b.yeniIntisap;
  a.ilimSohbet     += b.ilimSohbet;
  a.dergah         += b.dergah;
  a.kafile         += b.kafile;
  a.ziyaret        += b.ziyaret;
}

function actToAgg(a: Record<string, number>): Agg {
  const lsTop = (a.ls_ilimSohbetSayisi ?? 0) + (a.ls_sosyalSayisi ?? 0) + (a.ls_sorumlulukSayisi ?? 0)
              + (a.ls_muhabbetSayisi ?? 0) + (a.ls_namazSayisi ?? 0) + (a.ls_kafileSayisi ?? 0);
  const uniTop = (a.uni_ilimSohbetSayisi ?? 0) + (a.uni_kulupSayisi ?? 0) + (a.uni_sosyalSayisi ?? 0)
               + (a.uni_sorumlulukSayisi ?? 0) + (a.uni_muhabbetSayisi ?? 0) + (a.uni_namazSayisi ?? 0)
               + (a.uni_kafileSayisi ?? 0) + (a.uni_kykBulusmaSayisi ?? 0);
  return {
    toplamFaaliyet: lsTop + uniTop,
    yeniIntisap:    (a.ls_yeniIntisap ?? 0) + (a.uni_yeniIntisap ?? 0),
    ilimSohbet:     (a.ls_ilimSohbetSayisi ?? 0) + (a.uni_ilimSohbetSayisi ?? 0),
    dergah:         (a.ls_toplamDergah ?? 0) + (a.uni_toplamDergah ?? 0),
    kafile:         (a.ls_kafileSayisi ?? 0) + (a.uni_kafileSayisi ?? 0) + (a.ortakKafileSayisi ?? 0),
    ziyaret:        a.eay_toplamZiyaret ?? 0,
  };
}

const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const yilRaw = sp.get("yil");
  const yil = yilRaw ? parseInt(yilRaw, 10) : undefined;
  const donem = sp.get("donem");

  const where: Record<string, unknown> = {};
  if (yil && !isNaN(yil)) where.yil = yil;
  if (donem && DONEMLER.includes(donem)) where.donem = donem;

  const [bolgeler, acts, yillarRaw] = await Promise.all([
    prisma.bolge.findMany({
      select: { no: true, ad: true, iller: { select: { id: true, ad: true } } },
      orderBy: { no: "asc" },
    }),
    prisma.activity.findMany({
      where,
      select: {
        ilId: true,
        ls_ilimSohbetSayisi: true, ls_sosyalSayisi: true, ls_sorumlulukSayisi: true,
        ls_muhabbetSayisi: true, ls_namazSayisi: true, ls_kafileSayisi: true,
        ls_yeniIntisap: true, ls_toplamDergah: true,
        uni_ilimSohbetSayisi: true, uni_kulupSayisi: true, uni_sosyalSayisi: true,
        uni_sorumlulukSayisi: true, uni_muhabbetSayisi: true, uni_namazSayisi: true,
        uni_kafileSayisi: true, uni_kykBulusmaSayisi: true,
        uni_yeniIntisap: true, uni_toplamDergah: true,
        ortakKafileSayisi: true, eay_toplamZiyaret: true,
      },
    }),
    prisma.activity.findMany({ select: { yil: true }, distinct: ["yil"], orderBy: { yil: "desc" } }),
  ]);

  // il (org) → agg
  const ilAgg = new Map<string, Agg>();
  for (const a of acts) {
    let agg = ilAgg.get(a.ilId);
    if (!agg) { agg = bosAgg(); ilAgg.set(a.ilId, agg); }
    ekle(agg, actToAgg(a as unknown as Record<string, number>));
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
      return { ilId: il.id, ad: il.ad, kod, ...a };
    });
    return { no: b.no, ad: b.ad, birimler };
  });

  return NextResponse.json({ yillar: yillarRaw.map(y => y.yil), iller, bolgeler: bolgeOut });
}
