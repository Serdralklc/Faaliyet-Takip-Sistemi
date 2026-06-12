export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BolgelerClient, type Kategori, type KategoriDurum } from "./BolgelerClient";
import type { Donem, Sistem } from "@/app/generated/prisma/client";

const DONEMLER: Donem[] = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

// Kategori alan grupları — bir kategori "girildi" sayılır ⇔ alanlardan en az biri > 0
const IK_ALANLAR = [
  "ik_toplamDergah", "ik_kursuYapilanDergah", "ik_egitmenSayisi",
  "ik_egitmenYardimciSayisi", "ik_elifBaOgrenci", "ik_kuranOgrenci", "ik_gecisOgrenci",
] as const;
const LS_ALANLAR = [
  "ls_toplamDergah", "ls_ilimDersYeri", "ls_ilimDersKatilim",
  "ls_sabahNamaziSayisi", "ls_sabahNamaziKatilim", "ls_kafileSayisi",
  "ls_kafileOgrenci", "ls_toplamFaaliyet", "ls_yeniIntisap",
] as const;
const UNI_ALANLAR = [
  "uni_toplamDergah", "uni_ilimDersYeri", "uni_ilimDersKatilim",
  "uni_sabahNamaziSayisi", "uni_sabahNamaziKatilim", "uni_kafileSayisi",
  "uni_kafileOgrenci", "uni_toplamFaaliyet", "uni_kykBulusmaSayisi",
  "uni_kykKatilim", "uni_yeniIntisap",
] as const;
const ORTAK_ALANLAR = [
  "ortakKafileSayisi", "ortakKafileLiseKatilim", "ortakKafileUniKatilim",
  "ortakSabahNamaziSayisi", "ortakSabahNamaziLiseKatilim", "ortakSabahNamaziUniKatilim",
] as const;

// Sistem kısıtlı roller eski davranıştaki gibi yalnızca kendi kategorisini görür
const SISTEM_KATEGORI: Record<Sistem, Kategori> = {
  EGITIMCI:   "ILKOGRETIM",
  LISE:       "LISE",
  UNIVERSITE: "UNIVERSITE",
};

export default async function BolgelerPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; donem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const { role, sistem: userSistem } = session.user;
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(role)) redirect("/");

  const SISTEM_KISITLI = ["TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  const kilitliKategori: Kategori | null =
    SISTEM_KISITLI.includes(role) && userSistem ? SISTEM_KATEGORI[userSistem as Sistem] : null;

  const sp = await searchParams;

  // Mevcut yıllar (distinct) — varsayılan: en güncel Activity yılı, hiç kayıt yoksa içinde bulunulan yıl
  const yilKayitlari = await prisma.activity.findMany({
    distinct: ["yil"],
    select: { yil: true },
    orderBy: { yil: "desc" },
  });
  const yillar = yilKayitlari.map(k => k.yil);

  const parsedYil = Number(sp.yil);
  const yil = Number.isInteger(parsedYil) && parsedYil > 0
    ? parsedYil
    : (yillar[0] ?? new Date().getFullYear());
  const donem: Donem = DONEMLER.includes(sp.donem as Donem) ? (sp.donem as Donem) : "DONEM_1";

  const [bolgeler, activities] = await Promise.all([
    prisma.bolge.findMany({
      orderBy: { no: "asc" },
      select: {
        id: true, no: true, ad: true,
        iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } },
      },
    }),
    // Seçili yıl+dönem için tüm kayıtlar — yalnızca kategori alanları + ilId
    prisma.activity.findMany({
      where: { yil, donem },
      select: {
        ilId: true,
        // İlköğretim
        ik_toplamDergah: true, ik_kursuYapilanDergah: true, ik_egitmenSayisi: true,
        ik_egitmenYardimciSayisi: true, ik_elifBaOgrenci: true, ik_kuranOgrenci: true,
        ik_gecisOgrenci: true,
        // Lise
        ls_toplamDergah: true, ls_ilimDersYeri: true, ls_ilimDersKatilim: true,
        ls_sabahNamaziSayisi: true, ls_sabahNamaziKatilim: true, ls_kafileSayisi: true,
        ls_kafileOgrenci: true, ls_toplamFaaliyet: true, ls_yeniIntisap: true,
        // Üniversite
        uni_toplamDergah: true, uni_ilimDersYeri: true, uni_ilimDersKatilim: true,
        uni_sabahNamaziSayisi: true, uni_sabahNamaziKatilim: true, uni_kafileSayisi: true,
        uni_kafileOgrenci: true, uni_toplamFaaliyet: true, uni_kykBulusmaSayisi: true,
        uni_kykKatilim: true, uni_yeniIntisap: true,
        // Ortak
        ortakKafileSayisi: true, ortakKafileLiseKatilim: true, ortakKafileUniKatilim: true,
        ortakSabahNamaziSayisi: true, ortakSabahNamaziLiseKatilim: true, ortakSabahNamaziUniKatilim: true,
      },
    }),
  ]);

  // İl bazında kategori durumları — kayıt yoksa 4 kategori de eksik (✗)
  type AktiviteSatiri = (typeof activities)[number];
  const dolu = (a: AktiviteSatiri, alanlar: readonly (keyof AktiviteSatiri)[]) =>
    alanlar.some(f => {
      const v = a[f];
      return typeof v === "number" && v > 0;
    });

  const kategoriDurum: Record<string, KategoriDurum> = {};
  for (const a of activities) {
    kategoriDurum[a.ilId] = {
      ILKOGRETIM: dolu(a, IK_ALANLAR),
      LISE:       dolu(a, LS_ALANLAR),
      UNIVERSITE: dolu(a, UNI_ALANLAR),
      ORTAK:      dolu(a, ORTAK_ALANLAR),
    };
  }

  return (
    <BolgelerClient
      bolgeler={bolgeler}
      kategoriDurum={kategoriDurum}
      yil={yil}
      donem={donem}
      yillar={yillar}
      kilitliKategori={kilitliKategori}
    />
  );
}
