export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { AnalizClient } from "./AnalizClient";
import { ANALIZ_TUM_ALANLAR } from "@/lib/analiz-sorular";

/** Bir activity kaydından türetilmiş metrikler */
function metrikler(a: Record<string, number>) {
  // Lise/Üni toplam faaliyet = faaliyet türü sayılarının toplamı (yeni yapı)
  const lsToplamFaaliyet =
    (a.ls_ilimSohbetSayisi ?? 0) + (a.ls_sosyalSayisi ?? 0) + (a.ls_sorumlulukSayisi ?? 0) +
    (a.ls_muhabbetSayisi ?? 0) + (a.ls_namazSayisi ?? 0) + (a.ls_kafileSayisi ?? 0);
  const uniToplamFaaliyet =
    (a.uni_ilimSohbetSayisi ?? 0) + (a.uni_kulupSayisi ?? 0) + (a.uni_sosyalSayisi ?? 0) +
    (a.uni_sorumlulukSayisi ?? 0) + (a.uni_muhabbetSayisi ?? 0) + (a.uni_namazSayisi ?? 0) +
    (a.uni_kafileSayisi ?? 0) + (a.uni_kykBulusmaSayisi ?? 0);
  return {
    toplamFaaliyet: lsToplamFaaliyet + uniToplamFaaliyet,
    yeniIntisap:    (a.ls_yeniIntisap ?? 0) + (a.uni_yeniIntisap ?? 0),
    kafile:         (a.ls_kafileSayisi ?? 0) + (a.uni_kafileSayisi ?? 0) + (a.ortakKafileSayisi ?? 0),
    sabahNamazi:    (a.ls_namazSayisi ?? 0) + (a.uni_namazSayisi ?? 0) + (a.ortakSabahNamaziSayisi ?? 0),
    ilimDersi:      (a.ls_ilimSohbetSayisi ?? 0) + (a.uni_ilimSohbetSayisi ?? 0),
    kykBulusma:     a.uni_kykBulusmaSayisi ?? 0,
    ziyaret:        a.eay_toplamZiyaret ?? 0,
  };
}

const ACT_SELECT = {
  yil: true, donem: true, ilId: true,
  ls_ilimSohbetSayisi: true, ls_sosyalSayisi: true, ls_sorumlulukSayisi: true,
  ls_muhabbetSayisi: true, ls_namazSayisi: true,
  uni_ilimSohbetSayisi: true, uni_kulupSayisi: true, uni_sosyalSayisi: true,
  uni_sorumlulukSayisi: true, uni_muhabbetSayisi: true, uni_namazSayisi: true,
  ls_yeniIntisap: true, uni_yeniIntisap: true,
  ls_kafileSayisi: true, uni_kafileSayisi: true, ortakKafileSayisi: true,
  ortakSabahNamaziSayisi: true,
  uni_kykBulusmaSayisi: true,
  eay_toplamZiyaret: true,
} as const;

// Soru bazlı bölge karşılaştırması için tüm birim alanlarını da çek
const SORU_SELECT: Record<string, boolean> = {
  ...ACT_SELECT,
  ...Object.fromEntries(ANALIZ_TUM_ALANLAR.map(k => [k, true])),
};

