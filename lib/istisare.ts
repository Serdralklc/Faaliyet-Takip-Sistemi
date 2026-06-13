/**
 * İstişare Merkezi (kurumsal talep) — yönlendirme, görünürlük ve etiketler.
 * Birim → hedef rol/görev eşlemesi tek kaynak burada.
 */
import type { Role } from "@/lib/constants";

export type TalepBirim = "ILKOGRETIM" | "LISE" | "UNIVERSITE" | "UNIVERSITE_GENCLIK" | "LISE_GENCLIK" | "GENEL" | "TEKNIK";
export type TalepDurum = "YENI" | "INCELENIYOR" | "YANITLANDI" | "COZULDU" | "KAPATILDI";

export const TALEP_DURUMLAR: TalepDurum[] = ["YENI", "INCELENIYOR", "YANITLANDI", "COZULDU", "KAPATILDI"];

export const TALEP_DURUM_LABEL: Record<TalepDurum, string> = {
  YENI: "Yeni Talep",
  INCELENIYOR: "İnceleniyor",
  YANITLANDI: "Yanıtlandı",
  COZULDU: "Çözüldü",
  KAPATILDI: "Kapatıldı",
};
export const TALEP_DURUM_RENK: Record<TalepDurum, string> = {
  YENI:        "#DC2626",
  INCELENIYOR: "#D97706",
  YANITLANDI:  "#2563EB",
  COZULDU:     "#059669",
  KAPATILDI:   "#64748B",
};

export const TALEP_BIRIM_LABEL: Record<TalepBirim, string> = {
  ILKOGRETIM:         "İlköğretim",
  LISE:               "Lise",
  UNIVERSITE:         "Üniversite",
  UNIVERSITE_GENCLIK: "Üniversite Gençlik",
  LISE_GENCLIK:       "Lise Gençlik",
  GENEL:              "Genel",
  TEKNIK:             "Teknik",
};

// Birim → kime atanır (hedef rol/görev + etiket)
export interface TalepHedef { role: Role; merkezGorev: string | null; etiket: string }
export const TALEP_HEDEF: Record<TalepBirim, TalepHedef> = {
  ILKOGRETIM:         { role: "GENEL_MERKEZ", merkezGorev: "ILKOGRETIM", etiket: "Merkez İlköğretim Sorumlusu" },
  LISE:               { role: "GENEL_MERKEZ", merkezGorev: "LISE",       etiket: "Merkez Lise Sorumlusu" },
  UNIVERSITE:         { role: "GENEL_MERKEZ", merkezGorev: "UNIVERSITE", etiket: "Merkez Üniversite Sorumlusu" },
  UNIVERSITE_GENCLIK: { role: "TURKIYE_UNIVERSITE_SORUMLUSU", merkezGorev: null, etiket: "Merkez Üniversite Gençlik Sorumlusu" },
  LISE_GENCLIK:       { role: "TURKIYE_LISE_SORUMLUSU",       merkezGorev: null, etiket: "Merkez Lise Gençlik Sorumlusu" },
  GENEL:              { role: "GENEL_MERKEZ", merkezGorev: "SEKRETERYA", etiket: "Merkez Sekreterya" },
  TEKNIK:             { role: "TEKNIK",       merkezGorev: null,         etiket: "Teknik" },
};

/** Bir kullanıcının sistemine göre seçebileceği talep birimleri (oluşturma formu) */
export function birimSecenekleri(sistem: string): { value: TalepBirim; label: string }[] {
  if (sistem === "UNIVERSITE") return [
    { value: "UNIVERSITE_GENCLIK", label: "Üniversite Gençlik" },
    { value: "GENEL",              label: "Genel" },
    { value: "TEKNIK",             label: "Teknik" },
  ];
  if (sistem === "LISE") return [
    { value: "LISE_GENCLIK", label: "Lise Gençlik" },
    { value: "GENEL",        label: "Genel" },
    { value: "TEKNIK",       label: "Teknik" },
  ];
  // Eğitimci — tam birim seçimi
  return [
    { value: "ILKOGRETIM", label: "İlköğretim" },
    { value: "LISE",       label: "Lise" },
    { value: "UNIVERSITE", label: "Üniversite" },
    { value: "GENEL",      label: "Genel" },
    { value: "TEKNIK",     label: "Teknik" },
  ];
}

