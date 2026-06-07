"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error || !res?.ok) {
        setError("E-posta veya şifre hatalı.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #F0F7F3 0%, #E8F5EE 100%)" }}>

      {/* ── Üst bar ── */}
      <header className="w-full border-b px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(10px)", borderColor: "#D1E8DB" }}>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006B3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span className="text-sm font-semibold" style={{ color: "#006B3F" }}>Ana Sayfaya Dön</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Serhendi" className="w-7 h-7" />
          <div className="hidden sm:block">
            <p className="text-xs font-bold leading-tight" style={{ color: "#006B3F" }}>Serhendi Gençlik</p>
            <p className="text-[10px] leading-tight" style={{ color: "#6B7280" }}>Faaliyet Takip Sistemi</p>
          </div>
        </div>
      </header>

      {/* ── Form alanı ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-xl border"
          style={{ background: "#fff", borderColor: "#D1E8DB" }}>

          {/* Kart başlığı */}
          <div className="px-8 py-7 text-center"
            style={{ background: "linear-gradient(135deg, #003D24, #006B3F)" }}>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <img src="/logo.svg" alt="Serhendi" className="w-9 h-9" />
              </div>
            </div>
            <h1 className="text-xl font-black text-white">Görevli Girişi</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              Faaliyet Takip Sistemi · Serhendi Gençlik
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-5">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                style={{ color: "#6B7280" }}>E-posta Adresi</label>
              <div className="relative">
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium border-2 focus:outline-none transition pr-10"
                  style={{ background: "#F7F8F4", borderColor: "#C8E6D5", color: "#1F2937" }}
                  onFocus={e => (e.target.style.borderColor = "#006B3F")}
                  onBlur={e => (e.target.style.borderColor = "#C8E6D5")}
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                style={{ color: "#6B7280" }}>Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 pr-20 text-sm font-medium border-2 focus:outline-none transition"
                  style={{ background: "#F7F8F4", borderColor: "#C8E6D5", color: "#1F2937" }}
                  onFocus={e => (e.target.style.borderColor = "#006B3F")}
                  onBlur={e => (e.target.style.borderColor = "#C8E6D5")}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-1 transition"
                  style={{ color: "#006B3F" }}>
                  {showPass ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 border"
                style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition shadow hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #006B3F, #008C4F)" }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Giriş yapılıyor...
                  </span>
                : "Giriş Yap"
              }
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#E2EBE7" }} />
              <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>veya</span>
              <div className="flex-1 h-px" style={{ background: "#E2EBE7" }} />
            </div>

            <button type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-3 border-2 rounded-xl py-3 text-sm font-bold transition hover:bg-gray-50"
              style={{ borderColor: "#E2EBE7", color: "#374151", background: "#fff" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google ile Giriş Yap / Kayıt Ol
            </button>

            <p className="text-center text-sm" style={{ color: "#6B7280" }}>
              Hesabınız yok mu?{" "}
              <Link href="/kayit" className="font-bold hover:underline" style={{ color: "#006B3F" }}>
                Başvuru Oluştur
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
