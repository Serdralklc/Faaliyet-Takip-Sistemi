export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Genel Bakış</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>Türkiye geneli faaliyet özeti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Aktif Kullanıcı" value={stats.toplamKullanici} accent="#3b82f6" icon="👥" />
        <StatCard label="Bekleyen Başvuru" value={stats.bekleyenler} accent="#f59e0b" icon="⏳" />
        <StatCard label="Toplam İl" value={stats.toplamIl} accent="#10b981" icon="🗺️" />
        <StatCard label="Faaliyet Kaydı" value={stats.toplamFaaliyet} accent="#8b5cf6" icon="📋" />
      </div>

      {stats.bekleyenler > 0 && (
        <div className="rounded-xl border-l-4 border-yellow-400 p-4 flex items-center gap-3"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-400 text-lg">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {stats.bekleyenler} bekleyen başvuru var
            </p>
            <Link href="/panel/admin/kullanicilar?tab=bekleyenler"
              className="text-sm text-yellow-500 hover:text-yellow-400 font-medium">
              İncele →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: string }) {
  return (
    <div className="rounded-2xl border p-6 relative overflow-hidden"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      {/* Renkli sol çizgi */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p className="text-4xl font-black" style={{ color: accent }}>
            {value}
          </p>
        </div>
        <span className="text-2xl opacity-40">{icon}</span>
      </div>
    </div>
  );
}