export function gecerliBirim(sistem: string, birim: string): birim is TalepBirim {
  return birimSecenekleri(sistem).some(b => b.value === birim);
}

// Tüm talepleri görenler: Admin + TR Eğitim Sorumlusu + Merkez Ekip (tüm görevler)
export const TALEP_HEPSI_ROLLERI: string[] = ["SISTEM_ADMIN", "TURKIYE_EGITIM_SORUMLUSU", "GENEL_MERKEZ"];
// Talep oluşturabilenler: il/bölge sorumluları (her sistem)
export const TALEP_OLUSTURAN_ROLLERI: string[] = ["IL_SORUMLUSU", "BOLGE_SORUMLUSU"];
// İstişare paneline (gelen kutusu) erişenler
export const TALEP_PANEL_ROLLERI: string[] = [
  ...TALEP_HEPSI_ROLLERI, "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK",
];

/**
 * Kullanıcının görebileceği/karşılayabileceği talep birimleri (F3: yan rol bazlı).
 * "HEPSI" = tüm talepler. Admin + TR Eğitim Sor./Yard. → hepsi; diğer Merkez kullanıcıları
 * yalnızca yan rollerine karşılık gelen birimleri görür.
 */
export function gorunurBirimler(role: string, yanRoller: string[] = []): TalepBirim[] | "HEPSI" {
  if (role === "SISTEM_ADMIN" || role === "TURKIYE_EGITIM_SORUMLUSU") return "HEPSI";
  const y = new Set(yanRoller);
  if (y.has("TR_EGITIM") || y.has("TR_EGITIM_YRD")) return "HEPSI";
  const b: TalepBirim[] = [];
  if (y.has("MERKEZ_ILKOGRETIM")) b.push("ILKOGRETIM", "TEKNIK"); // teknik birimi İlköğretim'le birleşik
  if (y.has("MERKEZ_LISE")) b.push("LISE");
  if (y.has("MERKEZ_UNI")) b.push("UNIVERSITE");
  if (y.has("SEKRETERYA")) b.push("GENEL");
  if (role === "TURKIYE_UNIVERSITE_SORUMLUSU" || y.has("MERKEZ_UNI_GENCLIK")) b.push("UNIVERSITE_GENCLIK");
  if (role === "TURKIYE_LISE_SORUMLUSU" || y.has("MERKEZ_LISE_GENCLIK")) b.push("LISE_GENCLIK");
  if (role === "TEKNIK") b.push("TEKNIK"); // eski TEKNIK rolü (uyum)
  return b;
}

/** Prisma where: kullanıcının erişebileceği talepler (yan rol bazlı görünürlük) */
export function talepGorunurlukWhere(userId: string, role: string, yanRoller: string[] = []): Record<string, unknown> {
  const b = gorunurBirimler(role, yanRoller);
  if (b === "HEPSI") return {};
  const or: Record<string, unknown>[] = [{ olusturanId: userId }];
  if (b.length) or.push({ birim: { in: b } });
  return { OR: or };
}

/** Bir talebe yanıt verebilir / durumunu değiştirebilir mi (karşılayan taraf mı) */
export function talepKarsilayanMi(birim: TalepBirim, role: string, yanRoller: string[] = []): boolean {
  const b = gorunurBirimler(role, yanRoller);
  if (b === "HEPSI") return true;
  return b.includes(birim);
}

/** dosyalar[] JSON string ↔ {ad,url} */
export interface TalepDosya { ad: string; url: string }
export function paketleDosya(d: TalepDosya): string { return JSON.stringify(d); }
export function cozDosya(s: string): TalepDosya | null {
  try { const o = JSON.parse(s); if (o && typeof o.url === "string") return { ad: String(o.ad ?? "Dosya"), url: o.url }; } catch { /* */ }
  return null;
}
