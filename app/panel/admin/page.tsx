export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminDashboardClient } from "./AdminDashboardClient";

async function getStats() {
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
    prisma.user.count({ where: { status: "AKTIF" } }),
    prisma.user.count({ where: { status: "BEKLEMEDE" } }),
    prisma.il.count(),
    prisma.activity.count({ where: { yil: thisYear } }),
    prisma.bolge.count(),
    prisma.activity.aggregate({
      where: { yil: thisYear },
      _sum: { ls_yeniIntisap: true, uni_yeniIntisap: true },
    }),
    prisma.activity.aggregate({ _sum: { eay_mevcutEv: true } }),
    prisma.activity.aggregate({ _sum: { eay_mevcutApart: true } }),
    prisma.activity.aggregate({ _sum: { eay_mevcutYurt: true } }),
    // Bölge bazlı faaliyet sayısı (son dönem)
    prisma.bolge.findMany({
      take: 10,
      orderBy: { no: "asc" },
      include: {
        iller: {
          include: {
            activities: { where: { yil: thisYear }, take: 1 },
          },
        },
      },
    }),
    // Son denetim logları
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { ad: true, soyad: true } } },
    }),
    // Bekleyen başvurular
    prisma.user.findMany({
      where: { status: "BEKLEMEDE" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, ad: true, soyad: true, email: true, createdAt: true },
    }),
  ]);

  const yeniIntisap =
    (yeniIntisapAgg._sum.ls_yeniIntisap ?? 0) +
    (yeniIntisapAgg._sum.uni_yeniIntisap ?? 0);

  // Bölge grafik verisi
  const bolgeChartData = bolgeStats.map(b => ({
    name: `${b.no}. Bölge`,
    veri: b.iller.filter(i => i.activities.length > 0).length,
    toplam: b.iller.length,
  }));

  return {
    aktifKullanici,
    bekleyenler,
    toplamIl,
    toplamFaaliyet,
    aktifBolge,
    yeniIntisap,
    aktifEv: aktifEvAgg._sum.eay_mevcutEv ?? 0,
    aktifApart: aktifApartAgg._sum.eay_mevcutApart ?? 0,
    aktifYurt: aktifYurtAgg._sum.eay_mevcutYurt ?? 0,
    bolgeChartData,
    sonLogs: sonLogs.map(l => ({
      id: l.id,
      action: l.action,
      description: l.description,
      createdAt: l.createdAt.toISOString(),
      userName: l.user ? `${l.user.ad} ${l.user.soyad}` : "—",
    })),
    sonBasvurular: sonBasvurular.map(u => ({
      id: u.id,
      ad: u.ad,
      soyad: u.soyad,
      email: u.email,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) {
    redirect("/panel/beklemede");
  }

  const stats = await getStats();

  return <AdminDashboardClient stats={stats} />;
}
