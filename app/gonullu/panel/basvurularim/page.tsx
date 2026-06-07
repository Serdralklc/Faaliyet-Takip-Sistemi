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

interface Basvuru {
  id: string; adSoyad: string; universite: string; fakulteBolum: string;
  sinif: string; il: string; durum: string; yoneticiNotu?: string; createdAt: string;
}

const DURUM_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  BEKLEMEDE:    { label: "Beklemede",    bg: "#FEF3C7", color: "#92400E" },
  INCELENIYOR:  { label: "İnceleniyor",  bg: "#EFF6FF", color: "#1D4ED8" },
  ONAYLANDI:    { label: "Onaylandı",    bg: "#D1FAE5", color: "#065F46" },
  REDDEDILDI:   { label: "Reddedildi",   bg: "#FEE2E2", color: "#991B1B" },
};

export default function BasvurularimPage() {
  const c = useColors();
  const [list,    setList]    = useState<Basvuru[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gonullu/burs")
      .then(r => r.ok ? r.json() : [])
      .then(data => { setList(data); setLoading(false); });
  }, []);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Nezir Burs Programı</p>
          <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Başvurularım</h1>
        </div>
        <Link href="/gonullu/panel/burs-basvurusu"
          style={{ background: BRAND.green, color: BRAND.gold, padding: "10px 20px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
          + Yeni Başvuru
        </Link>
      </div>

      {loading ? (
        <p style={{ color: c.mu, fontSize: "14px" }}>Yükleniyor...</p>
      ) : list.length === 0 ? (
        <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.bg2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.mu} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p style={{ color: c.h, fontWeight: 600, fontSize: "15px" }}>Henüz başvuru yok</p>
          <p style={{ color: c.b, fontSize: "14px", marginTop: "6px" }}>İlk burs başvurunuzu oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {list.map(b => {
            const d = DURUM_CONFIG[b.durum] || { label: b.durum, bg: "#F3F4F6", color: "#374151" };
            return (
              <div key={b.id} style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <p style={{ color: c.h, fontWeight: 700, fontSize: "15px" }}>{b.universite}</p>
                      <span style={{ background: d.bg, color: d.color, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>{d.label}</span>
                    </div>
                    <p style={{ color: c.b, fontSize: "13.5px" }}>{b.fakulteBolum} — {b.sinif}</p>
                    <p style={{ color: c.mu, fontSize: "12px", marginTop: "4px" }}>
                      {b.il} · {new Date(b.createdAt).toLocaleDateString("tr-TR")}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
