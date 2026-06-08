"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useColors() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const dark = m && resolvedTheme === "dark";
  return {
    bg: dark ? "#081C15" : "#F6F8F5",
    sr: dark ? "#142C22" : "#FFFFFF",
    br: dark ? "#1F3D31" : "#E2E8F0",
    h:  dark ? "#F8FAFC" : "#0F172A",
    b:  dark ? "#CBD5E1" : "#475569",
    mu: dark ? "#94A3B8" : "#64748B",
  };
}

export default function GonulluGirisPage() {
  const router = useRouter();
  const c = useColors();
  const [email,   setEmail]   = useState("");
  const [sifre,   setSifre]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const inputSt = {
    background:          c.sr,
    border:              `1px solid ${c.br}`,
    borderRadius:        "0.75rem",
    padding:             "0.625rem 1rem",
    width:               "100%",
    fontSize:            "14px",
    color:               c.h,
    outline:             "none",
    WebkitBoxShadow:     `0 0 0 1000px ${c.sr} inset`,
    WebkitTextFillColor: c.h,
  } as React.CSSProperties;

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
    <div style={{ minHeight: "100dvh", background: c.bg }} className="flex items-center justify-center px-4">
      <div style={{ background: c.sr, border: `1px solid ${c.br}`, borderRadius: "1.5rem", padding: "2.5rem", width: "100%", maxWidth: "420px" }}>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl" style={{ background: BRAND.green + "18" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <span style={{ color: BRAND.green, fontSize: "12px", fontWeight: 700 }}>Gönüllü Girişi</span>
          </div>
          <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Serhendi Gençlik</h1>
          <p style={{ color: c.b, fontSize: "14px", marginTop: "4px" }}>Gönüllü panelinize giriş yapın</p>
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "16px" }}>
            <p style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: c.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              E-posta
            </label>
            <input type="email" required placeholder="ornek@email.com" style={inputSt}
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={e => (e.target.style.border = `1px solid ${BRAND.green}`)}
              onBlur={e  => (e.target.style.border = `1px solid ${c.br}`)} />
          </div>
          <div>
            <label style={{ color: c.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Şifre
            </label>
            <input type="password" required placeholder="Şifreniz" style={inputSt}
              value={sifre} onChange={e => setSifre(e.target.value)}
              onFocus={e => (e.target.style.border = `1px solid ${BRAND.green}`)}
              onBlur={e  => (e.target.style.border = `1px solid ${c.br}`)} />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ background: BRAND.green, color: BRAND.gold, width: "100%", padding: "12px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", marginTop: "4px" }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={{ borderTop: `1px solid ${c.br}`, marginTop: "20px", paddingTop: "16px" }} className="text-center space-y-2">
          <p style={{ color: c.mu, fontSize: "13px" }}>
            Hesabınız yok mu?{" "}
            <Link href="/gonullu-kayit" style={{ color: BRAND.green, fontWeight: 600 }}>Kayıt olun</Link>
          </p>
          <p style={{ color: c.mu, fontSize: "13px" }}>
            <Link href="/" style={{ color: c.b }}>← Ana sayfaya dön</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
