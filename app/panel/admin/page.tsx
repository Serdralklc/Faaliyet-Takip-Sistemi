export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rolEtiket } from "@/lib/constants";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { IcerikDashboard } from "./IcerikDashboard";

const YONETICI_ROLLERI = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];

const YON_ROL_LABEL: Record<string, string> = {
  SISTEM_ADMIN:                 "Sistem Admini",
  GENEL_MERKEZ:                 "Merkez Ekibi",
  TURKIYE_EGITIM_SORUMLUSU:     "TR Eğitim Sorumlusu",
  TURKIYE_UNIVERSITE_SORUMLUSU: "TR Üniversite Gençlik Sorumlusu",
  TURKIYE_LISE_SORUMLUSU:       "TR Lise Gençlik Sorumlusu",
};

/**
 * Sistem kartlarına göre üye özeti: her sistemde onaylı (status AKTIF) üye sayısı
 * + son 15 dakikada aktif olanlar (anlık aktif) + rol kırılımı.
 * SerGenç gönüllüde aktiflik takibi yok → online null.
 */
async function getUyeOzet() {
  const esik = new Date(Date.now() - 15 * 60 * 1000);
  const [users, volToplam] = await Promise.all([
    prisma.user.findMany({ where: { status: "AKTIF" }, select: { role: true, sistem: true, sonAktif: true } }),
    prisma.volunteer.count(),
  ]);

  const cevrimici = (u: { sonAktif: Date | null }) => !!u.sonAktif && u.sonAktif >= esik;

  const yon = users.filter(u => YONETICI_ROLLERI.includes(u.role));
  const yonRoller = Object.keys(YON_ROL_LABEL)
    .map(r => ({ label: YON_ROL_LABEL[r], toplam: yon.filter(u => u.role === r).length }))
    .filter(x => x.toplam > 0);

  const sistemOzet = (sistem: string) => {
    const list = users.filter(u => u.sistem === sistem && (u.role === "IL_SORUMLUSU" || u.role === "BOLGE_SORUMLUSU"));
    return {
      toplam: list.length,
      online: list.filter(cevrimici).length,
      roller: [
        { label: rolEtiket("IL_SORUMLUSU", sistem),    toplam: list.filter(u => u.role === "IL_SORUMLUSU").length },
        { label: rolEtiket("BOLGE_SORUMLUSU", sistem), toplam: list.filter(u => u.role === "BOLGE_SORUMLUSU").length },
      ].filter(x => x.toplam > 0),
    };
  };

  return [
    { key: "yonetim",    label: "Yönetim Merkezi",   renk: "#92400E", toplam: yon.length, online: yon.filter(cevrimici).length, roller: yonRoller },
    { key: "egitim",     label: "Eğitim Birimi",     renk: "#0B6B3A", ...sistemOzet("EGITIMCI") },
    { key: "universite", label: "Üniversite Gençlik", renk: "#1D4ED8", ...sistemOzet("UNIVERSITE") },
    { key: "lise",       label: "Lise Gençlik",       renk: "#7C3AED", ...sistemOzet("LISE") },
    { key: "sergenc",    label: "SerGenç Gönüllü",    renk: "#B45309", toplam: volToplam, online: null as number | null, roller: [] as { label: string; toplam: number }[] },
  ];
}

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

  // Merkez Ekip + İçerik Yöneticisi: içerik görünümünde içerik hub'ı göster
  if (session.user.role === "GENEL_MERKEZ" && session.user.icerikYoneticisi) {
    const ck = await cookies();
    if (ck.get("panel-gorunum")?.value === "icerik") {
      return <IcerikDashboard ad={session.user.ad} />;
    }
  }

  const [stats, uyeOzet] = await Promise.all([
    getStats(session.user.role, session.user.sistem),
    getUyeOzet(),
  ]);
  return <AdminDashboardClient stats={stats} uyeOzet={uyeOzet} />;
}
