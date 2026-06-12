"use client";
import { useState, useEffect } from "react";
import { BRAND, useColors } from "@/lib/theme";

const OGRENIM_LABEL: Record<string, string> = {
  ILKOKUL: "İlkokul", ORTAOKUL: "Ortaokul", LISE: "Lise", UNIVERSITE: "Üniversite",
};
const OGRENIM_TURU_LABEL: Record<string, string> = {
  ONLISANS: "Ön Lisans", LISANS: "Lisans", YUKSEK_LISANS: "Yüksek Lisans", DOKTORA: "Doktora",
};

export default function ProfilPage() {
  const c = useColors();
  const [vol, setVol] = useState<{ adSoyad: string; telefon: string; email?: string; ogrenim: string; ogrenimTuru?: string; okul?: string; bolum?: string; il?: string; createdAt: string } | null>(null);
  const [telefon,    setTelefon]    = useState("");
  const [email,      setEmail]      = useState("");
  const [eskiSifre,  setEskiSifre]  = useState("");
  const [yeniSifre,  setYeniSifre]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/gonullu/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setVol(d); setTelefon(d.telefon); setEmail(d.email || ""); }
    });
  }, []);

  const inputSt = {
    background: c.inp, border: `1px solid ${c.br}`, borderRadius: "0.75rem",
    padding: "0.625rem 1rem", width: "100%", fontSize: "14px", color: c.h, outline: "none",
  } as React.CSSProperties;
  const labelSt = { color: c.mu, fontSize: "12px", fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block" as const, marginBottom: "6px" };

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const body: Record<string, string> = { telefon, email };
      if (yeniSifre) { body.eskiSifre = eskiSifre; body.yeniSifre = yeniSifre; }

      const res = await fetch("/api/gonullu/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error || "Güncelleme başarısız.", ok: false }); return; }
      setMsg({ text: "Profil güncellendi.", ok: true });
      setEskiSifre(""); setYeniSifre("");
    } catch {
      setMsg({ text: "Bir hata oluştu.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Hesabım</p>
        <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Profilim</h1>
      </div>

      {/* Bilgi kartı */}
      {vol && (
        <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: BRAND.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: BRAND.gold, fontWeight: 800, fontSize: "20px" }}>{vol.adSoyad[0]}</span>
            </div>
            <div>
              <p style={{ color: c.h, fontWeight: 700, fontSize: "16px" }}>{vol.adSoyad}</p>
              <p style={{ color: c.mu, fontSize: "13px" }}>
                {OGRENIM_LABEL[vol.ogrenim] || vol.ogrenim}
                {vol.ogrenimTuru ? ` · ${OGRENIM_TURU_LABEL[vol.ogrenimTuru] || vol.ogrenimTuru}` : ""}
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: `1px solid ${c.br}`, paddingTop: "16px" }}>
            {[
              { l: "Okul",    v: vol.okul    || "—" },
              { l: "Bölüm",   v: vol.bolum   || "—" },
              { l: "İl",      v: vol.il      || "—" },
              { l: "Kayıt",   v: new Date(vol.createdAt).toLocaleDateString("tr-TR") },
            ].map(row => (
              <div key={row.l}>
                <p style={{ color: c.mu, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.l}</p>
                <p style={{ color: c.h, fontSize: "14px", marginTop: "2px", fontWeight: 500 }}>{row.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Güncelleme formu */}
      <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "28px" }}>
        <h2 style={{ color: c.h, fontWeight: 700, fontSize: "15px", marginBottom: "20px" }}>Bilgileri Güncelle</h2>

        {msg && (
          <div style={{ background: msg.ok ? "#D1FAE5" : "#FEE2E2", border: `1px solid ${msg.ok ? "#6EE7B7" : "#FECACA"}`, borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "16px" }}>
            <p style={{ color: msg.ok ? "#065F46" : "#B91C1C", fontSize: "14px" }}>{msg.text}</p>
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelSt}>Telefon</label>
            <input type="tel" style={inputSt} value={telefon} onChange={e => setTelefon(e.target.value)}
              onFocus={e => (e.target.style.borderColor = BRAND.green)}
              onBlur={e  => (e.target.style.borderColor = c.br)} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelSt}>E-posta</label>
            <input type="email" style={inputSt} placeholder="ornek@email.com" value={email} onChange={e => setEmail(e.target.value)}
              onFocus={e => (e.target.style.borderColor = BRAND.green)}
              onBlur={e  => (e.target.style.borderColor = c.br)} />
          </div>

          <div style={{ borderTop: `1px solid ${c.br}`, paddingTop: "20px", marginBottom: "20px" }}>
            <p style={{ color: c.h, fontWeight: 600, fontSize: "14px", marginBottom: "14px" }}>Şifre Değiştir</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelSt}>Mevcut Şifre</label>
                <input type="password" style={inputSt} placeholder="Mevcut şifreniz" value={eskiSifre} onChange={e => setEskiSifre(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
              <div>
                <label style={labelSt}>Yeni Şifre</label>
                <input type="password" style={inputSt} placeholder="En az 8 karakter" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ background: BRAND.green, color: BRAND.gold, padding: "12px 28px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", border: "none" }}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
