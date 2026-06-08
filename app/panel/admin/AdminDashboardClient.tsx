"use client";

import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Stats {
  toplamBolge: number;
  toplamIl: number;
  tamVeriGirenIlSayisi: number;
  aktifKullanici: number;
  evSayisi: number;
  evOgrenci: number;
  apartSayisi: number;
  apartOgrenci: number;
  yurtSayisi: number;
  yurtOgrenci: number;
  bolgeChartData: { name: string; veri: number; toplam: number }[];
  toplamBekleyen: number;
  sonLogs: { id: string; action: string; description: string | null; createdAt: string; userName: string }[];
  sonBasvurular: { id: string; ad: string; soyad: string; email: string; createdAt: string; sistem: string | null; basvuruGorev: string | null }[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

const SISTEM_LABEL: Record<string, string> = {
  EGITIMCI:   "Eğitimci",
  UNIVERSITE: "Üniversite",
  LISE:       "Lise",
};

const GOREV_LABEL: Record<string, string> = {
  IL_SORUMLUSU:      "İl Sorumlusu",
  BOLGE_SORUMLUSU:   "Bölge Sorumlusu",
  TURKIYE_EGITIM_SORUMLUSU:     "Türkiye Eğitim Sorumlusu",
  TURKIYE_UNIVERSITE_SORUMLUSU: "Türkiye Üniversite Gençlik Sorumlusu",
  TURKIYE_LISE_SORUMLUSU:       "Türkiye Lise Gençlik Sorumlusu",
  GENEL_MERKEZ:      "Merkez Ekibi",
};

export function AdminDashboardClient({ stats }: { stats: Stats }) {
  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── Başlık ── */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Genel Bakış
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Türkiye geneli eğitimci sistemi ve organizasyon özeti
        </p>
      </div>

      {/* ── Bekleyen uyarı bandı ── */}
      {stats.toplamBekleyen > 0 && (
        <Link
          href="/panel/admin/kullanicilar"
          className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-dashed transition hover:shadow-md"
          style={{ borderColor: "#D97706", background: "#FFFBEB" }}
        >
          <span className="text-xl">⚠️</span>
          <div>
            <span className="font-bold text-sm" style={{ color: "#92400E" }}>
              {stats.toplamBekleyen} bekleyen başvuru var
            </span>
            <span className="ml-2 text-sm" style={{ color: "#B45309" }}>— İncelemek için tıklayın →</span>
          </div>
        </Link>
      )}

      {/* ── Satır 1: Coğrafi + Veri Girişi + Kullanıcı ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Toplam Bölge */}
        <MiniStatCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            </svg>
          }
          label="Toplam Bölge"
          value={stats.toplamBolge}
          color="#0B6B3A"
        />

        {/* Toplam İl */}
        <MiniStatCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          }
          label="Toplam İl"
          value={stats.toplamIl}
          color="#0891B2"
        />

        {/* Tam veri girilen il */}
        <MiniStatCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
          label="Tam Veri Girilen İl"
          value={stats.tamVeriGirenIlSayisi}
          color="#059669"
          sublabel={`/ ${stats.toplamIl} il`}
        />

        {/* Aktif kullanıcı */}
        <MiniStatCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
          label="Aktif Kullanıcı"
          value={stats.aktifKullanici}
          sublabel="Eğitimci sistemi"
          color="#7C3AED"
          link="/panel/admin/kullanicilar?sistem=EGITIMCI"
        />
      </div>

      {/* ── Satır 2: Barınma kartları ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BarinmaCard
          tip="Ev"
          icon="🏠"
          color="#EA580C"
          bgColor="#FFF7ED"
          borderColor="#FED7AA"
          sayi={stats.evSayisi}
          ogrenci={stats.evOgrenci}
        />
        <BarinmaCard
          tip="Apart"
          icon="🏢"
          color="#0284C7"
          bgColor="#F0F9FF"
          borderColor="#BAE6FD"
          sayi={stats.apartSayisi}
          ogrenci={stats.apartOgrenci}
        />
        <BarinmaCard
          tip="Yurt"
          icon="🏫"
          color="#BE185D"
          bgColor="#FDF2F8"
          borderColor="#FBCFE8"
          sayi={stats.yurtSayisi}
          ogrenci={stats.yurtOgrenci}
        />
      </div>

      {/* ── Satır 3: Bölge Grafiği + Kullanıcı Özeti ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bölgelere göre veri girişi */}
        <div className="sv-section lg:col-span-2">
          <div className="sv-section-header">
            <div>
              <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Bölgelere Göre Veri Girişi
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Eğitimci faaliyet takip sistemi · Bu yıl
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
              {new Date().getFullYear()}
            </span>
          </div>
          <div className="px-4 pb-5 pt-2">
            {stats.bolgeChartData.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>Henüz veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={stats.bolgeChartData} barSize={16} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any, n: any) => [`${v} il`, n === "veri" ? "Veri Giren İl" : "Toplam İl"]}
                  />
                  <Bar dataKey="toplam" name="toplam" radius={[5, 5, 0, 0]}>
                    {stats.bolgeChartData.map((_, i) => (
                      <Cell key={i} fill="#D1FAE5" />
                    ))}
                  </Bar>
                  <Bar dataKey="veri" name="veri" radius={[5, 5, 0, 0]}>
                    {stats.bolgeChartData.map((_, i) => (
                      <Cell key={i} fill="#0B6B3A" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-5 mt-1 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "#0B6B3A" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Veri Giren İl</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: "#D1FAE5" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Toplam İl</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sistem Özeti */}
        <div className="sv-section">
          <div className="sv-section-header">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Eğitimci Sistemi</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-xl p-4 text-center" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <p className="text-3xl font-black" style={{ color: "#0B6B3A" }}>
                {stats.aktifKullanici}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#065F46" }}>Aktif Kullanıcı</p>
            </div>

            <div className="rounded-xl p-4 text-center" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <p className="text-3xl font-black" style={{ color: "#059669" }}>
                {stats.tamVeriGirenIlSayisi}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#065F46" }}>
                Tamamlanmış İl
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#6EE7B7" }}>
                3 birim eksiksiz girilmiş
              </p>
            </div>

            <Link
              href="/panel/admin/kullanicilar?sistem=EGITIMCI"
              className="block w-full text-center py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
              style={{ background: "#0B6B3A", color: "#D4AF37" }}
            >
              Kullanıcıları Yönet →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Satır 4: Son Hareketler + Bekleyen Başvurular ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Son sistem hareketleri */}
        <div className="sv-section">
          <div className="sv-section-header">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Son Sistem Hareketleri</h2>
            <Link href="/panel/admin/loglar" className="text-xs font-semibold hover:underline"
              style={{ color: "var(--green-primary)" }}>
              Tümü →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {stats.sonLogs.length === 0 ? (
              <p className="p-5 text-sm text-center" style={{ color: "var(--text-muted)" }}>Henüz kayıt yok</p>
            ) : stats.sonLogs.map(log => (
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

        {/* Bekleyen başvurular */}
        <div className="sv-section">
          <div className="sv-section-header">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Bekleyen Başvurular
              {stats.toplamBekleyen > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                  {stats.toplamBekleyen}
                </span>
              )}
            </h2>
            <Link href="/panel/admin/kullanicilar"
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--green-primary)" }}>
              Yönet →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {stats.sonBasvurular.length === 0 ? (
              <p className="p-5 text-sm text-center" style={{ color: "var(--text-muted)" }}>Bekleyen başvuru yok ✓</p>
            ) : stats.sonBasvurular.map(u => (
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                    {u.sistem ? SISTEM_LABEL[u.sistem] ?? u.sistem : "—"}
                  </span>
                  {u.basvuruGorev && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                      {GOREV_LABEL[u.basvuruGorev] ?? u.basvuruGorev}
                    </span>
                  )}
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

/* ── Mini stat kartı ── */
function MiniStatCard({
  icon, label, value, color, sublabel, link,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  sublabel?: string;
  link?: string;
}) {
  const inner = (
    <div className="rounded-2xl p-4 border-2 transition hover:shadow-md"
      style={{ background: "var(--bg-card)", borderColor: color + "20" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: color + "12", color }}>
        {icon}
      </div>
      <p className="text-2xl font-black leading-none" style={{ color }}>{value.toLocaleString("tr-TR")}</p>
      {sublabel && (
        <p className="text-xs font-medium mt-0.5" style={{ color: color + "80" }}>{sublabel}</p>
      )}
      <p className="text-xs font-semibold mt-2" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
  if (link) return <Link href={link}>{inner}</Link>;
  return inner;
}

/* ── Barınma kartı ── */
function BarinmaCard({
  tip, icon, color, bgColor, borderColor, sayi, ogrenci,
}: {
  tip: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  sayi: number;
  ogrenci: number;
}) {
  return (
    <div className="rounded-2xl p-5 border-2" style={{ background: bgColor, borderColor }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm font-black" style={{ color }}>Aktif {tip}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: color + "80" }}>Barınma Birimi</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: "#fff", border: `1px solid ${borderColor}` }}>
          <p className="text-2xl font-black" style={{ color }}>{sayi}</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: color + "99" }}>{tip} Sayısı</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#fff", border: `1px solid ${borderColor}` }}>
          <p className="text-2xl font-black" style={{ color }}>{ogrenci}</p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: color + "99" }}>Öğrenci</p>
        </div>
      </div>
    </div>
  );
}
