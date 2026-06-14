export type Role =
  | "SISTEM_ADMIN"
  | "GENEL_MERKEZ"
  | "TURKIYE_EGITIM_SORUMLUSU"
  | "TURKIYE_UNIVERSITE_SORUMLUSU"
  | "TURKIYE_LISE_SORUMLUSU"
  | "TEKNIK"
  | "BOLGE_SORUMLUSU"
  | "IL_SORUMLUSU"
  | "BEKLEYEN";

export const ROLE_LABELS: Record<Role, string> = {
  SISTEM_ADMIN:                  "Sistem Admini",
  GENEL_MERKEZ:                  "Merkez Ekibi",
  TURKIYE_EGITIM_SORUMLUSU:      "Türkiye Eğitim Sorumlusu",
  TURKIYE_UNIVERSITE_SORUMLUSU:  "Merkez Üniversite Gençlik Sorumlusu",
  TURKIYE_LISE_SORUMLUSU:        "Merkez Lise Gençlik Sorumlusu",
  TEKNIK:                        "Teknik",
  BOLGE_SORUMLUSU:               "Bölge Eğitimcisi",
  IL_SORUMLUSU:                  "İl Eğitimcisi",
  BEKLEYEN:                      "Bekleyen",
};

// Merkez Ekip (GENEL_MERKEZ) görev ayrımı — hepsi Merkez Ekip ile aynı yetkilere sahip
export type MerkezGorev = "ILKOGRETIM" | "LISE" | "UNIVERSITE" | "SEKRETERYA";
export const MERKEZ_GOREV_LABEL: Record<MerkezGorev, string> = {
  ILKOGRETIM: "Merkez İlköğretim Sorumlusu",
  LISE:       "Merkez Lise Sorumlusu",
  UNIVERSITE: "Merkez Üniversite Sorumlusu",
  SEKRETERYA: "Merkez Sekreterya",
};

/**
 * Rol etiketi — sisteme duyarlı. İl/Bölge sorumlusu LISE/UNIVERSITE sisteminde
 * "İl/Bölge Lise (Üniversite) Gençlik Sorumlusu" olarak görünür (başvurulan görev adıyla aynı).
 */
export function rolEtiket(role: Role | string, sistem?: string | null): string {
  if (role === "IL_SORUMLUSU") {
    if (sistem === "LISE") return "İl Lise Gençlik Sorumlusu";
    if (sistem === "UNIVERSITE") return "İl Üniversite Gençlik Sorumlusu";
    return "İl Eğitimcisi";
  }
  if (role === "BOLGE_SORUMLUSU") {
    if (sistem === "LISE") return "Bölge Lise Gençlik Sorumlusu";
    if (sistem === "UNIVERSITE") return "Bölge Üniversite Gençlik Sorumlusu";
    return "Bölge Eğitimcisi";
  }
  return ROLE_LABELS[role as Role] ?? String(role);
}

/**
 * Görev etiketi — Merkez Ekip görev ayrımını da hesaba katar.
 * GENEL_MERKEZ + merkezGorev varsa "Merkez İlköğretim/Lise/Üniversite Sorumlusu / Sekreterya".
 */
export function gorevEtiket(role: Role | string, sistem?: string | null, merkezGorev?: string | null): string {
  if (role === "GENEL_MERKEZ" && merkezGorev && merkezGorev in MERKEZ_GOREV_LABEL) {
    return MERKEZ_GOREV_LABEL[merkezGorev as MerkezGorev];
  }
  return rolEtiket(role, sistem);
}

/**
 * Rol atama / değiştirme yetkisi (davet, onaylama, yetki alma, görev atama, devir).
 * Yalnızca: Sistem Admini + Türkiye Eğitim Sorumlusu + İçerik Yöneticisi yetkisi verilmiş kişi.
 */
export function rolAtayabilir(role: string, icerikYoneticisi?: boolean | null): boolean {
  return role === "SISTEM_ADMIN" || role === "TURKIYE_EGITIM_SORUMLUSU" || !!icerikYoneticisi;
}

/** İçerik Yöneticisi rolünü verme/alma yetkisi: yalnızca Sistem Admini. */
export function icerikYoneticisiAtayabilir(role: string): boolean {
  return role === "SISTEM_ADMIN";
}

/** Sistem sorumlusu (Merkez Üni/Lise Gençlik Sorumlusu): yalnızca kendi sistemini görür/yönetir. */
export function sistemSorumlusu(role: string): boolean {
  return role === "TURKIYE_UNIVERSITE_SORUMLUSU" || role === "TURKIYE_LISE_SORUMLUSU";
}

