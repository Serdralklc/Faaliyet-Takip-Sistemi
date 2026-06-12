/**
 * Gençlik (Üniversite / Lise) Muradımız — kategori bazlı hedef yardımcıları.
 * Hedefler faaliyet kategorilerine göre tutulur (+ Yeni İntisap).
 * gerçekleşen = faaliyet-bazlı kayıtlardan otomatik toplanır.
 */
import { UNI_KATEGORILER } from "./universite-faaliyet";
import { LISE_KATEGORILER } from "./lise-faaliyet";

export type GenclikSistem = "UNIVERSITE" | "LISE";

export interface HedefMetrik { key: string; label: string; renk: string }

/** Bir sistemin hedef metrikleri: Yeni İntisap + faaliyet kategorileri (Diğer hariç) */
export function hedefMetrikleri(sistem: GenclikSistem): HedefMetrik[] {
  const kats = (sistem === "UNIVERSITE" ? UNI_KATEGORILER : LISE_KATEGORILER)
    .filter(k => k.key !== "DIGER");
  return [
    { key: "YENI_INTISAP", label: "Yeni İntisap", renk: "#0B6B3A" },
    ...kats.map(k => ({ key: k.key, label: k.label, renk: k.renk })),
  ];
}

/** hedefler JSON'unu yalnızca geçerli metrik anahtarları + negatif olmayan tamsayılarla temizler */
export function temizleHedefler(sistem: GenclikSistem, raw: unknown): Record<string, number> {
  const gecerli = new Set(hedefMetrikleri(sistem).map(m => m.key));
  const out: Record<string, number> = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!gecerli.has(k)) continue;
      const n = Math.max(0, Math.floor(Number(v) || 0));
      if (n > 0) out[k] = n;
    }
  }
  return out;
}

/** Faaliyet kayıtlarından gerçekleşen: kategori → faaliyet sayısı + Yeni İntisap toplamı */
export function gerceklesenHedef(
  faaliyetler: { kategori: string; yeniIntisap: number }[],
): Record<string, number> {
  const r: Record<string, number> = { YENI_INTISAP: 0 };
  for (const f of faaliyetler) {
    r[f.kategori] = (r[f.kategori] ?? 0) + 1;
    r.YENI_INTISAP += f.yeniIntisap ?? 0;
  }
  return r;
}

export function asNumberMap(j: unknown): Record<string, number> {
  if (j && typeof j === "object") {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  }
  return {};
}
