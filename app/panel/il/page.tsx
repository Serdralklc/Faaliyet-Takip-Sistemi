export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, School, GraduationCap, Home, Building2, Hotel, TrendingUp, Users, Plus } from "lucide-react";

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string; icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
  href?: string;
}) {
  const colors = {
    blue:   { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-700 dark:text-blue-300",   icon: "bg-blue-100 dark:bg-blue-900/50",   val: "text-blue-800 dark:text-blue-200" },
    green:  { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-300", icon: "bg-green-100 dark:bg-green-900/50", val: "text-green-800 dark:text-green-200" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/30",text:"text-purple-700",icon:"bg-purple-100",val:"text-purple-800" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/30",text:"text-orange-700",icon:"bg-orange-100",val:"text-orange-800" },
    red:    { bg: "bg-red-50 dark:bg-red-950/30",     text: "text-red-700",    icon: "bg-red-100",    val: "text-red-800" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/30",text:"text-indigo-700",icon:"bg-indigo-100",val:"text-indigo-800" },
  };
  const c = colors[color];
  const inner = (
    <div className={`rounded-xl p-4 border flex items-center gap-4 transition hover:shadow-md cursor-pointer ${c.bg}`}
      style={{ borderColor: "var(--border)" }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        <Icon size={22} className={c.text} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.val}`}>{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function IlDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  if (session.user.role !== "IL_SORUMLUSU") redirect("/");

  const ilId = session.user.activeIlId;
  if (!ilId) redirect("/panel/beklemede");

  const il = await prisma.il.findUnique({
    where: { id: ilId },
    include: { bolge: true },
  });

  const faaliyetler = await prisma.activity.findMany({
    where: { ilId },
    orderBy: [{ yil: "desc" }, { donem: "asc" }],
  });

  const son = faaliyetler[0];
  const donemLabel: Record<string, string> = {
    DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
  };

  const stats = son ? {
    ik_dergah: son.ik_toplamDergah,
    ls_dergah: son.ls_toplamDergah,
    uni_dergah: son.uni_toplamDergah,
    ev: son.eay_mevcutEv,
    apart: son.eay_mevcutApart,
    yurt: son.eay_mevcutYurt,
    yeniIntisap: (son.ls_yeniIntisap ?? 0) + (son.uni_yeniIntisap ?? 0),
  } : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{il?.ad}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{il?.bolge.ad} · İl Sorumlusu Paneli</p>
        </div>
        <Link href="/panel/il/faaliyet/ilkogretim"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition">
          <Plus size={16} />Faaliyet Gir
        </Link>
      </div>

      {/* Son dönem bilgisi */}
      {son ? (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-3 border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <TrendingUp size={18} className="text-blue-500 flex-shrink-0" />
          <div>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Son kayıt: {son.yil} — {donemLabel[son.donem]}
            </span>
            <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
              {son.createdByName} tarafından {new Date(son.createdAt).toLocaleDateString("tr-TR")} tarihinde girildi
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-5 mb-6 border-2 border-dashed text-center"
          style={{ borderColor: "var(--border)" }}>
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>Henüz faaliyet kaydı yok</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>İlk kaydınızı oluşturmak için faaliyet girişi yapın</p>
          <Link href="/panel/il/faaliyet/ilkogretim"
            className="inline-block mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            Faaliyet Gir
          </Link>
        </div>
      )}

      {/* Faaliyet istatistikleri */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
          {son ? `${son.yil} / ${donemLabel[son.donem]} Özeti` : "Faaliyet İstatistikleri"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="İlköğretim Dergah" value={stats?.ik_dergah ?? 0} icon={BookOpen} color="blue" href="/panel/il/faaliyet/ilkogretim" />
          <StatCard label="Lise Dergah" value={stats?.ls_dergah ?? 0} icon={School} color="green" href="/panel/il/faaliyet/lise" />
          <StatCard label="Üniversite Dergah" value={stats?.uni_dergah ?? 0} icon={GraduationCap} color="purple" href="/panel/il/faaliyet/universite" />
          <StatCard label="Yeni İntisap" value={stats?.yeniIntisap ?? 0} icon={Users} color="indigo" />
        </div>
      </div>

      {/* Barınma istatistikleri */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Barınma Durumu</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Aktif Ev" value={stats?.ev ?? 0} icon={Home} color="orange" href="/panel/il/barinma/evler" />
          <StatCard label="Aktif Apart" value={stats?.apart ?? 0} icon={Building2} color="red" href="/panel/il/barinma/apartlar" />
          <StatCard label="Aktif Yurt" value={stats?.yurt ?? 0} icon={Hotel} color="green" href="/panel/il/barinma/yurtlar" />
        </div>
      </div>

      {/* Geçmiş kayıtlar */}
      {faaliyetler.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Geçmiş Kayıtlar</h2>
            <Link href="/panel/il/raporlar" className="text-xs text-blue-500 hover:underline font-semibold">Tümünü Gör →</Link>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--bg-th)" }}>
                <tr>
                  {["Yıl", "Dönem", "İK Dergah", "Lise Dergah", "Üni Dergah", "Kayıt Eden"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {faaliyetler.slice(0, 5).map((f) => (
                  <tr key={f.id} className="border-t hover:bg-[color:var(--bg-hover)] transition" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-bold" style={{ color: "var(--text-primary)" }}>{f.yil}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{donemLabel[f.donem]}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{f.ik_toplamDergah}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{f.ls_toplamDergah}</td>
                    <td className="px-4 py-3 font-semibold text-purple-600">{f.uni_toplamDergah}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{f.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