// ──────────────────────────────────────────────
// F2: Ana Rol / Yan Rol katalogları (Yönetim Merkezi) — ayrı tablolarda saklanır;
// burada UI/etiket + uyum-köprüsü (eski role/flag alanlarıyla senkron) için sabitler.
// ──────────────────────────────────────────────
export type AnaRolKod = "ADMIN" | "MERKEZ" | "UNIVERSITE_GENCLIK" | "LISE_GENCLIK";
export type YanRolKod =
  | "TR_EGITIM" | "TR_EGITIM_YRD" | "MERKEZ_UNI" | "MERKEZ_LISE" | "MERKEZ_ILKOGRETIM"
  | "SEKRETERYA" | "MERKEZ_UNI_GENCLIK" | "MERKEZ_LISE_GENCLIK" | "ICERIK_YONETICISI";

export const ANA_ROLLER: { kod: AnaRolKod; ad: string }[] = [
  { kod: "ADMIN",              ad: "Admin" },
  { kod: "MERKEZ",             ad: "Merkez" },
  { kod: "UNIVERSITE_GENCLIK", ad: "Üniversite Gençlik" },
  { kod: "LISE_GENCLIK",       ad: "Lise Gençlik" },
];

export const YAN_ROLLER: { kod: YanRolKod; ad: string }[] = [
  { kod: "TR_EGITIM",           ad: "Türkiye Eğitim Sorumlusu" },
  { kod: "TR_EGITIM_YRD",       ad: "Türkiye Eğitim Sorumlu Yardımcısı" },
  { kod: "MERKEZ_UNI",          ad: "Merkez Üniversite Sorumlusu" },
  { kod: "MERKEZ_LISE",         ad: "Merkez Lise Sorumlusu" },
  { kod: "MERKEZ_ILKOGRETIM",   ad: "Merkez İlköğretim Sorumlusu" },
  { kod: "SEKRETERYA",          ad: "Sekreterya Sorumlusu" },
  { kod: "MERKEZ_UNI_GENCLIK",  ad: "Merkez Üniversite Gençlik Sorumlusu" },
  { kod: "MERKEZ_LISE_GENCLIK", ad: "Merkez Lise Gençlik Sorumlusu" },
  { kod: "ICERIK_YONETICISI",   ad: "İçerik Yöneticisi" },
];

export const ANA_ROL_LABEL: Record<string, string> = Object.fromEntries(ANA_ROLLER.map(a => [a.kod, a.ad]));
export const YAN_ROL_LABEL: Record<string, string> = Object.fromEntries(YAN_ROLLER.map(y => [y.kod, y.ad]));

// Ana rol kodu → uyum köprüsü (eski `role` + `sistem`). Ana rol değişince bu alanlar senkronlanır.
export const ANA_ROL_COMPAT: Record<AnaRolKod, { role: Role; sistem: string }> = {
  ADMIN:              { role: "SISTEM_ADMIN",                 sistem: "EGITIMCI" },
  MERKEZ:             { role: "GENEL_MERKEZ",                 sistem: "EGITIMCI" },
  UNIVERSITE_GENCLIK: { role: "TURKIYE_UNIVERSITE_SORUMLUSU", sistem: "UNIVERSITE" },
  LISE_GENCLIK:       { role: "TURKIYE_LISE_SORUMLUSU",       sistem: "LISE" },
};

/**
 * Yan rol kodlarından eski uyum alanları (icerikYoneticisi / teknikYetkisi / merkezGorev).
 * merkezGorev tek değerdir → öncelik: İlköğretim > Lise > Üniversite > Sekreterya.
 * teknikYetkisi: İstişare'de teknik birimi Merkez İlköğretim ile birleşik (spec).
 */
export function yanRolCompat(yanKods: string[]): {
  icerikYoneticisi: boolean; teknikYetkisi: boolean; merkezGorev: string | null;
} {
  const has = (k: string) => yanKods.includes(k);
  const merkezGorev =
    has("MERKEZ_ILKOGRETIM") ? "ILKOGRETIM" :
    has("MERKEZ_LISE")       ? "LISE" :
    has("MERKEZ_UNI")        ? "UNIVERSITE" :
    has("SEKRETERYA")        ? "SEKRETERYA" :
    null;
  return {
    icerikYoneticisi: has("ICERIK_YONETICISI"),
    teknikYetkisi:    has("MERKEZ_ILKOGRETIM"),
    merkezGorev,
  };
}

// ── F3: Yan rol → yetenek kapıları (sidebar/guard) ──
// Form Yönetimi + İstişare'ye erişim veren yan roller (İçerik Yön. ve Gençlik Sor. hariç).
const FORM_ISTISARE_YAN: YanRolKod[] = ["TR_EGITIM", "TR_EGITIM_YRD", "MERKEZ_UNI", "MERKEZ_LISE", "MERKEZ_ILKOGRETIM", "SEKRETERYA"];

