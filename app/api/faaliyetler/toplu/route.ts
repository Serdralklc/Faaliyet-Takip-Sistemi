import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson, zYil, zPozitifSayi } from "@/lib/validation";
import { SUPER_ADMIN_ROLLERI } from "@/lib/constants";

/**
 * Excel toplu içe aktarma — Activity modelinin içe aktarılabilir
 * sayısal alan whitelist'i (45 alan). Bu liste dışındaki anahtarlar
 * sessizce atılır; audit/createdBy* gibi alanlar asla dışarıdan yazılamaz.
 */
const IMPORT_FIELDS = [
  // İlköğretim (7)
  "ik_toplamDergah",
  "ik_kursuYapilanDergah",
  "ik_egitmenSayisi",
  "ik_egitmenYardimciSayisi",
  "ik_elifBaOgrenci",
  "ik_kuranOgrenci",
  "ik_gecisOgrenci",
  // Lise (9)
  "ls_toplamDergah",
  "ls_ilimDersYeri",
  "ls_ilimDersKatilim",
  "ls_sabahNamaziSayisi",
  "ls_sabahNamaziKatilim",
  "ls_kafileSayisi",
  "ls_kafileOgrenci",
  "ls_toplamFaaliyet",
  "ls_yeniIntisap",
  // Üniversite (11)
  "uni_toplamDergah",
  "uni_ilimDersYeri",
  "uni_ilimDersKatilim",
  "uni_sabahNamaziSayisi",
  "uni_sabahNamaziKatilim",
  "uni_kafileSayisi",
  "uni_kafileOgrenci",
  "uni_toplamFaaliyet",
  "uni_kykBulusmaSayisi",
  "uni_kykKatilim",
  "uni_yeniIntisap",
  // Ortak Faaliyet (6)
  "ortakKafileSayisi",
  "ortakKafileLiseKatilim",
  "ortakKafileUniKatilim",
  "ortakSabahNamaziSayisi",
  "ortakSabahNamaziLiseKatilim",
  "ortakSabahNamaziUniKatilim",
  // Ev / Apart / Yurt (12)
  "eay_mevcutEv",
  "eay_mevcutApart",
  "eay_mevcutYurt",
  "eay_acilacakEv",
  "eay_acilacakApart",
  "eay_acilacakYurt",
  "eay_kapanacakEv",
  "eay_kapanacakApart",
  "eay_kapanacakYurt",
  "eay_bursBalan",
  "eay_iliskiKesme",
  "eay_toplamZiyaret",
] as const;

type ImportField = (typeof IMPORT_FIELDS)[number];
const IMPORT_FIELD_SET = new Set<string>(IMPORT_FIELDS);

const rowSchema = z
  .object({ il: z.string().trim().min(2, "İl adı en az 2 karakter olmalı.") })
  .catchall(zPozitifSayi);

const schema = z.object({
  yil: zYil,
  donem: z.enum(["DONEM_1", "DONEM_2", "YAZ_DONEMI"]),
  rows: z.array(rowSchema).min(1, "En az bir satır gönderin.").max(100, "En fazla 100 satır gönderilebilir."),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!SUPER_ADMIN_ROLLERI.includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const { yil, donem, rows } = r.data;

  const user = session.user;
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      assignments: {
        where: { status: "AKTIF" },
        take: 1,
        include: { bolge: true },
      },
    },
  });

  let guncellenen = 0;
  const hatalar: string[] = [];

  for (const row of rows) {
    const ilAd = row.il.trim();

    // Whitelist dışı anahtarları sessizce at, yalnızca gönderilen alanları topla
    const data: Partial<Record<ImportField, number>> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key === "il") continue;
      if (IMPORT_FIELD_SET.has(key) && typeof value === "number") {
        data[key as ImportField] = value;
      }
    }
    if (Object.keys(data).length === 0) continue; // tamamen boş satır — atla

    const ilRecord = await prisma.il.findFirst({
      where: { ad: { equals: ilAd, mode: "insensitive" } },
    });
    if (!ilRecord) {
      hatalar.push(`Bilinmeyen il: ${ilAd}`);
      continue;
    }

    try {
      await prisma.activity.upsert({
        where: { ilId_yil_donem: { ilId: ilRecord.id, yil, donem } },
        update: {
          ...data,
          updatedById: user.id,
          updatedByName: `${user.ad} ${user.soyad}`,
        },
        create: {
          ilId: ilRecord.id,
          yil,
          donem,
          ...data,
          createdById: user.id,
          createdByName: `${user.ad} ${user.soyad}`,
          createdByRole: user.role,
          createdByIlId: userRecord?.assignments[0]?.ilId ?? null,
          createdByBolgeId: userRecord?.assignments[0]?.bolgeId ?? null,
        },
      });
      guncellenen++;
    } catch {
      hatalar.push(`${ilAd}: kayıt yazılamadı`);
    }
  }

  await createAuditLog({
    userId: user.id,
    action: ACTIONS.ACTIVITY_UPDATED,
    entity: "Activity",
    description: `Excel import: ${guncellenen} il güncellendi (${yil}/${donem})`,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true, guncellenen, hatalar });
}