export default async function AnalizPage({ searchParams }: { searchParams: Promise<{ yil?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!YONETICI_ROLLERI.includes(session.user.role as Role)) redirect("/");

  const sp = await searchParams;

  const yillar = (await prisma.activity.findMany({ select: { yil: true }, distinct: ["yil"], orderBy: { yil: "desc" } })).map(y => y.yil);
  const guncelYil = yillar[0] ?? new Date().getFullYear();
  const yil = sp.yil ? parseInt(sp.yil, 10) || guncelYil : guncelYil;
  const oncekiYil = yil - 1;

  const [acts, actsOnceki, bolgeler, gonulluOgrenim, gonulluToplam, gonulluIller, bursDurum, ekKayitDurum, housingTip, ogrenciSayisi, bolgeHedefler] =
    await Promise.all([
      prisma.activity.findMany({ where: { yil }, select: SORU_SELECT }),
      prisma.activity.findMany({ where: { yil: oncekiYil }, select: ACT_SELECT }),
      prisma.bolge.findMany({ select: { id: true, no: true, ad: true, iller: { select: { id: true } } }, orderBy: { no: "asc" } }),
      prisma.volunteer.groupBy({ by: ["ogrenim"], _count: { _all: true } }),
      prisma.volunteer.count(),
      prisma.volunteer.groupBy({ by: ["il"], _count: { _all: true }, orderBy: { _count: { il: "desc" } }, take: 8, where: { il: { not: null } } }),
      prisma.bursBasvuru.groupBy({ by: ["durum"], _count: { _all: true } }),
      prisma.ekKayitBasvuru.groupBy({ by: ["durum"], _count: { _all: true } }),
      prisma.housingUnit.groupBy({ by: ["tip"], _count: { _all: true }, where: { aktif: true } }),
      prisma.housingStudent.count(),
      prisma.bolgeHedef.findMany({ where: { yil }, select: { yeniIntisap: true, kafile: true, sabahNamazi: true, ilimDersi: true, kykBulusma: true, ziyaret: true } }),
    ]);

  // İl → bölge eşlemesi
  const ilToBolge = new Map<string, string>();
  for (const b of bolgeler) for (const il of b.iller) ilToBolge.set(il.id, b.ad);

  // Bölge bazlı toplamlar (seçili yıl)
  const bolgeMap = new Map<string, ReturnType<typeof metrikler>>();
  for (const b of bolgeler) bolgeMap.set(b.ad, { toplamFaaliyet: 0, yeniIntisap: 0, kafile: 0, sabahNamazi: 0, ilimDersi: 0, kykBulusma: 0, ziyaret: 0 });
  const toplam = { toplamFaaliyet: 0, yeniIntisap: 0, kafile: 0, sabahNamazi: 0, ilimDersi: 0, kykBulusma: 0, ziyaret: 0 };
  const donemMap = new Map<string, { toplamFaaliyet: number; yeniIntisap: number }>();

  for (const a of acts) {
    const m = metrikler(a as unknown as Record<string, number>);
    const bolgeAd = ilToBolge.get(a.ilId);
    if (bolgeAd) {
      const t = bolgeMap.get(bolgeAd)!;
      for (const k of Object.keys(m) as (keyof typeof m)[]) t[k] += m[k];
    }
    for (const k of Object.keys(m) as (keyof typeof m)[]) toplam[k] += m[k];
    const d = donemMap.get(a.donem) ?? { toplamFaaliyet: 0, yeniIntisap: 0 };
    d.toplamFaaliyet += m.toplamFaaliyet;
    d.yeniIntisap += m.yeniIntisap;
    donemMap.set(a.donem, d);
  }

  // Soru bazlı bölge × dönem toplamları (birim alanları → seçilen soruya göre karşılaştırma)
  const soruMap = new Map<string, Record<string, number>>(); // anahtar: `${bolgeAd}|${donem}`
  for (const a of acts) {
    const bolgeAd = ilToBolge.get(a.ilId);
    if (!bolgeAd) continue;
    const key = `${bolgeAd}|${a.donem}`;
    let row = soruMap.get(key);
    if (!row) { row = {}; soruMap.set(key, row); }
    const ar = a as unknown as Record<string, number>;
    for (const f of ANALIZ_TUM_ALANLAR) row[f] = (row[f] ?? 0) + (ar[f] ?? 0);
  }
  const bolgeNoMap = new Map(bolgeler.map(b => [b.ad, b.no]));
  const bolgeSoruVeri = Array.from(soruMap.entries()).map(([key, row]) => {
    const [bolgeAd, donem] = key.split("|");
    return { bolge: bolgeAd, bolgeNo: bolgeNoMap.get(bolgeAd) ?? 0, donem, ...row };
  });

  // Önceki yıl: toplamlar + dönem kırılımı (trend kıyası)
  const oncekiToplam = { toplamFaaliyet: 0, yeniIntisap: 0 };
  const oncekiDonemMap = new Map<string, { toplamFaaliyet: number; yeniIntisap: number }>();
  for (const a of actsOnceki) {
    const m = metrikler(a as unknown as Record<string, number>);
    oncekiToplam.toplamFaaliyet += m.toplamFaaliyet;
    oncekiToplam.yeniIntisap += m.yeniIntisap;
    const d = oncekiDonemMap.get(a.donem) ?? { toplamFaaliyet: 0, yeniIntisap: 0 };
    d.toplamFaaliyet += m.toplamFaaliyet;
    d.yeniIntisap += m.yeniIntisap;
    oncekiDonemMap.set(a.donem, d);
  }

  // Hedef vs gerçekleşme (yıl toplamı)
  const hedefToplam = { yeniIntisap: 0, kafile: 0, sabahNamazi: 0, ilimDersi: 0, kykBulusma: 0, ziyaret: 0 };
  for (const h of bolgeHedefler) {
    for (const k of Object.keys(hedefToplam) as (keyof typeof hedefToplam)[]) hedefToplam[k] += h[k];
  }

  const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
  const donemSerisi = DONEMLER.map(d => ({
    donem: d === "DONEM_1" ? "1. Dönem" : d === "DONEM_2" ? "2. Dönem" : "Yaz",
    [String(yil)]: donemMap.get(d)?.toplamFaaliyet ?? 0,
    [String(oncekiYil)]: oncekiDonemMap.get(d)?.toplamFaaliyet ?? 0,
  }));

  const data = {
    yil,
    oncekiYil,
    yillar: yillar.length ? yillar : [guncelYil],
    bolgeSerisi: bolgeler.map(b => ({ bolge: `${b.no}. Bölge`, bolgeTam: b.ad, ...bolgeMap.get(b.ad)! })),
    bolgeSoruVeri,
    bolgeListesi: bolgeler.map(b => ({ no: b.no, ad: b.ad })),
    donemSerisi,
    toplam,
    oncekiToplam,
    gonullu: {
      toplam: gonulluToplam,
      ogrenim: gonulluOgrenim.map(g => ({ ad: g.ogrenim, deger: g._count._all })),
      iller: gonulluIller.map(g => ({ ad: g.il ?? "—", deger: g._count._all })),
    },
    burs: bursDurum.map(b => ({ ad: b.durum, deger: b._count._all })),
    ekKayit: ekKayitDurum.map(b => ({ ad: b.durum, deger: b._count._all })),
    barinma: {
      tipler: housingTip.map(h => ({ ad: h.tip, deger: h._count._all })),
      ogrenci: ogrenciSayisi,
    },
    hedef: (Object.keys(hedefToplam) as (keyof typeof hedefToplam)[]).map(k => ({
      metrik: k,
      hedef: hedefToplam[k],
      gerceklesen: toplam[k],
    })),
  };

  return <AnalizClient data={data} />;
}
