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
    card: dark ? "#142C22" : "#FFFFFF",
    br:   dark ? "#1F3D31" : "#E2E8F0",
    h:    dark ? "#F8FAFC" : "#0F172A",
    b:    dark ? "#CBD5E1" : "#475569",
    mu:   dark ? "#94A3B8" : "#64748B",
    bg2:  dark ? "#0F241C" : "#F6F8F5",
  };
}

interface BursBasvuru {
  id: string; adSoyad: string; universite: string; fakulteBolum: string;
  sinif: string; il: string; durum: string; yoneticiNotu?: string; createdAt: string;
}

interface EkKayit {
  id: string; ogrenciAd: string; ogrenciSoyad: string; universite: string;
  fakulte: string; bolum: string; kayitTipi: string; gidecegiIl?: string;
  durum: string; yoneticiNotu?: string; createdAt: string;
}

const DURUM_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  BEKLEMEDE:   { label: "Beklemede",   bg: "#FEF3C7", color: "#92400E" },
  INCELENIYOR: { label: "İnceleniyor", bg: "#EFF6FF", color: "#1D4ED8" },
  ONAYLANDI:   { label: "Onaylandı",   bg: "#D1FAE5", color: "#065F46" },
  REDDEDILDI:  { label: "Reddedildi",  bg: "#FEE2E2", color: "#991B1B" },
};

function DurumBadge({ durum }: { durum: string }) {
  const d = DURUM_CONFIG[durum] || { label: durum, bg: "#F3F4F6", color: "#374151" };
  return <span style={{ background: d.bg, color: d.color, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>{d.label}</span>;
}

export default function BasvurularimPage() {
  const c = useColors();
  const [burslar,   setBurslar]   = useState<BursBasvuru[]>([]);
  const [ekKayitlar, setEkKayitlar] = useState<EkKayit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"burs" | "ek-kayit">("burs");

  useEffect(() => {
    Promise.all([
      fetch("/api/gonullu/burs").then(r => r.ok ? r.json() : []),
      fetch("/api/gonullu/ek-kayit").then(r => r.ok ? r.json() : []),
    ]).then(([b, e]) => {
      setBurslar(b);
      setEkKayitlar(e);
      setLoading(false);
    });
  }, []);

  const tabSt = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13px",
    cursor: "pointer", border: "none",
    background: active ? BRAND.green : "transparent",
    color: active ? BRAND.gold : c.mu,
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Gönüllü Paneli</p>
          <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Başvurularım</h1>
        </div>
        <Link
          href={tab === "burs" ? "/gonullu/panel/burs-basvurusu" : "/gonullu/panel/ek-kayit-basvurusu"}
          style={{ background: BRAND.green, color: BRAND.gold, padding: "10px 20px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
        >
          + Yeni Başvuru
        </Link>
      </div>

      {/* Tab seçici */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: c.bg2, borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        <button style={tabSt(tab === "burs")} onClick={() => setTab("burs")}>
          Nezir Burs Başvuruları {burslar.length > 0 && `(${burslar.length})`}
        </button>
        <button style={tabSt(tab === "ek-kayit")} onClick={() => setTab("ek-kayit")}>
          Öğr. Evi / Apart / Yurt {ekKayitlar.length > 0 && `(${ekKayitlar.length})`}
        </button>
      </div>

      {loading ? (
        <p style={{ color: c.mu, fontSize: "14px" }}>Yükleniyor...</p>
      ) : tab === "burs" ? (
        burslar.length === 0 ? (
          <EmptyState c={c} label="Henüz burs başvurusu yok." href="/gonullu/panel/burs-basvurusu" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {burslar.map(b => (
              <div key={b.id} style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <p style={{ color: c.h, fontWeight: 700, fontSize: "15px" }}>{b.universite}</p>
                      <DurumBadge durum={b.durum} />
                    </div>
                    <p style={{ color: c.b, fontSize: "13.5px" }}>{b.fakulteBolum} — {b.sinif}</p>
                    <p style={{ color: c.mu, fontSize: "12px", marginTop: "4px" }}>{b.il} · {new Date(b.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                </div>
                {b.yoneticiNotu && (
                  <div style={{ background: c.bg2, borderRadius: "8px", padding: "10px 14px", marginTop: "14px" }}>
                    <p style={{ color: c.mu, fontSize: "12px", fontWeight: 600, marginBottom: "3px" }}>Yönetici Notu:</p>
                    <p style={{ color: c.b, fontSize: "13.5px" }}>{b.yoneticiNotu}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        ekKayitlar.length === 0 ? (
          <EmptyState c={c} label="Henüz başvuru yok." href="/gonullu/panel/ek-kayit-basvurusu" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {ekKayitlar.map(b => (
              <div key={b.id} style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <p style={{ color: c.h, fontWeight: 700, fontSize: "15px" }}>{b.ogrenciAd} {b.ogrenciSoyad}</p>
                      <DurumBadge durum={b.durum} />
                      <span style={{ background: BRAND.green + "15", color: BRAND.green, fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>{b.kayitTipi}</span>
                    </div>
                    <p style={{ color: c.b, fontSize: "13.5px" }}>{b.universite} — {b.fakulte} / {b.bolum}</p>
                    <p style={{ color: c.mu, fontSize: "12px", marginTop: "4px" }}>
                      {b.gidecegiIl && `${b.gidecegiIl} · `}{new Date(b.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
                {b.yoneticiNotu && (
                  <div style={{ background: c.bg2, borderRadius: "8px", padding: "10px 14px", marginTop: "14px" }}>
                    <p style={{ color: c.mu, fontSize: "12px", fontWeight: 600, marginBottom: "3px" }}>Yönetici Notu:</p>
                    <p style={{ color: c.b, fontSize: "13.5px" }}>{b.yoneticiNotu}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ c, label, href }: { c: ReturnType<typeof useColors>; label: string; href: string }) {
  return (
    <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "48px 32px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.bg2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.mu} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p style={{ color: c.h, fontWeight: 600, fontSize: "15px" }}>{label}</p>
      <Link href={href} style={{ display: "inline-block", marginTop: "12px", background: BRAND.green, color: BRAND.gold, padding: "8px 20px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
        Başvuru Oluştur
      </Link>
    </div>
  );
}
