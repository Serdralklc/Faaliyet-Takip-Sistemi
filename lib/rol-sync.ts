import { prisma } from "@/lib/prisma";
import { ANA_ROL_COMPAT, yanRolCompat, type AnaRolKod } from "@/lib/constants";
import type { Role, MerkezGorev, Sistem } from "@/app/generated/prisma/client";

/**
 * F2 uyum köprüsü: kullanıcının ana rol + yan rolleri (kaynak doğruluk) okunur,
 * eski `role`/`sistem`/`merkezGorev`/`icerikYoneticisi`/`teknikYetkisi` alanları
 * bunlara göre senkronlanır. Ana/yan rol değiştiren her endpoint sonunda çağrılır.
 * (F3'te guard'lar yeni tablolara taşınınca bu köprü kaldırılacak.)
 */
export async function syncRolCompat(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      anaRol: { select: { kod: true } },
      yanRoller: { select: { yanRol: { select: { kod: true } } } },
    },
  });
  if (!u) return;

  const yanKods = u.yanRoller.map(r => r.yanRol.kod);
  const yc = yanRolCompat(yanKods);
  const ana = u.anaRol ? ANA_ROL_COMPAT[u.anaRol.kod as AnaRolKod] : null;

  // Uyum köprüsü: TR Eğitim Sorumlusu yan rolü, eski `role`'ü TURKIYE_EGITIM_SORUMLUSU'na
  // yükseltir (rol atama/süper-yetki guard'ları role'e baktığı için). F3'te yan role taşınacak.
  let role = ana?.role as Role | undefined;
  if (ana && yanKods.includes("TR_EGITIM")) role = "TURKIYE_EGITIM_SORUMLUSU";

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(ana ? { role: role as Role, sistem: ana.sistem as Sistem } : {}),
      icerikYoneticisi: yc.icerikYoneticisi,
      teknikYetkisi: yc.teknikYetkisi,
      merkezGorev: (yc.merkezGorev as MerkezGorev | null),
    },
  });
}
