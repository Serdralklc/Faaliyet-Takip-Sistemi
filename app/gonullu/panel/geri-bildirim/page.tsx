"use client";
import { useState, useEffect } from "react";
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
    inp:  dark ? "#0F241C" : "#FFFFFF",
    bg2:  dark ? "#0F241C" : "#F6F8F5",
  };
}

const DURUM_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  YENI:        { label: "Yeni",        bg: "#EFF6FF", color: "#1D4ED8" },
  INCELENIYOR: { label: "İnceleniyor", bg: "#FEF3C7", color: "#92400E" },
  COZULDU:     { label: "Çözüldü",     bg: "#D1FAE5", color: "#065F46" },
  KAPATILDI:   { label: "Kapatıldı",   bg: "#F3F4F6", color: "#374151" },
};

const KONU_LABEL: Record<string, string> = {
  ONERI: "Öneri", TALEP: "Talep", TEKNIK_SORUN: "Teknik Sorun", DIGER: "Diğer",
};

export default function GeriBildirimPage() {
  const c = useColors();
  const [konu,    setKonu]    = useState("");
  const [mesaj,   setMesaj]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [gecmis,  setGecmis]  = useState<{ id: string; konu: string; mesaj: string; durum: string; createdAt: string }[]>([]);

  function loadGecmis() {
    fetch("/api/gonullu/geri-bildirim").then(r => r.ok ? r.json() : []).then(setGecmis);
  }
  useEffect(loadGecmis, []);

  const inputSt = {
    background: c.inp, border: `1px solid ${c.br}`, borderRadius: "0.75rem",
    padding: "0.625rem 1rem", width: "100%", fontSize: "14px", color: c.h, outline: "none",
  } as React.CSSProperties;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gonullu/geri-bildirim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ konu, mesaj }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gönderilemedi."); return; }
      setSuccess(true);
      setKonu(""); setMesaj("");
      setTimeout(() => { setSuccess(false); loadGecmis(); }, 1500);
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>İletişim</p>
        <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Geri Bildirim Gönder</h1>
        <p style={{ color: c.b, fontSize: "14px", marginTop: "6px" }}>Öneri, talep veya görüşlerinizi iletebilirsiniz.</p>
      </div>

      {/* Form */}
      <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "28px", marginBottom: "24px" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: BRAND.green + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <p style={{ color: c.h, fontWeight: 700 }}>Geri bildiriminiz alındı. Teşekkürler!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "16px" }}>
                <p style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</p>
              </div>
            )}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: c.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Konu *</label>
              <select required style={{ ...inputSt, cursor: "pointer" }}
                value={konu} onChange={e => setKonu(e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)}>
                <option value="">Seçiniz...</option>
                <option value="ONERI">Öneri</option>
                <option value="TALEP">Talep</option>
                <option value="TEKNIK_SORUN">Teknik Sorun</option>
                <option value="DIGER">Diğer</option>
              </select>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: c.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Mesaj *</label>
              <textarea required rows={5} style={{ ...inputSt, resize: "none" }}
                placeholder="Mesajınızı buraya yazın..."
                value={mesaj} onChange={e => setMesaj(e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)} />
            </div>
            <button type="submit" disabled={loading}
              style={{ background: BRAND.green, color: BRAND.gold, padding: "12px 28px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", border: "none" }}>
              {loading ? "Gönderiliyor..." : "Gönder"}
            </button>
          </form>
        )}
      </div>

      {/* Geçmiş */}
      {gecmis.length > 0 && (
        <div>
          <h2 style={{ color: c.h, fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}>Geçmiş Geri Bildirimler</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {gecmis.map(g => {
              const d = DURUM_CONFIG[g.durum] || { label: g.durum, bg: "#F3F4F6", color: "#374151" };
              return (
                <div key={g.id} style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: BRAND.green + "18", color: BRAND.green, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>
                        {KONU_LABEL[g.konu] || g.konu}
                      </span>
                      <span style={{ background: d.bg, color: d.color, fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>{d.label}</span>
                    </div>
                    <span style={{ color: c.mu, fontSize: "12px" }}>{new Date(g.createdAt).toLocaleDateString("tr-TR")}</span>
                  </div>
                  <p style={{ color: c.b, fontSize: "13.5px" }}>{g.mesaj}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
