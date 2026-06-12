export type Role =
  | "SISTEM_ADMIN"
  | "GENEL_MERKEZ"
  | "TURKIYE_EGITIM_SORUMLUSU"
  | "TURKIYE_UNIVERSITE_SORUMLUSU"
  | "TURKIYE_LISE_SORUMLUSU"
  | "BOLGE_SORUMLUSU"
  | "IL_SORUMLUSU"
  | "BEKLEYEN";

export const ROLE_LABELS: Record<Role, string> = {
  SISTEM_ADMIN:                  "Sistem Admini",
  GENEL_MERKEZ:                  "Merkez Ekibi",
  TURKIYE_EGITIM_SORUMLUSU:      "Türkiye Eğitim Sorumlusu",
  TURKIYE_UNIVERSITE_SORUMLUSU:  "Türkiye Üniversite Gençlik Sorumlusu",
  TURKIYE_LISE_SORUMLUSU:        "Türkiye Lise Gençlik Sorumlusu",
  BOLGE_SORUMLUSU:               "Bölge Eğitimcisi",
  IL_SORUMLUSU:                  "İl Eğitimcisi",
  BEKLEYEN:                      "Bekleyen",
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
