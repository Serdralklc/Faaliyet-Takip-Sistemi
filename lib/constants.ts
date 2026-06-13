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
