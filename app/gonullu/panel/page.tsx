"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useColors() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const dark = m && resolvedTheme === "dark";
  return {
    bg:   dark ? "#081C15" : "#F6F8F5",
    card: dark ? "#142C22" : "#FFFFFF",
    br:   dark ? "#1F3D31" : "#E2E8F0",
    h:    dark ? "#F8FAFC" : "#0F172A",
    b:    dark ? "#CBD5E1" : "#475569",
    mu:   dark ? "#94A3B8" : "#64748B",
    su:   dark ? "#0F241C" : "#F8FAFC",
  };
}

interface VolunteerData {
  adSoyad: string;
  telefon: string;
  email?: string;
  ogrenim: string;
  ogrenimTuru?: string;
  okul?: string;
  bolum?: string;
  il?: string;
  createdAt: string;
  isAdmin: boolean;
}

interface AdminStats {
  gonulluCount: number;
  bursCount: number;
  bekleyenCount: number;
  geriBildirimCount: number;
}

const OGRENIM_LABEL: Record<string, string> = {
  ILKOKUL: "İlkokul", ORTAOKUL: "Ortaokul", LISE: "Lise", UNIVERSITE: "Üniversite",
};

const DUYURULAR = [
  { baslik: "2024-2025 Nezir Burs Başvuruları Açıldı", tarih: "1 Haziran 2025", renk: BRAND.green },
  { baslik: "Yaz Kafile Programı Kayıtları Başladı",   tarih: "20 Mayıs 2025",  renk: "#7C3AED" },
  { baslik: "Sabah Namazı Buluşması — Haziran Programı", tarih: "15 Mayıs 2025", renk: "#1D4ED8" },
];

