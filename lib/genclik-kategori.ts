import "server-only";
import { prisma } from "./prisma";
import { LISE_KATEGORILER } from "./lise-faaliyet";
import { UNI_KATEGORILER } from "./universite-faaliyet";

// Gençlik (Üni/Lise) kategori + faaliyet türü birleştirme.
// Kategori enum'u storage/rapor için sabit; burası yalnız GİRİŞ UI'sı için
// görüntü (ad/aktif/sıra) + faaliyet adı (tür) önerilerini üretir.
// Kayıt yoksa sabit varsayılanlara döner → mevcut davranış korunur.

export type GenclikSistem = "UNIVERSITE" | "LISE";

export interface MergedKategori {
  key: string;
  label: string;
  adlar: string[];
  renk: string;
  aktif: boolean;
}

function defaults(sistem: GenclikSistem) {
  return sistem === "UNIVERSITE" ? UNI_KATEGORILER : LISE_KATEGORILER;
}

/** Giriş formlarının kullandığı birleşik kategori yapısı (sabit liste + admin override). */
export async function genclikKategoriYapisi(sistem: GenclikSistem): Promise<MergedKategori[]> {
  const base = defaults(sistem);
  const [overlay, turler] = await Promise.all([
    prisma.kategoriAyar.findMany({ where: { sistem } }),
    prisma.faaliyetTuru.findMany({ where: { sistem }, orderBy: [{ sira: "asc" }, { ad: "asc" }] }),
  ]);

  const ovMap = new Map(overlay.map(o => [o.kategoriKodu, o]));
  const turMap = new Map<string, string[]>();
  for (const t of turler) {
    if (!t.aktif) continue;
    const arr = turMap.get(t.kategoriKodu) ?? [];
    arr.push(t.ad);
    turMap.set(t.kategoriKodu, arr);
  }

  const withSira = base.map((k, i) => {
    const ov = ovMap.get(k.key);
    const tanimli = turMap.get(k.key);
    let adlar: string[];
    if (k.key === "DIGER") {
      adlar = []; // tamamen manuel
    } else if (tanimli && tanimli.length) {
      adlar = [...tanimli, "Diğer"];
    } else {
      adlar = k.adlar; // sabit varsayılan (zaten "Diğer" ile biter)
    }
    return {
      key: k.key,
      label: ov?.ad || k.label,
      adlar,
      renk: k.renk,
      aktif: ov ? ov.aktif : true,
      sira: ov?.sira ?? i,
    };
  });

  withSira.sort((a, b) => a.sira - b.sira);
  return withSira.map(({ key, label, adlar, renk, aktif }) => ({ key, label, adlar, renk, aktif }));
}
