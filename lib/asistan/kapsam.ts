import "server-only";
import type { Role } from "@/lib/constants";

/**
 * Asistan kapsamı — kullanıcının rolüne göre hangi faaliyet takip sistemlerini
 * sorgulayabileceğini belirler.
 *
 * - SISTEM_ADMIN, GENEL_MERKEZ, TURKIYE_EGITIM_SORUMLUSU, içerik yöneticisi → 3 sistem
 * - TURKIYE_UNIVERSITE_SORUMLUSU → yalnız Üniversite Gençlik
 * - TURKIYE_LISE_SORUMLUSU → yalnız Lise Gençlik
 */

export type AsistanSistem = "EGITIMCI" | "UNIVERSITE" | "LISE";

export const SISTEM_ETIKET: Record<AsistanSistem, string> = {
  EGITIMCI: "Eğitimci Kadrosu (ilköğretim / lise / üniversite / barınma birim verileri)",
  UNIVERSITE: "Üniversite Gençlik (faaliyet-bazlı kayıtlar)",
  LISE: "Lise Gençlik (faaliyet-bazlı kayıtlar)",
};

const TUM_SISTEMLER: AsistanSistem[] = ["EGITIMCI", "UNIVERSITE", "LISE"];

export function asistanSistemleri(role: Role | string, icerikYoneticisi?: boolean): AsistanSistem[] {
  if (role === "TURKIYE_UNIVERSITE_SORUMLUSU") return ["UNIVERSITE"];
  if (role === "TURKIYE_LISE_SORUMLUSU") return ["LISE"];
  if (
    role === "SISTEM_ADMIN" ||
    role === "GENEL_MERKEZ" ||
    role === "TURKIYE_EGITIM_SORUMLUSU" ||
    icerikYoneticisi
  ) {
    return [...TUM_SISTEMLER];
  }
  return [];
}
