"use client";

import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface Stats {
  aktifKullanici: number;
  bekleyenler: number;
  toplamIl: number;
  toplamFaaliyet: number;
  aktifBolge: number;
  yeniIntisap: number;
  aktifEv: number;
  aktifApart: number;
  aktifYurt: number;
  bolgeChartData: { name: string; veri: number; toplam: number }[];
  sonLogs: { id: string; action: string; description: string | null; createdAt: string; userName: string }[];
  sonBasvurular: { id: string; ad: string; soyad: string; email: string; createdAt: string }[];
}

const STAT_CARDS = (s: Stats) => [
  { label: "Aktif Kullanıcı",   value: s.aktifKullanici, icon: "👥", color: "#006B3F" },
  { label: "Bekleyen Başvuru",  value: s.bekleyenler,    icon: "⏳", color: "#D9BC4B", link: "/panel/admin/kullanicilar?tab=bekleyenler" },
  { label: "Toplam İl",         value: s.toplamIl,       icon: "🗺️", color: "#0891B2" },
  { label: "Bu Yıl Faaliyet",   value: s.toplamFaaliyet, icon: "📋", color: "#7C3AED" },
  { label: "Yeni İntisap",      value: s.yeniIntisap,    icon: "🌱", color: "#059669" },
  { label: "Aktif Ev",          value: s.aktifEv,        icon: "🏠", color: "#EA580C" },
  { label: "Aktif Apart",       value: s.aktifApart,     icon: "🏢", color: "#0284C7" },
  { label: "Aktif Yurt",        value: s.aktifYurt,      icon: "🏫", color: "#BE185D" },
];

const PIE_DATA = (s: Stats) => [
  { name: "Aktif Kullanıcı", value: s.aktifKullanici, color: "#006B3F" },
  { name: "Bekleyen",        value: s.bekleyenler,    color: "#D9BC4B" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

export function AdminDashboardClient({ stats }: { stats: Stats }) {
  const cards = STAT_CARDS(stats);
  const pieData = PIE_DATA(stats);

  return (
    <div className="p-6 space-y-7 max-w-[1400px]">

      {/* ── Sayfa Başlığı ── */}
      <div className="sv-page-header">
        <h1>Genel Bakış</h1>
        <p>Türkiye geneli faaliyet ve sistem özeti</p>
      </div>

      {/* ── Uyarı Bandı ── */}
      {stats.bekleyenler > 0 && (
        <Link href="/panel/admin/kullanicilar?tab=bekleyenler"
          className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-dashed transition hover:shadow-md"
          style={{ borderColor: "#D9BC4B", background: "var(--gold-light)" }}>
          <span className="text-xl">⚠️</span>
          <div>
            <span className="font-bold text-sm" style={{ color: "#92700A" }}>
              {stats.bekleyenler} bekleyen başvuru var
            </span>
            <span className="ml-2 text-sm" style={{ color: "#B08A1A" }}>— İncelemek için tıklayın →</span>
          </div>
        </Link>
      )}

      {/* ── Stat Kartlar (4+4 grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* ── Alt Satır: Grafik + Tablolar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bölge Bar Chart */}
        <div className="sv-section lg:col-span-2">
          <div className="sv-section-header">
            <h2>Bölgelere Göre Veri Girişi</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
              Bu yıl
            </span>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.bolgeChartData} barSize={18}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v, n) => [v, n === "veri" ? "Veri Girilen" : "Toplam İl"]}
                />
                <Bar dataKey="toplam" fill="var(--green-muted)" radius={[6,6,0,0]} name="toplam" />
                <Bar dataKey="veri" fill="#006B3F" radius={[6,6,0,0]} name="veri" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kullanıcı Pie */}
        <div className="sv-section">
          <div className="sv-section-header">
            <h2>Kullanıcı Dağılımı</h2>
          </div>
          <div className="p-5 flex flex-col items-center justify-center h-[260px]">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {d.name} ({d.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Son Aktiviteler + Bekleyen Başvurular ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Son Log */}
        <div className="sv-section">
          <div className="sv-section-header">
            <h2>Son Sistem Hareketleri</h2>
            <Link href="/panel/admin/loglar" className="text-xs font-semibold hover:underline"
              style={{ color: "var(--green-primary)" }}>
              Tümünü Gör →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {stats.sonLogs.length === 0 && (
              <p className="p-5 text-sm text-center" style={{ color: "var(--text-muted)" }}>Henüz kayıt yok</p>
            )}
            {stats.sonLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                  style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {log.userName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {log.description || log.action}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bekleyen Başvurular */}
        <div className="sv-section">
          <div className="sv-section-header">
            <h2>Bekleyen Başvurular</h2>
            <Link href="/panel/admin/kullanicilar?tab=bekleyenler"
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--green-primary)" }}>
              Yönet →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {stats.sonBasvurular.length === 0 && (
              <p className="p-5 text-sm text-center" style={{ color: "var(--text-muted)" }}>Bekleyen başvuru yok ✓</p>
            )}
            {stats.sonBasvurular.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "#FBF5DC", color: "#92700A" }}>
                  {u.ad[0]}{u.soyad[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {u.ad} {u.soyad}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#FBF5DC", color: "#92700A" }}>
                    Bekliyor
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(u.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon, color, link }: {
  label: string; value: number; icon: string; color: string; link?: string;
}) {
  const inner = (
    <div className="sv-stat-card">
      <div className="card-bar" style={{ background: color }} />
      <div className="card-icon">{icon}</div>
      <p className="card-label">{label}</p>
      <p className="card-value" style={{ color }}>{value.toLocaleString("tr-TR")}</p>
    </div>
  );
  if (link) return <Link href={link}>{inner}</Link>;
  return inner;
}
