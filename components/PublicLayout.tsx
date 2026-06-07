"use client";

/**
 * Genel kurumsal sayfalar için paylaşılan layout:
 * Navbar (ana sayfayla aynı) + içerik alanı
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

const BRAND = { green: "#0B6B3A", greenDark: "#064E2A", gold: "#D4AF37" };

type Tokens = {
  bg: string; navbar: string; border: string;
  heading: string; body: string; muted: string;
  accent: string; accentText: string; gold: string;
  navLink: string; toggleBorder: string; toggleColor: string; toggleBg: string;
};

const LIGHT: Tokens = {
  bg: "#EDE9DF", navbar: "#FFFFFF", border: "#D4C9B0",
  heading: "#0A3520", body: "#1C5232", muted: "#38694E",
  accent: BRAND.green, accentText: BRAND.gold, gold: BRAND.gold,
  navLink: "#1C5232", toggleBorder: "#C8BFA8", toggleColor: "#1C5232", toggleBg: "rgba(255,255,255,0.60)",
};
const DARK: Tokens = {
  bg: "#081C15", navbar: "#10271F", border: "#1F3D31",
  heading: "#F5F0E8", body: "#E8E2D6", muted: "#B8B0A0",
  accent: "#22C55E", accentText: BRAND.gold, gold: BRAND.gold,
  navLink: "#E8E2D6", toggleBorder: "rgba(255,255,255,0.15)", toggleColor: "#E8E2D6", toggleBg: "rgba(255,255,255,0.06)",
};

function useTokens(): Tokens {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return LIGHT;
  return resolvedTheme === "dark" ? DARK : LIGHT;
}

function ThemeBtn({ t }: { t: Tokens }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-xl transition hover:opacity-80 active:scale-95"
      style={{ border: `1px solid ${t.toggleBorder}`, color: t.toggleColor, background: t.toggleBg }}
    >
      {dark
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  );
}

const NAV_LINKS = [
  { href: "/hakkimizda",  label: "Hakkımızda"  },
  { href: "/faaliyetler", label: "Faaliyetler"  },
  { href: "/projeler",    label: "Projeler"     },
  { href: "/iletisim",    label: "İletişim"     },
  { href: "/bagis",       label: "Bağış Yap"    },
];

function Navbar() {
  const t = useTokens();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) setLoginOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: t.navbar, borderColor: t.border, boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-[66px] flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 group">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition group-hover:shadow-md"
            style={{ background: "#FFFFFF", border: "1px solid #D0E8DA", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EAF5EE" }}>
              <img src="/logo.svg" alt="Serhendi" className="w-[17px] h-[17px]" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-[12.5px] font-bold" style={{ color: "#064E2A" }}>Serhendi Gençlik</p>
              <p className="text-[10px] mt-0.5"      style={{ color: "#4A7A5A" }}>Vakfı Eğitim Birimi</p>
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-[13.5px] font-semibold rounded-lg transition hover:opacity-70"
              style={{ color: t.navLink }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Sağ */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0" ref={loginRef}>
          <ThemeBtn t={t} />
          <div className="relative">
            <button
              onClick={() => setLoginOpen(v => !v)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-black rounded-xl transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: BRAND.green, color: BRAND.gold }}
            >
              Oturum Aç
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d={loginOpen ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke={BRAND.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {loginOpen && (
              <div
                className="absolute top-[calc(100%+10px)] right-0 w-[272px] rounded-2xl border overflow-hidden shadow-2xl"
                style={{ background: t.navbar, borderColor: t.border }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: t.border }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.muted }}>Giriş Türü</p>
                </div>
                <Link
                  href="/giris"
                  onClick={() => setLoginOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-4 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = LIGHT.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5EE" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: t.heading }}>Görevli Girişi</p>
                    <p className="text-[12px] mt-0.5"   style={{ color: t.muted   }}>İl / Bölge Sorumlusu, Yönetici</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3.5 px-4 py-4 border-t" style={{ borderColor: t.border, opacity: 0.45 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FEF9E7" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold" style={{ color: t.heading }}>Gönüllü Girişi</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>Yakında</span>
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: t.muted }}>Gönüllü katılımcılar</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobil */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeBtn t={t} />
          <button onClick={() => setMenuOpen(v => !v)} className="p-2 rounded-lg" style={{ color: t.navLink }}>
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            }
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden px-5 py-5 border-t" style={{ background: t.navbar, borderColor: t.border }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block py-3.5 text-[14px] font-semibold border-b last:border-0"
              style={{ color: t.body, borderColor: t.border }}>
              {l.label}
            </Link>
          ))}
          <div className="pt-4">
            <Link href="/giris" className="block w-full py-3 text-center text-[14px] font-black rounded-xl"
              style={{ background: BRAND.green, color: BRAND.gold }}>
              Görevli Girişi
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = useTokens();
  return (
    <div style={{ minHeight: "100dvh", background: t.bg }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
