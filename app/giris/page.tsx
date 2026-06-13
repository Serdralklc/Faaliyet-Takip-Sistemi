"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
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
    title: "Eğitim Birimi",
    sub:   "Eğitim Kadrosu",
    desc:  "İl / bölge eğitim sorumluları için faaliyet takip ve raporlama sistemi.",
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
  title: "Yönetim Merkezi",
  sub:   "Merkez Yönetimi",
  desc:  "TR Sorumlusu, Merkez Ekip ve Merkez Üniversite / Lise Gençlik Sorumluları için giriş ve başvuru.",
  color: "#92400E",
  bg:    "#FFFBF0",
  icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

/* SerGenç — gönüllü/üye sistemi (ayrı giriş akışı) */
const SERGENC_CARD = {
  key:   "sergenc" as const,
  href:  "/gonullu/giris",
  title: "SerGenç",
  sub:   "Üye / Gönüllü",
  desc:  "Öğrenci, gönüllü ve üyeler için başvuru ve giriş. Burs ve ev/yurt başvuruları buradan yapılır.",
  color: "#0891B2",
  bg:    "#fff",
  icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

/* Giriş menüsü — birim gruplarına ayrılmış */
const GRUPLAR = [
  { baslik: "Yönetim Merkezi", aciklama: "TR Sorumlusu · Merkez Ekip · Merkez Gençlik Sorumluları", kartlar: [YONETICI_CARD] },
  { baslik: "Eğitim Birimi",   aciklama: "Bölge / İl Eğitim Sorumlusu",                          kartlar: [ROLES.find(r => r.key === "egitimci")!] },
  { baslik: "Gençlik Birimi",  aciklama: "Bölge / İl Üniversite ve Lise Gençlik Sorumlusu",      kartlar: [ROLES.find(r => r.key === "universite")!, ROLES.find(r => r.key === "lise")!] },
  { baslik: "SerGenç",         aciklama: "Üye / Gönüllü başvuru ve giriş",                       kartlar: [SERGENC_CARD] },
];

/* Görevli Girişi — 4 kart (ana sayfadaki "Oturum Aç > Görevli Girişi" buraya yönlendirir) */
const GOREVLI_GRUBU = [
  {
    baslik: "",
    aciklama: "",
    kartlar: [
      YONETICI_CARD,
      ROLES.find(r => r.key === "egitimci")!,
      ROLES.find(r => r.key === "universite")!,
      ROLES.find(r => r.key === "lise")!,
    ],
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

/* ── Adım 1: Birim gruplarına ayrılmış giriş menüsü ── */
function RoleSelect({ groups, baslik, aciklama, genis, onSelect }: {
  groups: typeof GRUPLAR;
  baslik?: string;
  aciklama?: string;
  /** 4 kartı tek sırada göster (lg:4 sütun, daha geniş container) */
  genis?: boolean;
  onSelect: (r: RoleKey) => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center px-4 py-10">
      {/* Başlık */}
      <div className="text-center mb-8 max-w-md">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#EAF5EE", border: "1px solid #C6E6D5" }}>
            <img src="/logo.svg" alt="Serhendi" className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-[22px] font-black mb-2" style={{ color: "#0F172A", letterSpacing: "-0.02em" }}>
          {baslik ?? "Oturum Aç"}
        </h1>
        <p className="text-[14px] leading-[1.65]" style={{ color: "#64748B" }}>
          {aciklama ?? "Hangi birimden giriş yapmak veya başvurmak istediğinizi seçin."}
        </p>
      </div>

      {/* Birim grupları */}
      <div className={`w-full space-y-7 ${genis ? "max-w-6xl" : "max-w-5xl"}`}>
        {groups.map(grup => (
          <div key={grup.baslik}>
            {grup.baslik && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mb-3 px-1">
                <h2 className="text-[15px] font-black" style={{ color: "#0F172A", letterSpacing: "-0.01em" }}>{grup.baslik}</h2>
                <span className="text-[12px]" style={{ color: "#94A3B8" }}>{grup.aciklama}</span>
              </div>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${genis ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {grup.kartlar.map(card => (
                <RoleCard key={card.key} role={card} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleCard({ role, onSelect }: {
  role: { key: string; title: string; sub: string; desc: string; color: string; bg?: string; icon: React.ReactNode; href?: string };
  onSelect: (r: RoleKey) => void;
}) {
  const isYon = role.key === "yonetici";
  const cta = role.key === "sergenc" ? "Başvuru / Giriş" : isYon ? "Giriş / Başvuru" : "Giriş Yap";

  const ic = (
    <>
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
          <span className="text-[11px] font-bold" style={{ color: role.color }}>{cta}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={role.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </>
  );

  const cls = "group block text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]";
  const sty = { background: role.bg ?? "#fff", borderColor: "#E2E8F0" };
  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.borderColor = role.color + "60"),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.borderColor = "#E2E8F0"),
  };

  // SerGenç ayrı sayfaya gider; diğerleri giriş formunu açar
  return role.href ? (
    <Link href={role.href} className={cls} style={sty} {...hover}>{ic}</Link>
  ) : (
    <button onClick={() => onSelect(role.key as RoleKey)} className={`${cls} w-full`} style={sty} {...hover}>{ic}</button>
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

  // Aktif oturum: bu karta uygun bir hesapla zaten giriş yapılmışsa "devam et" sun
  const { data: session } = useSession();
  const su = session?.user;
  const ADMIN_ROLLERI = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  const aktifUygun = !!su && (
    isYonetici
      ? ADMIN_ROLLERI.includes(su.role)
      : su.sistem === SISTEM_MAP[roleKey] && (su.role === "IL_SORUMLUSU" || su.role === "BOLGE_SORUMLUSU")
  );
  const panelHref = su
    ? (ADMIN_ROLLERI.includes(su.role) ? "/panel/admin"
      : su.role === "BOLGE_SORUMLUSU" ? "/panel/bolge"
      : su.role === "IL_SORUMLUSU" ? "/panel/il" : "/")
    : "/";

  const STORAGE_KEY = `sv_remember_${roleKey}`;

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);

  // Kayıtlı e-postayı yükle (şifre güvenlik gereği asla saklanmaz)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { email: e, password: p } = JSON.parse(saved);
        if (e) { setEmail(e); setRemember(true); }
        // Eski sürümün sakladığı düz metin şifreyi kalıcı olarak temizle
        if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: e ?? "" }));
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
        // Beni hatırla — yalnızca e-posta saklanır (şifre uygulamada SAKLANMAZ)
        if (remember) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ email }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        // Şifreyi TARAYICININ şifre kasasına kaydet (Credential Management API).
        // Uygulama şifreyi tutmaz; tarayıcı saklar ve sonraki girişte e-posta +
        // şifreyi otomatik doldurur → tek tıkla giriş. Desteklemeyen tarayıcılarda
        // aşağıdaki tam-sayfa navigasyonu klasik "şifreyi kaydet?" önerisini tetikler.
        if (remember) {
          try {
            const W = window as unknown as { PasswordCredential?: new (d: { id: string; password: string; name?: string }) => Credential };
            if (W.PasswordCredential && navigator.credentials?.store) {
              const cred = new W.PasswordCredential({ id: email, password, name: email });
              await navigator.credentials.store(cred);
            }
          } catch { /* tarayıcı desteklemiyorsa yoksay */ }
        }
        // Tam sayfa navigasyonu (router.push değil) — tarayıcının
        // "şifreyi kaydet?" önerisini tetikler; sonraki girişlerde
        // e-posta + şifre otomatik dolar, tek tıkla giriş yapılır.
        if (gonulluRedirect) {
          window.location.href = "/api/gonullu/staff-giris";
        } else if (isYonetici) {
          window.location.href = "/panel/admin";
        } else {
          window.location.href = redirectTo;
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

        {/* Aktif oturum varsa: tek tıkla devam */}
        {aktifUygun && su && (
          <div className="px-7 pt-6">
            <div className="rounded-2xl border p-4" style={{ borderColor: role.color + "40", background: role.color + "0A" }}>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: role.color }}>Zaten giriş yaptınız</p>
              <p className="text-[15px] font-black mt-0.5" style={{ color: "#0F172A" }}>{su.ad} {su.soyad}</p>
              <button
                type="button"
                onClick={() => { window.location.href = panelHref; }}
                className="w-full mt-3 py-2.5 rounded-xl text-[14px] font-black text-white transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: role.color }}
              >
                Hesabıma Devam Et →
              </button>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
              <span className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>veya başka hesap</span>
              <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
            </div>
          </div>
        )}

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
                name="email"
                autoComplete="username"
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
                name="password"
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

          {/* Beni hatırla + Şifremi unuttum */}
          <div className="flex items-center justify-between gap-3">
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
          <Link
            href="/sifremi-unuttum?tip=yonetici"
            className="text-[12.5px] font-bold hover:underline flex-shrink-0"
            style={{ color: role.color }}
          >
            Şifremi unuttum
          </Link>
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
                className="w-full flex items-center justify-center gap-3 border-2 rounded-xl py-3 text-[14px] font-bold transition hover:bg-th"
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
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#F6F8F5" }} />}>
      <GirisInner />
    </Suspense>
  );
}

function GirisInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const grup         = searchParams.get("grup"); // yonetim | egitim | universite | lise | genclik | null

  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);

  // Ana sayfadaki "Oturum Aç" menüsünden gelen doğrudan yönlendirmeler:
  //  yonetim → Yönetim Merkezi, egitim → Eğitim Birimi, universite → Üniversite Gençlik,
  //  lise → Lise Gençlik formu doğrudan açılır.
  const directRole: RoleKey | null =
    grup === "yonetim" ? "yonetici" :
    grup === "egitim" ? "egitimci" :
    grup === "universite" ? "universite" :
    grup === "lise" ? "lise" :
    null;
  const isGenclik = grup === "genclik";

  // Gösterilecek form: doğrudan yönlendirme öncelikli, yoksa karttan seçilen
  const formRole = directRole ?? selectedRole;

  // Gençlik Birimi yönlendirmesinde yalnızca Üniversite + Lise kartları
  const genclikGrubu = GRUPLAR.filter(g => g.baslik === "Gençlik Birimi");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F6F8F5" }}
    >
      <TopBar />

      {formRole ? (
        <LoginForm
          roleKey={formRole}
          onBack={() => {
            // Doğrudan yönlendirme (yönetim/eğitim) → ana sayfaya dön; aksi halde kart seçimine
            if (directRole) router.push("/");
            else setSelectedRole(null);
          }}
        />
      ) : isGenclik ? (
        <RoleSelect
          groups={genclikGrubu}
          baslik="Gençlik Birimi"
          aciklama="Üniversite veya Lise Gençlik sisteminden giriş yapın."
          onSelect={setSelectedRole}
        />
      ) : (
        <RoleSelect
          groups={GOREVLI_GRUBU}
          baslik="Görevli Girişi"
          aciklama="Hangi birimden giriş yapmak veya başvurmak istediğinizi seçin."
          genis
          onSelect={setSelectedRole}
        />
      )}
    </div>
  );
}
