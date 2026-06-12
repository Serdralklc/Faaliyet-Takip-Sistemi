export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BolgelerClient, type SistemKey, type SistemDurum } from "./BolgelerClient";
import type { Donem, Sistem } from "@/app/generated/prisma/client";

const DONEMLER: Donem[] = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

// Birim alan grupları — bir birim "girildi" sayılır ⇔ alanlardan en az biri > 0
const IK_ALANLAR = [
  "ik_toplamDergah", "ik_kursuYapilanDergah", "ik_egitmenSayisi",
  "ik_egitmenYardimciSayisi", "ik_elifBaOgrenci", "ik_kuranOgrenci", "ik_gecisOgrenci",
] as const;
const LS_ALANLAR = [
  "ls_toplamDergah", "ls_liseliOgrenciSayisi", "ls_yeniIntisap",
  "ls_ilimSohbetDergah", "ls_mezunOgrenci",
  "ls_ilimSohbetSayisi", "ls_ilimSohbetKatilim",
  "ls_sosyalSayisi", "ls_sosyalKatilim",
  "ls_sorumlulukSayisi", "ls_sorumlulukKatilim",
  "ls_muhabbetSayisi", "ls_muhabbetKatilim",
  "ls_namazSayisi", "ls_namazKatilim",
  "ls_kafileSayisi", "ls_kafileOgrenci",
] as const;
const UNI_ALANLAR = [
  "uni_toplamDergah", "uni_universiteliOgrenciSayisi", "uni_yeniIntisap",
  "uni_kafileSayisi", "uni_kafileOgrenci", "uni_kykBulusmaSayisi", "uni_kykKatilim",
  "uni_ilimSohbetDergah", "uni_sonSinifOgrenci", "uni_aktifKulup",
  "uni_ilimSohbetSayisi", "uni_ilimSohbetKatilim",
  "uni_kulupSayisi", "uni_kulupKatilim",
  "uni_sosyalSayisi", "uni_sosyalKatilim",
  "uni_sorumlulukSayisi", "uni_sorumlulukKatilim",
  "uni_muhabbetSayisi", "uni_muhabbetKatilim",
  "uni_namazSayisi", "uni_namazKatilim",
] as const;

// Sistem kısıtlı roller yalnızca kendi sistem sekmesini görür
const ROL_SISTEM: Record<string, SistemKey> = {
  TURKIYE_UNIVERSITE_SORUMLUSU: "UNIVERSITE",
  TURKIYE_LISE_SORUMLUSU:       "LISE",
};

export default async function BolgelerPage({
  searchParams,
}: {
  searchParams: Promise<{ yil?: string; donem?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");

  const { role } = session.user;
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(role)) redirect("/");

  const kilitliSistem: SistemKey | null = ROL_SISTEM[role] ?? null;

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

  const [bolgeler, activities, liseSayim] = await Promise.all([
    prisma.bolge.findMany({
      orderBy: { no: "asc" },
      select: {
        id: true, no: true, ad: true,
        iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } },
      },
    }),
    // Seçili yıl+dönem için tüm kayıtlar — birim alanları + ilId + kaydı oluşturan sistem
    prisma.activity.findMany({
      where: { yil, donem },
      select: {
        ilId: true,
        createdBy: { select: { sistem: true } },
        ik_toplamDergah: true, ik_kursuYapilanDergah: true, ik_egitmenSayisi: true,
        ik_egitmenYardimciSayisi: true, ik_elifBaOgrenci: true, ik_kuranOgrenci: true,
        ik_gecisOgrenci: true,
        ls_toplamDergah: true, ls_liseliOgrenciSayisi: true, ls_yeniIntisap: true,
        ls_ilimSohbetDergah: true, ls_mezunOgrenci: true,
        ls_ilimSohbetSayisi: true, ls_ilimSohbetKatilim: true,
        ls_sosyalSayisi: true, ls_sosyalKatilim: true,
        ls_sorumlulukSayisi: true, ls_sorumlulukKatilim: true,
        ls_muhabbetSayisi: true, ls_muhabbetKatilim: true,
        ls_namazSayisi: true, ls_namazKatilim: true,
        ls_kafileSayisi: true, ls_kafileOgrenci: true,
        uni_toplamDergah: true, uni_universiteliOgrenciSayisi: true, uni_yeniIntisap: true,
        uni_kafileSayisi: true, uni_kafileOgrenci: true, uni_kykBulusmaSayisi: true, uni_kykKatilim: true,
        uni_ilimSohbetDergah: true, uni_sonSinifOgrenci: true, uni_aktifKulup: true,
        uni_ilimSohbetSayisi: true, uni_ilimSohbetKatilim: true,
        uni_kulupSayisi: true, uni_kulupKatilim: true,
        uni_sosyalSayisi: true, uni_sosyalKatilim: true,
        uni_sorumlulukSayisi: true, uni_sorumlulukKatilim: true,
        uni_muhabbetSayisi: true, uni_muhabbetKatilim: true,
        uni_namazSayisi: true, uni_namazKatilim: true,
      },
    }),
    // Lise Gençlik: faaliyet-bazlı kayıt sayısı (il başına)
    prisma.liseFaaliyet.groupBy({ by: ["ilId"], where: { yil, donem }, _count: { _all: true } }),
  ]);

  const liseCount = new Map(liseSayim.map(r => [r.ilId, r._count._all]));

  type AktiviteSatiri = (typeof activities)[number];
  const dolu = (a: AktiviteSatiri, alanlar: readonly (keyof AktiviteSatiri)[]) =>
    alanlar.some(f => {
      const v = a[f];
      return typeof v === "number" && v > 0;
    });

  /**
   * Her il için 3 sistemin durumu (createdBy.sistem ile ayrılır):
   * - EGITIMCI: il eğitimcisinin doldurduğu 3 birim (ilköğretim/lise/üniversite)
   * - UNIVERSITE: üniversite gençlik sisteminin verisi girildi mi
   * - LISE: lise gençlik sisteminin verisi girildi mi
   * (Activity il+yıl+dönem'de unique olduğundan il başına tek sisteme veri düşer.)
   */
  const sistemDurum: Record<string, SistemDurum> = {};
  for (const a of activities) {
    const sistem = a.createdBy?.sistem as Sistem | undefined;
    const e = sistemDurum[a.ilId] ?? { EGITIMCI: null, UNIVERSITE: null, LISE: null };
    if (sistem === "EGITIMCI") {
      e.EGITIMCI = {
        ILKOGRETIM: dolu(a, IK_ALANLAR),
        LISE:       dolu(a, LS_ALANLAR),
        UNIVERSITE: dolu(a, UNI_ALANLAR),
      };
    } else if (sistem === "UNIVERSITE") {
      e.UNIVERSITE = dolu(a, UNI_ALANLAR);
    }
    sistemDurum[a.ilId] = e;
  }

  // Lise Gençlik durumu = girilen faaliyet sayısı (LiseFaaliyet'ten)
  for (const [ilId, count] of liseCount) {
    const e = sistemDurum[ilId] ?? { EGITIMCI: null, UNIVERSITE: null, LISE: null };
    e.LISE = count;
    sistemDurum[ilId] = e;
  }

  return (
    <BolgelerClient
      bolgeler={bolgeler}
      sistemDurum={sistemDurum}
      yil={yil}
      donem={donem}
      yillar={yillar}
      kilitliSistem={kilitliSistem}
    />
  );
}
