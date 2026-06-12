import "server-only";
import { YONETICI_ROLLERI } from "./constants";
import type { Role } from "./constants";

export type ErisimAlani = "erisimEgitim" | "erisimUniversite" | "erisimLise";

/** Doküman yönetebilir mi (yükle/sil/taşı/paylaş)? Yalnızca yönetici rolleri. */
export function canManageDocs(role: string): boolean {
  return YONETICI_ROLLERI.includes(role as Role);
}

/**
 * Panel kullanıcısının görebileceği erişim bayrağı.
 * Yönetici → null (her şeyi görür); bölge/il sorumlusu → sistemine göre bayrak.
 */
export function erisimAlani(user: { role: string; sistem?: string | null }): ErisimAlani | null | "YOK" {
  if (canManageDocs(user.role)) return null;
  if (user.role === "BOLGE_SORUMLUSU" || user.role === "IL_SORUMLUSU") {
    if (user.sistem === "UNIVERSITE") return "erisimUniversite";
    if (user.sistem === "LISE") return "erisimLise";
    return "erisimEgitim";
  }
  return "YOK";
}
