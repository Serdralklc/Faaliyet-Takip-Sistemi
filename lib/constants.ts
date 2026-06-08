export type Role =
  | "SISTEM_ADMIN"
  | "GENEL_MERKEZ"
  | "TURKIYE_SORUMLUSU"
  | "BOLGE_SORUMLUSU"
  | "IL_SORUMLUSU"
  | "BEKLEYEN";

export const ROLE_LABELS: Record<Role, string> = {
  SISTEM_ADMIN: "Sistem Admini",
  GENEL_MERKEZ: "Genel Merkez",
  TURKIYE_SORUMLUSU: "Türkiye Sorumlusu",
  BOLGE_SORUMLUSU: "Bölge Eğitimcisi",
  IL_SORUMLUSU: "İl Eğitimcisi",
  BEKLEYEN: "Bekleyen",
};

export const ADMIN_ROLES: Role[] = ["SISTEM_ADMIN", "GENEL_MERKEZ"];
export const VIEWER_ROLES: Role[] = [
  "SISTEM_ADMIN",
  "GENEL_MERKEZ",
  "TURKIYE_SORUMLUSU",
  "BOLGE_SORUMLUSU",
  "IL_SORUMLUSU",
];
