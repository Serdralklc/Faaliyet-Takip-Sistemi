import { prisma } from "@/lib/prisma";

export interface BolgeFaaliyet {
  id: string; il: string; tarih: string; yil: number; donem: string; kategori: string;
  faaliyetAdi: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number;
}

export interface IlFaaliyetOzet {
  ilId: string;
  il: string;
  toplam: number;
  sonGiris: string | null; // ISO veya null
  katilimci: number;
}

const FAAL_SELECT = {
  id: true, ilId: true, tarih: true, yil: true, donem: true, kategori: true,
  faaliyetAdi: true, katilimci: true, ilkKezKatilan: true, yeniIntisap: true,
} as const;

/** Bölgenin illerinin (üni veya lise) gençlik faaliyetleri — her kayıtta il adıyla. */
export async function bolgeGenclikFaaliyetler(
  bolgeId: string,
  sistem: "UNIVERSITE" | "LISE",
): Promise<{ iller: { id: string; ad: string }[]; faaliyetler: BolgeFaaliyet[] }> {
  const iller = await prisma.il.findMany({ where: { bolgeId }, orderBy: { ad: "asc" }, select: { id: true, ad: true } });
  const ilMap = new Map(iller.map(i => [i.id, i.ad]));
  const ilIds = iller.map(i => i.id);
  if (!ilIds.length) return { iller, faaliyetler: [] };

  const ham = sistem === "UNIVERSITE"
    ? await prisma.universiteFaaliyet.findMany({ where: { ilId: { in: ilIds } }, orderBy: { tarih: "desc" }, select: FAAL_SELECT })
    : await prisma.liseFaaliyet.findMany({ where: { ilId: { in: ilIds } }, orderBy: { tarih: "desc" }, select: FAAL_SELECT });

  const faaliyetler: BolgeFaaliyet[] = ham.map(f => ({
    id: f.id, il: ilMap.get(f.ilId) ?? "—", tarih: f.tarih.toISOString(), yil: f.yil,
    donem: String(f.donem), kategori: String(f.kategori), faaliyetAdi: f.faaliyetAdi,
    katilimci: f.katilimci, ilkKezKatilan: f.ilkKezKatilan, yeniIntisap: f.yeniIntisap,
  }));
  return { iller, faaliyetler };
}

/** Tek ilin gençlik faaliyetleri (il sorumlusu Raporlar için). */
export async function ilGenclikFaaliyetler(
  ilId: string,
  ilAd: string,
  sistem: "UNIVERSITE" | "LISE",
): Promise<BolgeFaaliyet[]> {
  const ham = sistem === "UNIVERSITE"
    ? await prisma.universiteFaaliyet.findMany({ where: { ilId }, orderBy: { tarih: "desc" }, select: FAAL_SELECT })
    : await prisma.liseFaaliyet.findMany({ where: { ilId }, orderBy: { tarih: "desc" }, select: FAAL_SELECT });
  return ham.map(f => ({
    id: f.id, il: ilAd, tarih: f.tarih.toISOString(), yil: f.yil,
    donem: String(f.donem), kategori: String(f.kategori), faaliyetAdi: f.faaliyetAdi,
    katilimci: f.katilimci, ilkKezKatilan: f.ilkKezKatilan, yeniIntisap: f.yeniIntisap,
  }));
}

/** "Eksik Veri Girişi – İller": her il için toplam faaliyet + son giriş tarihi. */
export function ilFaaliyetOzetleri(
  iller: { id: string; ad: string }[],
  faaliyetler: BolgeFaaliyet[],
): IlFaaliyetOzet[] {
  return iller.map(il => {
    const ilFaal = faaliyetler.filter(f => f.il === il.ad);
    const sonGiris = ilFaal.length
      ? ilFaal.reduce((a, b) => (a.tarih > b.tarih ? a : b)).tarih
      : null;
    return {
      ilId: il.id,
      il: il.ad,
      toplam: ilFaal.length,
      sonGiris,
      katilimci: ilFaal.reduce((s, f) => s + f.katilimci, 0),
    };
  });
}
