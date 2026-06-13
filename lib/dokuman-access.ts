import "server-only";

export type ErisimAlani = "erisimEgitim" | "erisimUniversite" | "erisimLise";

interface DocUser { role: string; sistem?: string | null; icerikYoneticisi?: boolean | null }
interface ErisimFlags { erisimEgitim?: boolean; erisimUniversite?: boolean; erisimLise?: boolean }

/**
 * Doküman YÖNETEBİLİR mi (yükle / sil / taşı / klasör / erişim ayarı / yeni sürüm)?
 * Spec: yalnızca Sistem Admini + İçerik Yöneticisi. Diğer roller (gençlik sorumluları,
 * merkez ekip vb.) yönetemez; yalnızca kendilerine açılan dosyaları görüntüler/indirir/paylaşır.
 */
export function canManageDocs(user: DocUser): boolean {
  return user.role === "SISTEM_ADMIN" || !!user.icerikYoneticisi;
}

/**
 * Panel kullanıcısının görebileceği erişim bayrağı.
 * Yönetici (admin/İçerik Yön.) → null (her şeyi görür); bekleyen → "YOK";
 * diğer aktif roller → sistemine göre bayrak (her ana/yan rol kendi sisteminin dosyalarını görür).
 */
export function erisimAlani(user: DocUser): ErisimAlani | null | "YOK" {
  if (canManageDocs(user)) return null;
  if (user.role === "BEKLEYEN") return "YOK";
  if (user.sistem === "UNIVERSITE") return "erisimUniversite";
  if (user.sistem === "LISE") return "erisimLise";
  return "erisimEgitim";
}

/** Bu kullanıcı, verilen erişim bayraklı dosya/klasörü görüntüleyebilir/indirebilir/paylaşabilir mi? */
export function dokumanaErisebilir(user: DocUser, flags: ErisimFlags): boolean {
  const alan = erisimAlani(user);
  if (alan === null) return true;   // yönetici → tümü
  if (alan === "YOK") return false;
  return !!flags[alan];
}
