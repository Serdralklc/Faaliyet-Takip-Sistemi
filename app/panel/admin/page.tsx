export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminDashboardClient";

async function getStats(userRole: string, userSistem: string | null | undefined) {
  const SISTEM_KISITLI = ["TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  const isSistemKisitli = SISTEM_KISITLI.includes(userRole);
  const YONETICI_BASVURU_GOREVLER = ["TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "GENEL_MERKEZ"];

  // Sistem kısıtlı roller sadece kendi sisteminin bekleyen başvurularını görür
  const bekleyenFilter = isSistemKisitli
    ? { status: "BEKLEMEDE" as const, sistem: userSistem as never, basvuruGorev: { notIn: YONETICI_BASVURU_GOREVLER } }
    : { status: "BEKLEMEDE" as const };
  const thisYear = new Date().getFullYear();

  const [
    toplamBolge,
    toplamIl,
    aktifKullanici,
    // Barınma: HousingUnit bazlı
    evler,
    apartlar,
    yurtlar,
    evOgrenci,
    apartOgrenci,
    yurtOgrenci,
    // Bölge bazlı veri girişi (Eğitimci sistemi)
    bolgeStats,
    // Tüm veri girilen iller (3 birimde en az birer kayıt)
    tamVeriGirenIller,
    // Son sistem hareketleri (sistem bağımsız)
    sonLogs,
    // Bekleyen başvurular (tüm sistemler)
    sonBasvurular,
    toplamBekleyen,
  ] = await Promise.all([

    prisma.bolge.count(),
    prisma.il.count(),

    // Eğitimci sisteminde aktif kullanıcı sayısı
    prisma.user.count({ where: { status: "AKTIF", sistem: "EGITIMCI" } }),

    // Aktif konut sayıları
    prisma.housingUnit.count({ where: { aktif: true, tip: "EV"    } }),
    prisma.housingUnit.count({ where: { aktif: true, tip: "APART" } }),
    prisma.housingUnit.count({ where: { aktif: true, tip: "YURT"  } }),

    // Öğrenci sayıları (HousingStudent tipten bağımsız, unit tipine göre)
    prisma.housingStudent.count({ where: { housingUnit: { aktif: true, tip: "EV"    } } }),
    prisma.housingStudent.count({ where: { housingUnit: { aktif: true, tip: "APART" } } }),
    prisma.housingStudent.count({ where: { housingUnit: { aktif: true, tip: "YURT"  } } }),

    // Bölge bazlı: kaç il bu yıl veri girmiş (EGITIMCI sistemi)
    prisma.bolge.findMany({
      orderBy: { no: "asc" },
      include: {
        iller: {
          include: {
            activities: {
              where: { yil: thisYear, createdBy: { sistem: "EGITIMCI" } },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    }),

    // Tüm 3 birimi dolan iller: ls + uni + eay hepsinde veri var
    prisma.il.findMany({
      where: {
        activities: {
          some: {
            yil: thisYear,
            createdBy: { sistem: "EGITIMCI" },
            AND: [
              // Lise birimi (yeni yapı) — en az bir alan dolu
              { OR: [
                { ls_toplamDergah: { gt: 0 } }, { ls_liseliOgrenciSayisi: { gt: 0 } }, { ls_yeniIntisap: { gt: 0 } },
                { ls_ilimSohbetSayisi: { gt: 0 } }, { ls_sosyalSayisi: { gt: 0 } }, { ls_namazSayisi: { gt: 0 } }, { ls_kafileSayisi: { gt: 0 } },
              ] },
              // Üniversite birimi (yeni yapı)
              { OR: [
                { uni_toplamDergah: { gt: 0 } }, { uni_universiteliOgrenciSayisi: { gt: 0 } }, { uni_yeniIntisap: { gt: 0 } },
                { uni_ilimSohbetSayisi: { gt: 0 } }, { uni_kulupSayisi: { gt: 0 } }, { uni_sosyalSayisi: { gt: 0 } }, { uni_namazSayisi: { gt: 0 } }, { uni_kafileSayisi: { gt: 0 } }, { uni_kykBulusmaSayisi: { gt: 0 } },
              ] },
              { eay_mevcutEv: { gt: 0 } },
            ],
          },
        },
      },
      select: { id: true },
    }),

    // Son sistem hareketleri (tüm sistemler)
    prisma.auditLog.findMany({
      take: 7,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { ad: true, soyad: true } } },
    }),

    // Bekleyen başvurular (sistem kısıtlı rollere göre filtreli)
    prisma.user.findMany({
      where: bekleyenFilter,
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, ad: true, soyad: true, email: true, createdAt: true,
        sistem: true, basvuruGorev: true,
      },
    }),

    prisma.user.count({ where: bekleyenFilter }),
  ]);

  const bolgeChartData = bolgeStats.map(b => ({
    name:   `${b.no}. Bölge`,
    veri:   b.iller.filter(i => i.activities.length > 0).length,
    toplam: b.iller.length,
  }));

  return {
    toplamBolge,
    toplamIl,
    tamVeriGirenIlSayisi: tamVeriGirenIller.length,
    aktifKullanici,
    evSayisi:      evler,
    evOgrenci,
    apartSayisi:   apartlar,
    apartOgrenci,
    yurtSayisi:    yurtlar,
    yurtOgrenci,
    bolgeChartData,
    toplamBekleyen,
    sonLogs: sonLogs.map(l => ({
      id:          l.id,
      action:      l.action,
      description: l.description,
      createdAt:   l.createdAt.toISOString(),
      userName:    l.user ? `${l.user.ad} ${l.user.soyad}` : "—",
    })),
    sonBasvurular: sonBasvurular.map(u => ({
      id:           u.id,
      ad:           u.ad,
      soyad:        u.soyad,
      email:        u.email,
      createdAt:    u.createdAt.toISOString(),
      sistem:       u.sistem,
      basvuruGorev: u.basvuruGorev,
    })),
  };
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"].includes(session.user.role)) {
    redirect("/panel/beklemede");
  }

  const stats = await getStats(session.user.role, session.user.sistem);
  return <AdminDashboardClient stats={stats} />;
}
