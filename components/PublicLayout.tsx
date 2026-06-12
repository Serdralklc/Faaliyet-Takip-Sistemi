"use client";

/**
 * Genel kurumsal sayfalar için paylaşılan layout.
 * Tema: lib/theme.ts TOKENS (CSS değişkeni referansları) — tek kaynak.
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { BRAND, useTokens } from "@/lib/theme";

export function ThemeBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" aria-hidden="true" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="w-9 h-9 flex items-center justify-center rounded-xl transition hover:opacity-80 active:scale-95"
      style={{ background: "var(--toggle-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
    >
      {dark
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
      }
    </button>
  );
}

export const NAV_LINKS = [
  { href: "/hakkimizda",  label: "Hakkımızda"  },
  { href: "/faaliyetler", label: "Faaliyetler"  },
  { href: "/projeler",    label: "Projeler"     },
  { href: "/iletisim",    label: "İletişim"     },
  { href: "/bagis",       label: "Bağış Yap"    },
];

/** Oturum Aç açılır menüsü — Görevli / Gönüllü girişleri */
export function LoginDropdown() {
  const t = useTokens();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-black rounded-xl transition hover:opacity-90 active:scale-[0.98]"
        style={{ background: BRAND.green, color: "#FFFFFF" }}
      >
        Oturum Aç
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d={open ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+10px)] right-0 w-[272px] rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: t.dropBg, border: "1px solid var(--border)" }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: t.border }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.muted }}>Giriş Türü</p>
          </div>
          <Link
            href="/giris"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-[var(--bg-subtle)]"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg-active)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: t.heading }}>Görevli Girişi</p>
              <p className="text-[12px] mt-0.5"    style={{ color: t.muted   }}>İl / Bölge Sorumlusu, Yönetici</p>
            </div>
          </Link>
          <Link
            href="/gonullu/giris"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3.5 px-4 py-4 border-t transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ borderColor: t.border }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--gold-light)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: t.heading }}>Gönüllü Girişi</p>
              <p className="text-[12px] mt-0.5" style={{ color: t.muted }}>Gönüllü katılımcılar</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

/** Logo kartı — her iki temada beyaz kalır (marka görünürlüğü) */
export function LogoCard() {
  return (
    <Link href="/" className="flex-shrink-0 group">
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group-hover:shadow-md"
        style={{
          background: "#FFFFFF",
          border:     "1px solid #D1E8DA",
          boxShadow:  "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EBF5EF" }}>
          <img src="/logo.svg" alt="" className="w-[17px] h-[17px]" />
        </div>
        <div className="hidden sm:block leading-none">
          <p className="text-[12.5px] font-bold" style={{ color: "#064E2A" }}>Serhendi Gençlik</p>
          <p className="text-[10px] mt-[3px]"    style={{ color: "#5A7A68" }}>Serhendi Vakfı - Eğitim Birimi</p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Ortak public navbar — PublicLayout ve ana sayfa (HomePage) tarafından kullanılır.
 * transparentAtTop: sayfa en üstteyken şeffaf, kaydırınca dolgun (hero üstü kullanım).
 */
export function PublicNavbar({ transparentAtTop = false }: { transparentAtTop?: boolean }) {
  const t = useTokens();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparentAtTop) return;
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [transparentAtTop]);

  const solid = !transparentAtTop || scrolled || menuOpen;

  return (
    <nav
      className={transparentAtTop
        ? "fixed top-0 inset-x-0 z-50 transition-all duration-200"
        : "sticky top-0 z-50 border-b"}
      style={transparentAtTop
        ? {
            background:     solid ? t.navbar : "transparent",
            boxShadow:      solid ? `0 1px 0 ${t.border}` : "none",
            backdropFilter: solid ? "blur(20px)" : "none",
          }
        : { background: t.navbar, borderColor: t.border, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-[66px] flex items-center justify-between gap-6">
        <LogoCard />

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-colors hover:text-[var(--nav-link-hover)]"
              style={{ color: t.navLink }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop sağ */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <ThemeBtn />
          <LoginDropdown />
        </div>

        {/* Mobil */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeBtn />
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
            className="p-2 rounded-lg"
            style={{ color: t.navLink }}
          >
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
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3.5 text-[14px] font-semibold border-b last:border-0"
              style={{ color: t.body, borderColor: t.borderSubtle }}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-4">
            <Link href="/giris" className="block w-full py-3 text-center text-[14px] font-black rounded-xl"
              style={{ background: BRAND.green, color: "#FFFFFF" }}>
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
      <PublicNavbar />
      <main>{children}</main>
    </div>
  );
}
