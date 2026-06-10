"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BRAND  = { green: "#0B6B3A", gold: "#D4AF37" };
const COLORS = { bg: "#F6F8F5", sr: "#FFFFFF", br: "#CBD5E1", h: "#0F172A", b: "#475569", mu: "#64748B" };

const inputSt: React.CSSProperties = {
  background:          COLORS.sr,
  border:              `2px solid ${COLORS.br}`,
  borderRadius:        "0.75rem",
  padding:             "0.75rem 1rem",
  width:               "100%",
  fontSize:            "14px",
  color:               COLORS.h,
  outline:             "none",
  boxSizing:           "border-box",
  WebkitBoxShadow:     `0 0 0 1000px ${COLORS.sr} inset`,
  WebkitTextFillColor: COLORS.h,
};

const labelSt: React.CSSProperties = {
  color: COLORS.mu, fontSize: "12px", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: "6px",
};

export default function GonulluGirisPage() {
  const router = useRouter();
  const [email,   setEmail]   = useState("");
  const [sifre,   setSifre]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gonullu/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sifre }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Giriş başarısız."); return; }
      router.push("/gonullu/panel");
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: COLORS.bg }} className="flex items-center justify-center px-4">
      <div style={{ background: COLORS.sr, border: `1px solid ${COLORS.br}`, borderRadius: "1.5rem", padding: "2.5rem", width: "100%", maxWidth: "420px" }}>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl" style={{ background: BRAND.green + "18" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <span style={{ color: BRAND.green, fontSize: "12px", fontWeight: 700 }}>Gönüllü Girişi</span>
          </div>
          <h1 style={{ color: COLORS.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Serhendi Gençlik</h1>
          <p style={{ color: COLORS.b, fontSize: "14px", marginTop: "4px" }}>Gönüllü panelinize giriş yapın</p>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "16px" }}>
            <p style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelSt}>E-posta</label>
            <input
              type="text" inputMode="email" autoComplete="off" required
              placeholder="ornek@email.com"
              className="public-input"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={labelSt}>Şifre</label>
            <input
              type="password" required
              placeholder="Şifreniz"
              className="public-input"
              value={sifre} onChange={e => setSifre(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ background: BRAND.green, color: BRAND.gold, width: "100%", padding: "12px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", marginTop: "4px" }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={{ borderTop: `1px solid ${COLORS.br}`, marginTop: "20px", paddingTop: "16px" }} className="text-center space-y-2">
          <p style={{ color: COLORS.mu, fontSize: "13px" }}>
            Hesabınız yok mu?{" "}
            <Link href="/gonullu-kayit" style={{ color: BRAND.green, fontWeight: 600 }}>Kayıt olun</Link>
          </p>
          <p style={{ color: COLORS.mu, fontSize: "13px" }}>
            <Link href="/" style={{ color: COLORS.b }}>← Ana sayfaya dön</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
