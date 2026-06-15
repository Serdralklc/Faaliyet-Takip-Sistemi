import "server-only";
import { prisma } from "./prisma";

// Gençlik faaliyetleri için kategoriye bağlı özel alanlar (Faz 3 — dinamik form tasarımcısı).
// Cevaplar faaliyetin ozelAlanlar JSON'unda { [kod]: değer } olarak saklanır.

export type OzelAlanTip = "METIN" | "UZUN_METIN" | "SAYI" | "TARIH" | "TEK_SECIM" | "EVET_HAYIR";

export const OZEL_TIPLER: { kod: OzelAlanTip; ad: string; secenekli?: boolean }[] = [
  { kod: "METIN", ad: "Kısa Metin" },
  { kod: "UZUN_METIN", ad: "Uzun Metin" },
  { kod: "SAYI", ad: "Sayı" },
  { kod: "TARIH", ad: "Tarih" },
  { kod: "TEK_SECIM", ad: "Tekli Seçim", secenekli: true },
  { kod: "EVET_HAYIR", ad: "Evet / Hayır" },
];

export const OZEL_TIP_KODLAR = OZEL_TIPLER.map(t => t.kod) as string[];

export interface OzelAlanDef {
  kod: string;
  ad: string;
  tip: string;
  kategoriKodu: string;
  zorunlu: boolean;
  sira: number;
  secenekler: string[];
  aktif: boolean;
}

/** Bir sistemin aktif özel alan tanımları (sıralı). */
export async function ozelAlanlariGetir(sistem: "UNIVERSITE" | "LISE"): Promise<OzelAlanDef[]> {
  const rows = await prisma.ozelAlan.findMany({
    where: { sistem, aktif: true },
    orderBy: [{ sira: "asc" }, { ad: "asc" }],
  });
  return rows.map(r => ({
    kod: r.kod, ad: r.ad, tip: r.tip, kategoriKodu: r.kategoriKodu,
    zorunlu: r.zorunlu, sira: r.sira, secenekler: r.secenekler, aktif: r.aktif,
  }));
}

const TR_MAP: Record<string, string> = {
  "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
  "Ç": "c", "Ğ": "g", "İ": "i", "I": "i", "Ö": "o", "Ş": "s", "Ü": "u",
};

/** "Gidilen Şehir" → "gidilen_sehir" (değişmez kod tabanı). */
export function slugKod(ad: string): string {
  const base = ad
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, c => TR_MAP[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "alan";
}
