/**
 * Mevcut Volunteer.telefon değerlerini normalize eder (tek seferlik migration).
 *
 * ÇALIŞTIRMADAN ÖNCE: Bu script PRODUCTION veritabanını günceller.
 * Önce --dry-run ile ne değişeceğini görün:
 *
 *   npx tsx scripts/normalize-phones.ts --dry-run
 *   npx tsx scripts/normalize-phones.ts          (gerçek güncelleme)
 *
 * Çakışma durumunda (normalize edilmiş numara başka kayıtta zaten varsa)
 * o kayıt ATLANIR ve raporlanır — elle birleştirme gerekir.
 */

import { prisma } from "../lib/prisma";
import { normalizePhone } from "../lib/validation";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const volunteers = await prisma.volunteer.findMany({
    select: { id: true, adSoyad: true, telefon: true },
  });

  let updated = 0;
  const conflicts: string[] = [];
  const unchanged: number[] = [];

  for (const v of volunteers) {
    const normalized = normalizePhone(v.telefon);
    if (normalized === v.telefon) {
      unchanged.push(1);
      continue;
    }

    const existing = await prisma.volunteer.findUnique({ where: { telefon: normalized } });
    if (existing && existing.id !== v.id) {
      conflicts.push(`ÇAKIŞMA: ${v.adSoyad} (${v.telefon} → ${normalized}) — bu numara zaten ${existing.id} kaydında`);
      continue;
    }

    console.log(`${dryRun ? "[DRY] " : ""}${v.adSoyad}: "${v.telefon}" → "${normalized}"`);
    if (!dryRun) {
      await prisma.volunteer.update({ where: { id: v.id }, data: { telefon: normalized } });
    }
    updated++;
  }

  console.log(`\nToplam: ${volunteers.length} kayıt | Güncellenen: ${updated} | Değişmeyen: ${unchanged.length} | Çakışma: ${conflicts.length}`);
  conflicts.forEach(c => console.log(c));
}

main().finally(() => prisma.$disconnect());
