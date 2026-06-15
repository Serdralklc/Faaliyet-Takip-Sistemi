import "server-only";
import { prisma } from "./prisma";
import type { Sistem, Donem } from "@/app/generated/prisma/client";

// ── Faaliyet Yapılandırma Merkezi (Faz 1) ──────────────────────
// Dönem aç/kapa kilidi + alan görünür/zorunlu/aktif. Tamamı eklemeli:
// kayıt yoksa varsayılan açık/görünür → mevcut davranış birebir korunur.

export const DONEM_LABEL: Record<Donem, string> = {
  DONEM_1: "1. Dönem",
  DONEM_2: "2. Dönem",
  YAZ_DONEMI: "Yaz Dönemi",
};

export const SISTEM_LABEL: Record<Sistem, string> = {
  EGITIMCI: "Eğitim Birimi",
  UNIVERSITE: "Üniversite Gençlik",
  LISE: "Lise Gençlik",
};

/**
 * Hangi sistemde hangi dönemler GEÇERLİ — domain kuralı (kodda Donem enum düz
 * tutulur, bu kısıt yalnızca burada). Üni/Lise Gençlik'te yaz dönemi YOKTUR;
 * Eğitim Birimi'nde yaz dönemi yalnız İlköğretim alt biriminde anlamlıdır.
 */
export const GECERLI_DONEMLER: Record<Sistem, Donem[]> = {
  EGITIMCI: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
  UNIVERSITE: ["DONEM_1", "DONEM_2"],
  LISE: ["DONEM_1", "DONEM_2"],
};

export function donemGecerli(sistem: Sistem, donem: Donem): boolean {
  return GECERLI_DONEMLER[sistem]?.includes(donem) ?? false;
}

/** Eğitim Birimi alt birimleri → Activity alan ön ekleri. */
export const EGITIM_ALT_BIRIMLER = [
  { kod: "ILKOGRETIM", ad: "İlköğretim", prefix: "ik_" },
  { kod: "LISE", ad: "Lise", prefix: "ls_" },
  { kod: "UNIVERSITE", ad: "Üniversite", prefix: "uni_" },
  { kod: "ORTAK", ad: "Ortak Faaliyet", prefix: "ortak" },
  { kod: "EAY", ad: "Ev / Apart / Yurt", prefix: "eay_" },
] as const;

/** Yaz döneminde Eğitim Birimi'nde yalnız İlköğretim alanları girilebilir. */
export function egitimYazAlaniMi(alanKodu: string): boolean {
  return alanKodu.startsWith("ik_") || alanKodu === "muafIlkogretim";
}

export interface DonemDurum {
  acik: boolean;
  sebep: string | null;
}

/**
 * Bir (sistem, yıl, dönem) için veri girişi açık mı?
 * - Geçersiz dönem (ör. Üni/Lise + Yaz) → kapalı.
 * - Ayar kaydı yoksa → AÇIK (geriye dönük uyum).
 * - Kayıt varsa veriGirisiAcik + (varsa) tarih penceresi belirler.
 */
export async function donemGirisDurum(
  sistem: Sistem,
  yil: number,
  donem: Donem,
): Promise<DonemDurum> {
  if (!donemGecerli(sistem, donem)) {
    return { acik: false, sebep: `${SISTEM_LABEL[sistem]} sisteminde ${DONEM_LABEL[donem]} bulunmuyor.` };
  }

  const ayar = await prisma.donemAyar.findUnique({
    where: { sistem_yil_donem: { sistem, yil, donem } },
  });
  if (!ayar) return { acik: true, sebep: null };

  if (!ayar.veriGirisiAcik) {
    return { acik: false, sebep: ayar.aciklama || `${yil} ${DONEM_LABEL[donem]} veri girişi kapalı.` };
  }

  const now = new Date();
  if (ayar.baslangic && now < ayar.baslangic) {
    return { acik: false, sebep: `Veri girişi ${ayar.baslangic.toLocaleDateString("tr-TR")} tarihinde açılacak.` };
  }
  if (ayar.bitis && now > ayar.bitis) {
    return { acik: false, sebep: `Veri girişi ${ayar.bitis.toLocaleDateString("tr-TR")} tarihinde kapandı.` };
  }
  return { acik: true, sebep: null };
}

export interface AlanAyarDeger {
  gorunur: boolean;
  zorunlu: boolean;
  aktif: boolean;
  sira: number;
}

/** Bir sistemdeki alan ayarlarını alanKodu → ayar olarak döndürür (Faz 1b). */
export async function alanAyarlari(sistem: Sistem): Promise<Map<string, AlanAyarDeger>> {
  const rows = await prisma.alanAyar.findMany({ where: { sistem } });
  const m = new Map<string, AlanAyarDeger>();
  for (const r of rows) {
    m.set(r.alanKodu, { gorunur: r.gorunur, zorunlu: r.zorunlu, aktif: r.aktif, sira: r.sira });
  }
  return m;
}
