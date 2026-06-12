import "server-only";
import { prisma } from "./prisma";
import { YONETICI_ROLLERI } from "./constants";
import type { Role } from "./constants";

interface SessionUserLike {
  role: string;
  activeIlId?: string | null;
  activeBolgeId?: string | null;
}

/**
 * Kullanıcının verilen ile ait barınma verisine erişim yetkisi var mı?
 * - Yönetici rolleri (SISTEM_ADMIN, GENEL_MERKEZ, TURKIYE_*): tüm iller
 * - BOLGE_SORUMLUSU: yalnızca kendi bölgesinin illeri
 * - IL_SORUMLUSU: yalnızca kendi ili
 * - Diğer (BEKLEYEN vb.): erişim yok
 */
export async function canAccessIl(user: SessionUserLike, ilId: string | null | undefined): Promise<boolean> {
  if (!ilId) return false;
  if (YONETICI_ROLLERI.includes(user.role as Role)) return true;
  if (user.role === "IL_SORUMLUSU") return user.activeIlId === ilId;
  if (user.role === "BOLGE_SORUMLUSU") {
    if (!user.activeBolgeId) return false;
    const il = await prisma.il.findUnique({ where: { id: ilId }, select: { bolgeId: true } });
    return il?.bolgeId === user.activeBolgeId;
  }
  return false;
}

/** Barınma biriminin iline erişim kontrolü; birim yoksa null döner */
export async function canAccessHousingUnit(user: SessionUserLike, unitId: string | null | undefined): Promise<boolean | null> {
  if (!unitId) return null;
  const unit = await prisma.housingUnit.findUnique({ where: { id: unitId }, select: { ilId: true } });
  if (!unit) return null;
  return canAccessIl(user, unit.ilId);
}
