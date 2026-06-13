"use client";

/**
 * Asistan araç sonuçlarını ( /api/asistan dönüşündeki `veriler` ) kurumsal
 * PDF/Excel çıktısına çevirir. Mevcut export altyapısını (lib/export/corporate)
 * yeniden kullanır — Türkçe font, logo, marka başlığı hazır gelir.
 */

import { exportPdf, exportExcel, type ExportSpec } from "@/lib/export/corporate";

export interface AsistanVeri {
  arac: string;
  sonuc: any;
}

const GRUP_LABEL: Record<string, string> = {
  ilkogretim: "İlköğretim",
  lise: "Lise",
  universite: "Üniversite",
  barinma: "Barınma",
};

/** Bir bölgeOzeti sonucundaki grup nesnelerini {birim,metrik,deger} satırlarına açar. */
function ozetSatirlari(sonuc: any): { birim: string; metrik: string; deger: number }[] {
  const out: { birim: string; metrik: string; deger: number }[] = [];
  for (const grup of ["ilkogretim", "lise", "universite", "barinma"]) {
    const obj = sonuc?.[grup];
    if (!obj || typeof obj !== "object") continue;
    for (const [metrik, deger] of Object.entries(obj)) {
      if (typeof deger === "number") out.push({ birim: GRUP_LABEL[grup], metrik, deger });
    }
  }
  return out;
}

/** veriler dizisinden tek bir ExportSpec üretir (yoksa null). */
export function verilerdenSpec(veriler: AsistanVeri[] | undefined): ExportSpec | null {
  if (!veriler || veriler.length === 0) return null;

  // Aynı türden çağrıları grupla; en "zengin" türü seç
  const barinma = veriler.filter((v) => v.arac === "barinmaOgrencileri" && !v.sonuc?.hata);
  const kiyas = veriler.find((v) => v.arac === "bolgeDonemKiyas" && !v.sonuc?.hata);
  const hedef = veriler.find((v) => v.arac === "hedefGerceklesme" && !v.sonuc?.hata);
  const ozet = veriler.find((v) => v.arac === "bolgeOzeti" && !v.sonuc?.hata);

  // 1) Barınma öğrenci listesi
  if (barinma.length > 0) {
    const tumOgrenciler = barinma.flatMap((v) => v.sonuc.ogrenciler ?? []);
    if (tumOgrenciler.length === 0) return null;
    const b = barinma[0].sonuc;
    return {
      title: `${b.bolge?.ad ?? "Bölge"} — Barınma Öğrencileri`,
      subtitle: barinma.length === 1 ? b.tip : "Ev + Apart + Yurt",
      columns: [
        { header: "Ad Soyad", key: "adSoyad", width: 24 },
        { header: "İl", key: "il", width: 16 },
        { header: "Birim", key: "birim", width: 24 },
        { header: "Bölüm", key: "bolum", width: 22 },
        { header: "Sınıf", key: "sinif", width: 10 },
        { header: "Burslu", key: "burslu", width: 10 },
      ],
      rows: tumOgrenciler.map((o: any) => ({
        adSoyad: o.adSoyad,
        il: o.il,
        birim: o.birim,
        bolum: o.bolum ?? "—",
        sinif: o.sinif ?? "—",
        burslu: o.burslu ? "Evet" : "Hayır",
      })),
    };
  }

  // 2) Dönem kıyaslaması
  if (kiyas) {
    const s = kiyas.sonuc;
    const d1 = s.donem1 ?? {};
    const d2 = s.donem2?.hata ? {} : s.donem2 ?? {};
    const s1 = ozetSatirlari(d1);
    const s2map = new Map(ozetSatirlari(d2).map((r) => [`${r.birim}|${r.metrik}`, r.deger]));
    return {
      title: `${s.bolge?.ad ?? "Bölge"} — Dönem Kıyaslaması`,
      subtitle: `${s.yil} • 1. Dönem ↔ 2. Dönem`,
      columns: [
        { header: "Birim", key: "birim", width: 14 },
        { header: "Metrik", key: "metrik", width: 36 },
        { header: "1. Dönem", key: "d1" },
        { header: "2. Dönem", key: "d2" },
        { header: "Fark", key: "fark" },
      ],
      rows: s1.map((r) => {
        const v2 = s2map.get(`${r.birim}|${r.metrik}`) ?? 0;
        return { birim: r.birim, metrik: r.metrik, d1: r.deger, d2: v2, fark: v2 - r.deger };
      }),
    };
  }

  // 3) Hedef gerçekleşme
  if (hedef) {
    const s = hedef.sonuc;
    return {
      title: `${s.bolge?.ad ?? "Bölge"} — Hedef Gerçekleşme`,
      subtitle: `${s.yil} • ${s.donem}`,
      columns: [
        { header: "Metrik", key: "metrik", width: 24 },
        { header: "Hedef", key: "hedef" },
        { header: "Gerçekleşen", key: "gerceklesen" },
        { header: "Yüzde", key: "yuzde" },
      ],
      rows: (s.satirlar ?? []).map((r: any) => ({
        metrik: r.metrik,
        hedef: r.hedef,
        gerceklesen: r.gerceklesen,
        yuzde: r.yuzde === null || r.yuzde === undefined ? "—" : `%${r.yuzde}`,
      })),
    };
  }

  // 4) Bölge özeti
  if (ozet) {
    const s = ozet.sonuc;
    return {
      title: `${s.bolge?.ad ?? "Bölge"} — Faaliyet Özeti`,
      subtitle: `${s.yil} • ${s.donem}`,
      columns: [
        { header: "Birim", key: "birim", width: 14 },
        { header: "Metrik", key: "metrik", width: 40 },
        { header: "Değer", key: "deger" },
      ],
      rows: ozetSatirlari(s).map((r) => ({ birim: r.birim, metrik: r.metrik, deger: r.deger })),
    };
  }

  return null;
}

export async function asistanPdfIndir(veriler: AsistanVeri[] | undefined): Promise<boolean> {
  const spec = verilerdenSpec(veriler);
  if (!spec) return false;
  await exportPdf(spec);
  return true;
}

export async function asistanExcelIndir(veriler: AsistanVeri[] | undefined): Promise<boolean> {
  const spec = verilerdenSpec(veriler);
  if (!spec) return false;
  await exportExcel(spec);
  return true;
}