export function yanRolVar(yanRoller: string[] | undefined | null, ...kods: string[]): boolean {
  if (!yanRoller) return false;
  return kods.some(k => yanRoller.includes(k));
}
export function formYonetimiYanRol(yanRoller?: string[] | null): boolean { return yanRolVar(yanRoller, ...FORM_ISTISARE_YAN); }
export function istisareYanRol(yanRoller?: string[] | null): boolean { return yanRolVar(yanRoller, ...FORM_ISTISARE_YAN); }
export function icerikYanRol(yanRoller?: string[] | null): boolean { return yanRolVar(yanRoller, "ICERIK_YONETICISI"); }
export function barinmaGorunumYanRol(yanRoller?: string[] | null): boolean { return yanRolVar(yanRoller, "MERKEZ_UNI", "MERKEZ_UNI_GENCLIK", "TR_EGITIM", "TR_EGITIM_YRD"); }
export function ilFaaliyetTakipYanRol(yanRoller?: string[] | null): boolean { return yanRolVar(yanRoller, "MERKEZ_UNI", "MERKEZ_UNI_GENCLIK", "MERKEZ_LISE_GENCLIK", "MERKEZ_LISE", "TR_EGITIM", "TR_EGITIM_YRD"); }
export function liseHaritaYanRol(yanRoller?: string[] | null): boolean { return yanRolVar(yanRoller, "MERKEZ_LISE", "MERKEZ_LISE_GENCLIK", "TR_EGITIM", "TR_EGITIM_YRD"); }

/** Sistem-kısıtlı sorumlunun bağlı olduğu sistem (UNIVERSITE/LISE); değilse null (tam erişim). */
export function rolSistemi(role: string): "UNIVERSITE" | "LISE" | null {
  if (role === "TURKIYE_UNIVERSITE_SORUMLUSU") return "UNIVERSITE";
  if (role === "TURKIYE_LISE_SORUMLUSU") return "LISE";
  return null;
}

/** Sistem sorumlusunun kendi sisteminde yönetebileceği saha rolleri (başvuran/il/bölge). */
export const SAHA_ROLLERI: Role[] = ["IL_SORUMLUSU", "BOLGE_SORUMLUSU", "BEKLEYEN"];

/**
 * Sistem sorumlusunun, hedef kullanıcıyı kendi sistemi kapsamında yönetip
 * yönetemeyeceği (onaylama / yetki alma / şifre atama). Yalnızca kendi sistemindeki
 * saha (il/bölge/bekleyen) kullanıcıları için geçerlidir.
 */
export function sistemKapsamindaYonetebilir(
  actorRole: string,
  actorSistem: string | null | undefined,
  hedefRole: string,
  hedefSistem: string | null | undefined,
): boolean {
  if (!sistemSorumlusu(actorRole)) return false;
  if (!actorSistem || actorSistem !== hedefSistem) return false;
  return SAHA_ROLLERI.includes(hedefRole as Role);
}

// Yönetici panelinden giriş yapan roller
export const YONETICI_ROLLERI: Role[] = [
  "SISTEM_ADMIN",
  "GENEL_MERKEZ",
  "TURKIYE_EGITIM_SORUMLUSU",
  "TURKIYE_UNIVERSITE_SORUMLUSU",
  "TURKIYE_LISE_SORUMLUSU",
];

// Tüm Türkiye sorumlusu rolleri (başvuru/yönetici listesi için)
export const TURKIYE_ROLLERI: Role[] = [
  "TURKIYE_EGITIM_SORUMLUSU",
  "TURKIYE_UNIVERSITE_SORUMLUSU",
  "TURKIYE_LISE_SORUMLUSU",
];

// Sistem bazlı kısıtlı roller (yalnızca kendi sistemi görür)
export const SISTEM_KISITLI_ROLLERI: Role[] = [
  "TURKIYE_UNIVERSITE_SORUMLUSU",
  "TURKIYE_LISE_SORUMLUSU",
];

// Tam erişimli roller (admin gibi tüm sistemi görür)
export const SUPER_ADMIN_ROLLERI: Role[] = [
  "SISTEM_ADMIN",
  "GENEL_MERKEZ",
  "TURKIYE_EGITIM_SORUMLUSU",
];

export const ADMIN_ROLES: Role[] = ["SISTEM_ADMIN", "GENEL_MERKEZ"];
export const VIEWER_ROLES: Role[] = [
  "SISTEM_ADMIN",
  "GENEL_MERKEZ",
  "TURKIYE_EGITIM_SORUMLUSU",
  "TURKIYE_UNIVERSITE_SORUMLUSU",
  "TURKIYE_LISE_SORUMLUSU",
  "BOLGE_SORUMLUSU",
  "IL_SORUMLUSU",
];
