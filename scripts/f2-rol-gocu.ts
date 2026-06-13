/**
 * F2 — Rol göçü (idempotent). Katalogları (AnaRol/YanRol) doldurur ve mevcut
 * kullanıcıları yeni ana/yan rol yapısına taşır. Eski role/flag alanları
 * uyum köprüsü olarak yerinde kalır.
 *   Çalıştır:  npx tsx scripts/f2-rol-gocu.ts
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ANA = [
  { kod: "ADMIN", ad: "Admin", sira: 1 },
  { kod: "MERKEZ", ad: "Merkez", sira: 2 },
  { kod: "UNIVERSITE_GENCLIK", ad: "Üniversite Gençlik", sira: 3 },
  { kod: "LISE_GENCLIK", ad: "Lise Gençlik", sira: 4 },
];

const YAN = [
  { kod: "TR_EGITIM", ad: "Türkiye Eğitim Sorumlusu", sira: 1 },
  { kod: "TR_EGITIM_YRD", ad: "Türkiye Eğitim Sorumlu Yardımcısı", sira: 2 },
  { kod: "MERKEZ_UNI", ad: "Merkez Üniversite Sorumlusu", sira: 3 },
  { kod: "MERKEZ_LISE", ad: "Merkez Lise Sorumlusu", sira: 4 },
  { kod: "MERKEZ_ILKOGRETIM", ad: "Merkez İlköğretim Sorumlusu", sira: 5 },
  { kod: "SEKRETERYA", ad: "Sekreterya Sorumlusu", sira: 6 },
  { kod: "MERKEZ_UNI_GENCLIK", ad: "Merkez Üniversite Gençlik Sorumlusu", sira: 7 },
  { kod: "MERKEZ_LISE_GENCLIK", ad: "Merkez Lise Gençlik Sorumlusu", sira: 8 },
  { kod: "ICERIK_YONETICISI", ad: "İçerik Yöneticisi", sira: 9 },
];

async function main() {
  for (const a of ANA) await prisma.anaRol.upsert({ where: { kod: a.kod }, update: { ad: a.ad, sira: a.sira }, create: a });
  for (const y of YAN) await prisma.yanRol.upsert({ where: { kod: y.kod }, update: { ad: y.ad, sira: y.sira }, create: y });

  const anaMap = Object.fromEntries((await prisma.anaRol.findMany()).map(a => [a.kod, a.id]));
  const yanMap = Object.fromEntries((await prisma.yanRol.findMany()).map(y => [y.kod, y.id]));

  const users = await prisma.user.findMany({
    select: { id: true, role: true, merkezGorev: true, icerikYoneticisi: true, teknikYetkisi: true },
  });

  let anaCount = 0, yanCount = 0;
  for (const u of users) {
    const anaKod =
      u.role === "SISTEM_ADMIN" ? "ADMIN" :
      (u.role === "GENEL_MERKEZ" || u.role === "TURKIYE_EGITIM_SORUMLUSU" || u.role === "TEKNIK") ? "MERKEZ" :
      u.role === "TURKIYE_UNIVERSITE_SORUMLUSU" ? "UNIVERSITE_GENCLIK" :
      u.role === "TURKIYE_LISE_SORUMLUSU" ? "LISE_GENCLIK" :
      null; // BOLGE/IL/BEKLEYEN → ana rol yok (saha/bekleyen)

    if (anaKod && anaMap[anaKod]) {
      await prisma.user.update({ where: { id: u.id }, data: { anaRolId: anaMap[anaKod] } });
      anaCount++;
    }

    const kods = new Set<string>();
    if (u.icerikYoneticisi) kods.add("ICERIK_YONETICISI");
    if (u.teknikYetkisi) kods.add("MERKEZ_ILKOGRETIM");          // teknik → Merkez İlköğretim (İstişare teknik birimi)
    if (u.merkezGorev === "ILKOGRETIM") kods.add("MERKEZ_ILKOGRETIM");
    if (u.merkezGorev === "LISE") kods.add("MERKEZ_LISE");
    if (u.merkezGorev === "UNIVERSITE") kods.add("MERKEZ_UNI");
    if (u.merkezGorev === "SEKRETERYA") kods.add("SEKRETERYA");
    if (u.role === "TURKIYE_EGITIM_SORUMLUSU") kods.add("TR_EGITIM");
    if (u.role === "TEKNIK") kods.add("MERKEZ_ILKOGRETIM");
    if (u.role === "TURKIYE_UNIVERSITE_SORUMLUSU") kods.add("MERKEZ_UNI_GENCLIK");
    if (u.role === "TURKIYE_LISE_SORUMLUSU") kods.add("MERKEZ_LISE_GENCLIK");

    for (const k of kods) {
      const yanRolId = yanMap[k];
      if (!yanRolId) continue;
      await prisma.userYanRol.upsert({
        where: { userId_yanRolId: { userId: u.id, yanRolId } },
        update: {},
        create: { userId: u.id, yanRolId },
      });
      yanCount++;
    }
  }

  console.log(`✔ Katalog: ${ANA.length} ana rol, ${YAN.length} yan rol`);
  console.log(`✔ Kullanıcı: ${users.length} · ana rol atanan: ${anaCount} · yan rol satırı: ${yanCount}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
