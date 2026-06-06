import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [toplamKullanici, bekleyenler, toplamIl, toplamFaaliyet] = await Promise.all([
    prisma.user.count({ where: { status: "AKTIF" } }),
    prisma.user.count({ where: { status: "BEKLEMEDE" } }),
    prisma.il.count(),
    prisma.activity.count(),
  ]);
  return { toplamKullanici, bekleyenler, toplamIl, toplamFaaliyet };
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(session.user.role)) redirect("/panel/beklemede");

  const stats = await getStats();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-gray-500 mt-1">Türkiye geneli faaliyet özeti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Aktif Kullanıcı" value={stats.toplamKullanici} color="blue" />
        <StatCard label="Bekleyen Başvuru" value={stats.bekleyenler} color="yellow" />
        <StatCard label="Toplam İl" value={stats.toplamIl} color="green" />
        <StatCard label="Faaliyet Kaydı" value={stats.toplamFaaliyet} color="purple" />
      </div>

      {stats.bekleyenler > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div>
            <p className="font-medium text-yellow-800">{stats.bekleyenler} bekleyen başvuru var</p>
            <a href="/panel/admin/kullanicilar?tab=bekleyenler" className="text-yellow-700 text-sm underline">
              İncele →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
