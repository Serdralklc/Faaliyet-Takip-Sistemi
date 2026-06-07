export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminDashboardClient";
import type { Sistem } from "@/app/generated/prisma/client";

async function getStats(sistem: Sistem) {
  const thisYear = new Date().getFullYear();

  const [
    aktifKullanici,
    bekleyenler,
    toplamIl,
    toplamFaaliyet,
    aktifBolge,
    yeniIntisapAgg,
    aktifEvAgg,
    aktifApartAgg,
    aktifYurtAgg,
    bolgeStats,
    sonLogs,
    sonBasvurular,
  ] = await Promise.all([
    // Sadece bu sisteme ait aktif kullanıcılar
    prisma.user.count({ where: { status: "AKTIF", sistem } }),

    // Sadece bu sisteme ait bekleyen başvurular
    prisma.user.count({ where: { status: "BEKLEMEDE", sistem } }),

    // İl sayısı sistemden bağımsız (coğrafi yapı aynı)
    prisma.il.count(),

    // Bu sisteme kayıtlı kullanıcıların oluşturduğu faaliyetler
    prisma.activity.count({
      where: { yil: thisYear, createdBy: { sistem } },
    }),

    prisma.bolge.count(),

    // Yeni intisap — bu sisteme ait faaliyetler
    prisma.activity.aggregate({
      where: { yil: thisYear, createdBy: { sistem } },
      _sum: { ls_yeniIntisap: true, uni_yeniIntisap: true },
    }),

    // Barınma verileri — bu sisteme ait faaliyetler
    prisma.activity.aggregate({
      where: { createdBy: { sistem } },
      _sum: { eay_mevcutEv: true },
    }),
    prisma.activity.aggregate({
      where: { createdBy: { sistem } },
      _sum: { eay_mevcutApart: true },
    }),
    prisma.activity.aggregate({
      where: { createdBy: { sistem } },
      _sum: { eay_mevcutYurt: true },
    }),

    // Bölge bazlı faaliyet — bu sisteme ait
    prisma.bolge.findMany({
      take: 10,
      orderBy: { no: "asc" },
      include: {
        iller: {
          include: {
            activities: {
              where: { yil: thisYear, createdBy: { sistem } },
              take: 1,
            },
          },
        },
      },
    }),

    // Son denetim logları — bu sisteme ait kullanıcıların logları
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: { user: { sistem } },
      include: { user: { select: { ad: true, soyad: true } } },
    }),

    // Bekleyen başvurular — bu sisteme ait
    prisma.user.findMany({
      where: { status: "BEKLEMEDE", sistem },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, ad: true, soyad: true, email: true, createdAt: true },
    }),
  ]);

  const yeniIntisap =
    (yeniIntisapAgg._sum.ls_yeniIntisap ?? 0) +
    (yeniIntisapAgg._sum.uni_yeniIntisap ?? 0);

  const bolgeChartData = bolgeStats.map(b => ({
    name:   `${b.no}. Bölge`,
    veri:   b.iller.filter(i => i.activities.length > 0).length,
    toplam: b.iller.length,
  }));

  return {
    aktifKullanici,
    bekleyenler,
    toplamIl,
    toplamFaaliyet,
    aktifBolge,
    yeniIntisap,
    aktifEv:    aktifEvAgg._sum.eay_mevcutEv       ?? 0,
    aktifApart: aktifApartAgg._sum.eay_mevcutApart  ?? 0,
    aktifYurt:  aktifYurtAgg._sum.eay_mevcutYurt    ?? 0,
    bolgeChartData,
    sonLogs: sonLogs.map(l => ({
      id:          l.id,
      action:      l.action,
      description: l.description,
      createdAt:   l.createdAt.toISOString(),
      userName:    l.user ? `${l.user.ad} ${l.user.soyad}` : "—",
    })),
    sonBasvurular: sonBasvurular.map(u => ({
      id:        u.id,
      ad:        u.ad,
      soyad:     u.soyad,
      email:     u.email,
      createdAt: u.createdAt.toISOString(),
    })),
    sistem, // dashboard başlığında göstermek için
  };
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) {
    redirect("/panel/beklemede");
  }

  const sistem = (session.user.sistem ?? "EGITIMCI") as Sistem;
  const stats  = await getStats(sistem);

  return <AdminDashboardClient stats={stats} />;
}
