"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── Rol → Sistem enum eşlemesi ── */
const SISTEM_MAP = {
  egitimci:   "EGITIMCI",
  universite: "UNIVERSITE",
  lise:       "LISE",
} as const;

type RoleKey = keyof typeof SISTEM_MAP;

const ROLES: {
  key:   RoleKey;
  title: string;
  sub:   string;
  desc:  string;
  color: string;
  icon:  React.ReactNode;
}[] = [
  {
    key:   "egitimci",
    title: "Eğitimci",
    sub:   "Serhendi Eğitim Kadrosu",
    desc:  "İl / bölge sorumlusu, yönetici ve eğitim kadrosu üyeleri için faaliyet takip ve raporlama sistemi.",
    color: "#0B6B3A",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    key:   "universite",
    title: "Üniversite Gençlik",
    sub:   "Üniversite Birimi",
    desc:  "KYK buluşmaları, ilim halkaları, kafile programları ve dergah faaliyetleri için takip sistemi.",
    color: "#1D4ED8",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14l9-5-9-5-9 5 9 5z"/>
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
      </svg>
    ),
  },
  {
    key:   "lise",
    title: "Lise Gençlik",
    sub:   "Lise Birimi",
    desc:  "Sabah namazı buluşmaları, ilim dersleri, kafile programları ve lise faaliyetleri için takip sistemi.",
    color: "#7C3AED",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
  },
];

/* ── Üst bar ── */
function TopBar() {
  return (
    <header
      className="w-full border-b px-5 py-3 flex items-center justify-between"
      style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderColor: "#D1E8DA" }}
    >
      <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B6B3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        <span className="text-[13px] font-semibold" style={{ color: "#0B6B3A" }}>Ana Sayfaya Dön</span>
      </Link>

      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EAF5EE" }}>
          <img src="/logo.svg" alt="Serhendi" className="w-4 h-4" />
        </div>
        <div className="hidden sm:block leading-none">
          <p className="text-[12px] font-bold" style={{ color: "#064E2A" }}>Serhendi Gençlik</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>Faaliyet Takip Sistemi</p>
        </div>
      </div>
    </header>
  );
}

/* ── Adım 1: Rol seçim kartları ── */
function RoleSelect({ onSelect }: { onSelect: (r: RoleKey) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Başlık */}
      <div className="text-center mb-10 max-w-md">
        <div className="flex justify-center mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#EAF5EE", border: "1px solid #C6E6D5" }}
          >
            <img src="/logo.svg" alt="Serhendi" className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-[22px] font-black mb-2" style={{ color: "#0F172A", letterSpacing: "-0.02em" }}>
          Sisteme Giriş
        </h1>
        <p className="text-[14px] leading-[1.65]" style={{ color: "#64748B" }}>
          Hangi faaliyet takip sistemine girmek istediğinizi seçin.
        </p>
      </div>

      {/* 3 kart */}
      <div className="w-full max-w-3xl grid sm:grid-cols-3 gap-4">
        {ROLES.map(role => (
          <button
            key={role.key}
            onClick={() => onSelect(role.key)}
            className="group text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = role.color + "60")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2E8F0")}
          >
            {/* Kart üst renk bandı */}
            <div
              className="h-1.5 w-full"
              style={{ background: role.color }}
            />

            <div className="px-6 py-7">
              {/* İkon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: role.color + "12", color: role.color }}
              >
                {role.icon}
              </div>

              {/* Başlık */}
              <p
                className="text-[16px] font-black mb-1 leading-tight"
                style={{ color: "#0F172A", letterSpacing: "-0.015em" }}
              >
                {role.title}
              </p>
              <p
                className="text-[11px] font-bold uppercase tracking-wider mb-4"
                style={{ color: role.color }}
              >
                {role.sub}
              </p>

              {/* Açıklama */}
              <p className="text-[13px] leading-[1.65]" style={{ color: "#64748B" }}>
                {role.desc}
              </p>

              {/* Ok */}
              <div className="flex items-center gap-1.5 mt-6 transition-all group-hover:gap-2.5">
                <span className="text-[12px] font-bold" style={{ color: role.color }}>Giriş Yap</span>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={role.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Adım 2: Giriş formu ── */
function LoginForm({
  roleKey,
  onBack,
}: {
  roleKey: RoleKey;
  onBack: () => void;
}) {
  const router   = useRouter();
  const role     = ROLES.find(r => r.key === roleKey)!;

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const sistem = SISTEM_MAP[roleKey];
      const res = await signIn("credentials", { email, password, sistem, redirect: false });
      if (!res?.ok) {
        if (res?.error === "SISTEM_UYUMSUZ") {
          setError(`Bu hesap "${role.title}" sistemine kayıtlı değil. Lütfen doğru giriş kartını seçin.`);
        } else {
          setError("E-posta veya şifre hatalı.");
        }
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
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-xl border"
        style={{ background: "#fff", borderColor: "#E2E8F0" }}
      >
        {/* Kart başlığı — rengi seçilen role göre */}
        <div
          className="px-8 py-8 text-center"
          style={{ background: `linear-gradient(135deg, ${role.color}E0, ${role.color})` }}
        >
          {/* Geri butonu */}
          <div className="flex justify-start mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[12px] font-semibold transition hover:opacity-75"
              style={{ color: "rgba(255,255,255,0.80)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Geri
            </button>
          </div>

          {/* İkon */}
          <div className="flex justify-center mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}
            >
              {role.icon}
            </div>
          </div>

          <h2 className="text-[20px] font-black text-white" style={{ letterSpacing: "-0.02em" }}>
            {role.title}
          </h2>
          <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>
            {role.sub} · Serhendi Gençlik
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-7 space-y-5">
          {/* E-posta */}
          <div>
            <label
              className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider"
              style={{ color: "#64748B" }}
            >
              E-posta Adresi
            </label>
            <div className="relative">
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 pr-10 text-[14px] font-medium border-2 focus:outline-none transition"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#0F172A" }}
                onFocus={e  => (e.target.style.borderColor = role.color)}
                onBlur={e   => (e.target.style.borderColor = "#E2E8F0")}
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label
              className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider"
              style={{ color: "#64748B" }}
            >
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 pr-20 text-[14px] font-medium border-2 focus:outline-none transition"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#0F172A" }}
                onFocus={e  => (e.target.style.borderColor = role.color)}
                onBlur={e   => (e.target.style.borderColor = "#E2E8F0")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold transition hover:opacity-75"
                style={{ color: role.color }}
              >
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>

          {/* Hata mesajı */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 border"
              style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}
            >
              <p className="text-[13px] font-bold text-red-600">{error}</p>
            </div>
          )}

          {/* Giriş butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: role.color }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              "Giriş Yap"
            )}
          </button>

          {/* Ayraç */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>veya</span>
            <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 border-2 rounded-xl py-3 text-[14px] font-bold transition hover:bg-gray-50"
            style={{ borderColor: "#E2E8F0", color: "#374151" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google ile Giriş Yap
          </button>

          <p className="text-center text-[13px]" style={{ color: "#64748B" }}>
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-bold hover:underline" style={{ color: role.color }}>
              Başvuru Oluştur
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Ana bileşen ── */
export default function GirisPage() {
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F6F8F5" }}
    >
      <TopBar />

      {selectedRole === null ? (
        <RoleSelect onSelect={setSelectedRole} />
      ) : (
        <LoginForm
          roleKey={selectedRole}
          onBack={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
}
