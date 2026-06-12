/**
 * Birim bazlı veri durumu — bölge eğitimcisi her il × birim için
 * "Girildi / Girilmedi / Çalışma yok (muaf)" ayrımını görebilsin diye.
 *
 * Tek kaynak: hem bölge ana sayfası (server) hem İl Kontrol (client) burayı kullanır.
 */

export type BirimDurum = "girildi" | "girilmedi" | "muaf";
export type BirimKey = "ILKOGRETIM" | "LISE" | "UNIVERSITE" | "BARINMA";

export const BIRIMLER: BirimKey[] = ["ILKOGRETIM", "LISE", "UNIVERSITE", "BARINMA"];

/** Bir birimin "veri girildi" sayılması için ≥1'i pozitif olması gereken alanlar */
export const BIRIM_ALANLAR: Record<BirimKey, string[]> = {
  ILKOGRETIM: [
    "ik_toplamDergah", "ik_kursuYapilanDergah", "ik_egitmenSayisi",
    "ik_egitmenYardimciSayisi", "ik_elifBaOgrenci", "ik_kuranOgrenci", "ik_gecisOgrenci",
  ],
  LISE: [
    "ls_liseliOgrenciSayisi", "ls_toplamDergah", "ls_ilimDersYeri",
    "ls_ilimDersKatilim", "ls_toplamFaaliyet", "ls_yeniIntisap",
  ],
  UNIVERSITE: [
    "uni_universiteliOgrenciSayisi", "uni_toplamDergah", "uni_ilimDersYeri",
    "uni_ilimDersKatilim", "uni_toplamFaaliyet", "uni_kykBulusmaSayisi",
    "uni_kykKatilim", "uni_yeniIntisap",
  ],
  BARINMA: [
    // Eklenmiş ev/apart/yurt birim sayısı (Il.housingUnits) — server tarafında enjekte edilir
    "_housingUnits",
    "eay_mevcutEv", "eay_mevcutApart", "eay_mevcutYurt",
    "eay_acilacakEv", "eay_acilacakApart", "eay_acilacakYurt",
    "eay_kapanacakEv", "eay_kapanacakApart", "eay_kapanacakYurt",
    "eay_bursBalan", "eay_iliskiKesme", "eay_toplamZiyaret",
  ],
};

const MUAF_ALAN: Record<BirimKey, string> = {
  ILKOGRETIM: "muafIlkogretim",
  LISE: "muafLise",
  UNIVERSITE: "muafUniversite",
  // Barınma muafiyeti il-bazlı (Il.barinmaYok) — server, veri objesine barinmaYok enjekte eder
  BARINMA: "barinmaYok",
};

export const BIRIM_ETIKET: Record<BirimKey, string> = {
  ILKOGRETIM: "İlköğretim",
  LISE: "Lise",
  UNIVERSITE: "Üniversite",
  BARINMA: "Barınma",
};

export const BIRIM_KISA: Record<BirimKey, string> = {
  ILKOGRETIM: "İlk", LISE: "Lise", UNIVERSITE: "Üni", BARINMA: "Barınma",
};

export const BIRIM_RENK: Record<BirimKey, string> = {
  ILKOGRETIM: "#006B3F", LISE: "#0369A1", UNIVERSITE: "#7C3AED", BARINMA: "#0891B2",
};

type Rec = Record<string, unknown> | null | undefined;

/** Activity kaydı (veya null) için belirli bir birimin durumu */
export function birimDurum(a: Rec, birim: BirimKey): BirimDurum {
  if (!a) return "girilmedi";
  if (a[MUAF_ALAN[birim]] === true) return "muaf";
  const dolu = BIRIM_ALANLAR[birim].some(
    (k) => typeof a[k] === "number" && (a[k] as number) > 0
  );
  return dolu ? "girildi" : "girilmedi";
}

/** Muafiyet etiketi birime göre değişir (barınma için "yok" daha uygun) */
export function muafEtiket(birim: BirimKey): string {
  return birim === "BARINMA" ? "Ev/apart/yurt yok" : "Çalışma yok";
}

export function durumEtiket(durum: BirimDurum, birim: BirimKey): string {
  if (durum === "girildi") return "Girildi";
  if (durum === "muaf") return muafEtiket(birim);
  return "Girilmedi";
}

/** Bir ilin tüm birimleri muaf-dışı girildiyse "tamam" sayılır (hiç eksik yok) */
export function ilTamam(a: Rec): boolean {
  return BIRIMLER.every((b) => birimDurum(a, b) !== "girilmedi");
}
