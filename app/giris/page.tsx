"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ── Rol → Sistem enum eşlemesi ── */
const SISTEM_MAP = {
  egitimci:   "EGITIMCI",
  universite: "UNIVERSITE",
  lise:       "LISE",
  yonetici:   "YONETICI",   // özel — admin rolleri için
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

const YONETICI_CARD = {
  key:   "yonetici" as RoleKey,
  title: "Yönetici Paneli",
  sub:   "Merkez Yönetimi",
  desc:  "Admin, Merkez Ekibi ve Türkiye Sorumluları için giriş ve başvuru.",
  color: "#92400E",
  bg:    "#FFFBF0",
  icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

/* Tüm kartlar — Yönetici solda (ilk), sistemler sağda */
const ALL_CARDS = [
  YONETICI_CARD,
  ...ROLES.map(r => ({ ...r, bg: "#fff" })),
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

      {/* 4 kart: Yönetici (sol) + 3 sistem */}
      <div className="w-full max-w-5xl grid grid-cols-2 xl:grid-cols-4 gap-4">
        {ALL_CARDS.map(card => (
          <RoleCard key={card.key} role={card} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function RoleCard({ role, onSelect }: { role: { key: RoleKey; title: string; sub: string; desc: string; color: string; bg?: string; icon: React.ReactNode }; onSelect: (r: RoleKey) => void }) {
  const isYon = role.key === "yonetici";
  return (
    <button
      onClick={() => onSelect(role.key)}
      className="group text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
      style={{ background: role.bg ?? "#fff", borderColor: "#E2E8F0" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = role.color + "60")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#E2E8F0")}
    >
      {/* Renk bandı — yönetici için gradient */}
      <div className="h-1.5 w-full" style={{
        background: isYon ? `linear-gradient(90deg, ${role.color}, #D4AF37)` : role.color
      }} />
      <div className="px-5 py-6">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: role.color + "12", color: role.color }}>
          {role.icon}
        </div>
        <p className="text-[15px] font-black mb-1 leading-tight"
          style={{ color: "#0F172A", letterSpacing: "-0.015em" }}>{role.title}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: role.color }}>
          {role.sub}
        </p>
        <p className="text-[12px] leading-[1.6]" style={{ color: "#64748B" }}>{role.desc}</p>
        <div className="flex items-center gap-1.5 mt-5 transition-all group-hover:gap-2.5">
          <span className="text-[11px] font-bold" style={{ color: role.color }}>
            {isYon ? "Giriş / Başvuru" : "Giriş Yap"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={role.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </button>
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
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const redirectTo      = searchParams.get("redirect") ?? "/";
  const gonulluRedirect = searchParams.get("gonullu_redirect") === "1";
  const isYonetici      = roleKey === "yonetici";
  const role            = isYonetici ? YONETICI_CARD : ROLES.find(r => r.key === roleKey)!;

  const STORAGE_KEY = `sv_remember_${roleKey}`;

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);

  // Kayıtlı bilgileri yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { email: e, password: p } = JSON.parse(saved);
        if (e) { setEmail(e); setRemember(true); }
        if (p) setPassword(p);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey]);

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
        } else if (res?.error === "YONETICI_YETKISIZ") {
          setError("Bu hesabın Yönetici Paneli yetkisi bulunmuyor. Lütfen sistem kartlarından birini kullanın.");
        } else if (res?.error === "SADECE_YONETICI_KARTI") {
          setError("Bu hesap sadece Yönetici Paneli kartından giriş yapabilir.");
        } else {
          setError("E-posta veya şifre hatalı.");
        }
        setLoading(false);
      } else {
        // Beni hatırla
        if (remember) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        if (gonulluRedirect) {
          window.location.href = "/api/gonullu/staff-giris";
        } else if (isYonetici) {
          router.push("/panel/admin");
          router.refresh();
        } else {
          router.push(redirectTo);
          router.refresh();
        }
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
            <div
              className="flex items-center rounded-xl transition"
              style={{ background: "#F8FAFC", border: "2px solid #CBD5E1" }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = role.color)}
              onBlurCapture={e  => (e.currentTarget.style.borderColor = "#CBD5E1")}
            >
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                autoComplete="email"
                className="flex-1 rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none"
                style={{ background: "transparent", border: "none", color: "#0F172A", minWidth: 0 }}
              />
              <svg className="flex-shrink-0 mr-3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div
              className="flex items-center rounded-xl transition"
              style={{ background: "#F8FAFC", border: "2px solid #CBD5E1" }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = role.color)}
              onBlurCapture={e  => (e.currentTarget.style.borderColor = "#CBD5E1")}
            >
              <input
                type={showPass ? "text" : "password"}
                required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="flex-1 rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none"
                style={{ background: "transparent", border: "none", color: "#0F172A", minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="flex-shrink-0 mr-3 text-[12px] font-bold transition hover:opacity-75"
                style={{ color: role.color }}
              >
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>

          {/* Beni hatırla */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setRemember(!remember)}
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition border-2"
              style={{
                background: remember ? role.color : "transparent",
                borderColor: remember ? role.color : "#CBD5E1",
              }}
            >
              {remember && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className="text-[13px] font-medium" style={{ color: "#64748B" }}>Beni hatırla</span>
          </label>

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

          {isYonetici ? (
            /* Yönetici kartı — sadece başvuru linki */
            <Link
              href="/kayit?sistem=yonetici"
              className="w-full flex items-center justify-center gap-2 border-2 rounded-xl py-3 text-[14px] font-bold transition hover:bg-amber-50"
              style={{ borderColor: role.color + "50", color: role.color }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Yönetici Olarak Başvur
            </Link>
          ) : (
            <>
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
                <Link href={`/kayit?sistem=${roleKey}`} className="font-bold hover:underline" style={{ color: role.color }}>
                  Başvuru Oluştur
                </Link>
              </p>
            </>
          )}
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