function AdminDashboard({ vol, c }: { vol: VolunteerData; c: ReturnType<typeof useColors> }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [gonulluRes, bursRes, gbRes] = await Promise.all([
          fetch("/api/admin/gonulluler"),
          fetch("/api/admin/burs"),
          fetch("/api/admin/geri-bildirim"),
        ]);
        const [gonulluData, bursData, gbData] = await Promise.all([
          gonulluRes.ok ? gonulluRes.json() : [],
          bursRes.ok ? bursRes.json() : [],
          gbRes.ok ? gbRes.json() : [],
        ]);
        const gonulluArr = Array.isArray(gonulluData) ? gonulluData : [];
        const bursArr = Array.isArray(bursData) ? bursData : [];
        const gbArr = Array.isArray(gbData) ? gbData : [];
        setStats({
          gonulluCount: gonulluArr.length,
          bursCount: bursArr.length,
          bekleyenCount: bursArr.filter((b: { durum: string }) => b.durum === "BEKLEMEDE").length,
          geriBildirimCount: gbArr.length,
        });
      } catch {
        setStats({ gonulluCount: 0, bursCount: 0, bekleyenCount: 0, geriBildirimCount: 0 });
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Toplam Gönüllü",
      value: stats?.gonulluCount ?? 0,
      iconColor: BRAND.green,
      iconBg: BRAND.green + "20",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v2h5m10-2v-2c0-.656.126-1.283.356-1.857M7 20v-2a3 3 0 005.356-1.857M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      label: "Toplam Burs Başvurusu",
      value: stats?.bursCount ?? 0,
      iconColor: "#7C3AED",
      iconBg: "#7C3AED20",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Bekleyen Başvuru",
      value: stats?.bekleyenCount ?? 0,
      iconColor: "#D97706",
      iconBg: "#D9770620",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Geri Bildirim",
      value: stats?.geriBildirimCount ?? 0,
      iconColor: "#1D4ED8",
      iconBg: "#1D4ED820",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Admin header */}
      <div style={{
        background: "linear-gradient(135deg, #064E2A, #0B6B3A 60%, #0F7A44)",
        borderRadius: "1.25rem",
        padding: "28px 32px",
        marginBottom: "24px",
        color: "#fff",
      }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: BRAND.gold, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
          Yönetici Paneli
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: BRAND.gold, letterSpacing: "-0.025em", marginBottom: "6px" }}>
          Yönetim Paneli
        </h1>
        <p style={{ fontSize: "14px", opacity: 0.9 }}>
          Hoş geldiniz, {vol.adSoyad}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              background: c.card,
              border: `1px solid ${c.br}`,
              borderRadius: "1rem",
              padding: "20px",
              position: "relative",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            <div style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: 38,
              height: 38,
              borderRadius: "10px",
              background: s.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <p style={{ fontSize: "32px", fontWeight: 800, color: c.h, lineHeight: 1.1, marginBottom: "6px" }}>
              {statsLoading ? "—" : s.value}
            </p>
            <p style={{ fontSize: "13px", color: c.mu, fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick action cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
        {[
          { href: "/gonullu/panel/burs-paneli", label: "Burs Başvurularını İncele", sub: "Tüm başvuruları görüntüle ve yönet" },
          { href: "/gonullu/panel/bildirimler", label: "Geri Bildirimleri Görüntüle", sub: "Gönüllülerden gelen bildirimleri incele" },
        ].map(card => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              background: BRAND.green,
              borderRadius: "1rem",
              padding: "22px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <div>
              <p style={{ color: BRAND.gold, fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{card.label}</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "12.5px" }}>{card.sub}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "12px" }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

function VolunteerDashboard({ vol, c }: { vol: VolunteerData; c: ReturnType<typeof useColors> }) {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Hoş geldiniz */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.green}, #064E2A)`,
        borderRadius: "1.25rem",
        padding: "28px 32px",
        marginBottom: "24px",
        color: "#fff",
      }}>
        <p style={{ fontSize: "13px", fontWeight: 600, opacity: 0.8, marginBottom: "6px" }}>Hoş Geldiniz 👋</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "8px" }}>
          {vol.adSoyad}
        </h1>
        <p style={{ fontSize: "14px", opacity: 0.85 }}>
          Serhendi Gençlik Gönüllü Paneline hoş geldiniz. Burs başvurusu yapabilir, geri bildirim gönderebilirsiniz.
        </p>
        {vol.il && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={BRAND.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ color: BRAND.gold, fontSize: "13px", fontWeight: 600 }}>{vol.il}</span>
          </div>
        )}
      </div>

      {/* Hızlı erişim */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { href: "/gonullu/panel/burs-basvurusu", label: "Burs Başvurusu",  renk: BRAND.green, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { href: "/gonullu/panel/basvurularim",   label: "Başvurularım",     renk: "#7C3AED",   icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { href: "/gonullu/panel/geri-bildirim",  label: "Geri Bildirim",    renk: "#1D4ED8",   icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
          { href: "/gonullu/panel/profil",         label: "Profilim",         renk: "#92400E",   icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px", display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: item.renk + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.renk} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </div>
            <span style={{ color: c.h, fontWeight: 600, fontSize: "14px" }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Duyurular + Profil özeti */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "16px" }}>
        {/* Duyurular */}
        <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px" }}>
          <h2 style={{ color: c.h, fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>Güncel Duyurular</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {DUYURULAR.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.renk, flexShrink: 0, marginTop: "6px" }} />
                <div>
                  <p style={{ color: c.h, fontWeight: 600, fontSize: "13.5px" }}>{d.baslik}</p>
                  <p style={{ color: c.mu, fontSize: "12px", marginTop: "2px" }}>{d.tarih}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profil özeti */}
        <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px" }}>
          <h2 style={{ color: c.h, fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>Profil Özeti</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { l: "Ad Soyad", v: vol.adSoyad },
              { l: "Telefon",  v: vol.telefon },
              { l: "E-posta",  v: vol.email || "—" },
              { l: "Öğrenim", v: OGRENIM_LABEL[vol.ogrenim] || vol.ogrenim },
              { l: "Okul",     v: vol.okul || "—" },
              { l: "İl",       v: vol.il || "—" },
            ].map(row => (
              <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: c.mu, fontSize: "12.5px" }}>{row.l}</span>
                <span style={{ color: c.h, fontSize: "13px", fontWeight: 500 }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GonulluPanelPage() {
  const c = useColors();
  const [vol, setVol] = useState<VolunteerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gonullu/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { setVol(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <p style={{ color: c.mu, fontSize: "14px" }}>Yükleniyor...</p>
      </div>
    );
  }

  if (!vol) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <p style={{ color: c.mu, fontSize: "14px" }}>Kullanıcı bilgisi alınamadı.</p>
      </div>
    );
  }

  if (vol.isAdmin) {
    return <AdminDashboard vol={vol} c={c} />;
  }

  return <VolunteerDashboard vol={vol} c={c} />;
}
