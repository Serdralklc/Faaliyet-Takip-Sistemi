"use client";

/**
 * Design read: Turkish Islamic youth foundation — educational gravity, not tech startup.
 * Archetype: Soft Structuralism (institutional, editorial, trust-forward)
 * DESIGN_VARIANCE: 5  |  MOTION_INTENSITY: 3  |  VISUAL_DENSITY: 4
 * Font: Geist (via CSS var, already loaded in layout)
 * Color: Forest green + warm gold — ONE accent, locked across page
 * Dark mode: full token swap, CSS-variable strategy via useTheme
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

/* ════════════════════════════════════════
   TOKEN SYSTEM — light / dark
════════════════════════════════════════ */
type Tokens = {
  bg: string; surface: string; surfaceAlt: string; border: string; borderSubtle: string;
  heading: string; body: string; muted: string; accent: string; accentText: string;
  gold: string; goldBg: string; heroText: string; heroSub: string; heroBody: string;
  heroBg: string; heroSurface: string; heroBorder: string; statsBg: string; statsText: string;
  statsMuted: string; footerBg: string; footerHeading: string; footerText: string;
};

const LIGHT: Tokens = {
  bg:            "#F5F7F3",
  surface:       "#FFFFFF",
  surfaceAlt:    "#EEF2EC",
  border:        "#D0D9CF",
  borderSubtle:  "#E6EDE5",
  heading:       "#0B1F14",
  body:          "#354940",
  muted:         "#60796A",
  accent:        "#006B3F",
  accentText:    "#FFFFFF",
  gold:          "#C9A227",
  goldBg:        "#FBF5DC",
  heroText:      "#FFFFFF",
  heroSub:       "#B8D4C0",
  heroBody:      "#7EA98F",
  heroBg:        "#002E1A",
  heroSurface:   "#003D24",
  heroBorder:    "#1A3D28",
  statsBg:       "#0A1A10",
  statsText:     "#FFFFFF",
  statsMuted:    "#5A8066",
  footerBg:      "#080F0A",
  footerHeading: "#C8DDD0",
  footerText:    "#4E7057",
} as const;

const DARK: Tokens = {
  bg:            "#080F0A",
  surface:       "#0F1A12",
  surfaceAlt:    "#162019",
  border:        "#1E2E22",
  borderSubtle:  "#243328",
  heading:       "#EBF2EC",
  body:          "#7DAB88",
  muted:         "#4D6B56",
  accent:        "#00A85E",
  accentText:    "#FFFFFF",
  gold:          "#D4AC30",
  goldBg:        "#1E1A00",
  heroText:      "#FFFFFF",
  heroSub:       "#A8C8B4",
  heroBody:      "#6B9478",
  heroBg:        "#020806",
  heroSurface:   "#0A1A10",
  heroBorder:    "#152A1C",
  statsBg:       "#000000",
  statsText:     "#FFFFFF",
  statsMuted:    "#3A5C42",
  footerBg:      "#000000",
  footerHeading: "#B8D0BC",
  footerText:    "#3A5C42",
} as const;



function useTokens(): Tokens {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return LIGHT;
  return resolvedTheme === "dark" ? DARK : LIGHT;
}

/* ════════════════════════════════════════
   THEME TOGGLE (reusable)
════════════════════════════════════════ */
function ThemeBtn({ style }: { style?: React.CSSProperties }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="w-9 h-9 flex items-center justify-center rounded-md transition-all active:scale-95"
      style={style}
    >
      {dark
        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  );
}

/* ════════════════════════════════════════
   NAV
════════════════════════════════════════ */
function Nav() {
  const t = useTokens();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node))
        setLoginOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const links = [
    { href: "#hakkimizda",  l: "Hakkımızda"  },
    { href: "#faaliyetler", l: "Faaliyetler"  },
    { href: "#projeler",    l: "Projeler"     },
    { href: "#iletisim",    l: "İletişim"     },
  ];

  /* Kaydırılmadıysa hero'nun üzerindeyiz (koyu bg), kaydırıldıysa açık/koyu tema yüzeyinde */
  const navBg     = scrolled ? t.surface  : "transparent";
  const navBorder = scrolled ? t.border   : "transparent";
  const navShadow = scrolled ? "0 1px 0 rgba(0,0,0,0.06)" : "none";
  const linkColor = scrolled ? t.body     : LIGHT.heroSub;

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{ background: navBg, borderBottom: `1px solid ${navBorder}`, boxShadow: navShadow, backdropFilter: scrolled ? "blur(16px)" : "none" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-[64px] flex items-center justify-between gap-4">

        {/* Logo — beyaz kart, scroll-bağımsız net görünür */}
        <a href="#" className="flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "#FFFFFF", border: "1px solid #D8E8DD" }}>
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "#E8F5EE" }}>
              <img src="/logo.svg" alt="Serhendi" className="w-[18px] h-[18px]" />
            </div>
            <div className="hidden sm:block pr-0.5">
              <p className="text-[12.5px] font-bold leading-tight" style={{ color: "#004D2D" }}>Serhendi Gençlik</p>
              <p className="text-[10px] leading-tight" style={{ color: "#60796A" }}>Vakfı Eğitim Birimi</p>
            </div>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 text-[13.5px] font-medium rounded-md transition-colors hover:opacity-100"
              style={{ color: linkColor }}>
              {l.l}
            </a>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0" ref={loginRef}>
          <ThemeBtn style={{
            color:       scrolled ? t.body   : LIGHT.heroSub,
            border:      `1px solid ${scrolled ? t.border : "#2E5C3E"}`,
            background:  scrolled ? t.surface : "transparent",
          }} />
          <a href="#bagis"
            className="px-4 py-2 text-[13px] font-semibold rounded-md border transition hover:opacity-80"
            style={{ color: scrolled ? t.body : LIGHT.heroSub, borderColor: scrolled ? t.border : "#2E5C3E" }}>
            Bağış Yap
          </a>
          <div className="relative">
            <button onClick={() => setLoginOpen(v => !v)}
              className="px-5 py-2 text-[13px] font-bold rounded-md text-white flex items-center gap-1.5 transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: t.accent }}>
              Oturum Aç
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d={loginOpen ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {loginOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-[268px] rounded-xl border shadow-2xl overflow-hidden"
                style={{ background: t.surface, borderColor: t.border }}>
                <div className="px-4 py-2.5 border-b" style={{ borderColor: t.borderSubtle }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.muted }}>Giriş Türü</p>
                </div>
                <Link href="/giris" onClick={() => setLoginOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.surfaceAlt)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5EE" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={LIGHT.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: t.heading }}>Görevli Girişi</p>
                    <p className="text-xs mt-0.5" style={{ color: t.muted }}>İl / Bölge Sorumlusu, Yönetici</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 px-4 py-4 border-t" style={{ borderColor: t.borderSubtle, opacity: 0.5 }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FEF3C7" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold" style={{ color: t.heading }}>Gönüllü Girişi</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>Yakında</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: t.muted }}>Gönüllü katılımcılar</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeBtn style={{
            color: scrolled ? t.body : LIGHT.heroSub,
            border: `1px solid ${scrolled ? t.border : "#2E5C3E"}`,
            background: scrolled ? t.surface : "transparent",
          }} />
          <button className="p-2 rounded-md transition" onClick={() => setMenuOpen(v => !v)}
            style={{ color: scrolled ? t.heading : LIGHT.heroText }}>
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden px-5 py-5 border-t" style={{ background: t.surface, borderColor: t.border }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block py-3.5 text-[14px] font-medium border-b last:border-0"
              style={{ color: t.body, borderColor: t.borderSubtle }}>
              {l.l}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-2.5">
            <Link href="/giris" className="py-3 text-center text-[14px] font-bold rounded-md text-white active:scale-[0.98] transition"
              style={{ background: t.accent }}>
              Görevli Girişi
            </Link>
            <a href="#bagis" className="py-3 text-center text-[14px] font-semibold rounded-md border transition"
              style={{ borderColor: t.border, color: t.body }}>
              Bağış Yap
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ════════════════════════════════════════
   HERO — min-h-[100dvh], sol metin / sag gorsel
════════════════════════════════════════ */
function Hero() {
  return (
    <section id="anasayfa" className="min-h-[100dvh] flex items-center pt-[64px]"
      style={{ background: LIGHT.heroBg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 w-full py-16 lg:py-0 min-h-[calc(100dvh-64px)] flex items-center">
        <div className="w-full grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-10 lg:gap-16 items-center">

          {/* Sol */}
          <div>
            <div className="flex items-center gap-3 mb-7">
              <span className="w-6 h-[1.5px] flex-shrink-0" style={{ background: LIGHT.gold }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: LIGHT.gold }}>
                Serhendi Vakfı Eğitim Birimi
              </span>
            </div>

            <h1 className="font-black leading-[1.04] mb-6"
              style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.2rem)", color: LIGHT.heroText, letterSpacing: "-0.028em" }}>
              İlim, Ahlak<br />
              ve Hizmet<br />
              <span style={{ color: LIGHT.gold }}>Yolunda.</span>
            </h1>

            <p className="text-[16px] leading-[1.75] mb-10 max-w-[440px]"
              style={{ color: LIGHT.heroSub }}>
              İlkogretimden universite sonrasina kadar her kademedeki gencin
              ilmi, ahlaki ve manevi gelisimine katki saglayan, Turkiye'nin
              81 ilinde faaliyet gosteren bir egitim ve genclik hareketi.
            </p>

            <div className="flex flex-wrap gap-3 mb-14">
              <a href="#hakkimizda"
                className="px-7 py-3 text-[14px] font-bold text-white rounded-md transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: LIGHT.accent }}>
                Hakkimizda
              </a>
              <a href="#faaliyetler"
                className="px-7 py-3 text-[14px] font-semibold rounded-md transition hover:opacity-80 active:scale-[0.98]"
                style={{ color: LIGHT.heroSub, border: "1px solid #2E5C3E" }}>
                Faaliyetlerimiz
              </a>
            </div>

            <div className="flex items-start gap-10 pt-8 border-t" style={{ borderColor: "#142A1C" }}>
              {[
                { n: "81",   l: "Il"           },
                { n: "500+", l: "Gonullu"      },
                { n: "12+",  l: "Yil Tecrube"  },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-[2rem] font-black leading-none" style={{ color: LIGHT.heroText, letterSpacing: "-0.04em" }}>{s.n}</p>
                  <p className="text-[12px] font-medium mt-1.5" style={{ color: LIGHT.heroBody }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sag: gercek gorsel */}
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-lg"
              style={{ aspectRatio: "3/4", border: `1px solid ${LIGHT.heroBorder}` }}>
              {/* Picsum — youth/nature/education seed */}
              <img
                src="https://picsum.photos/seed/greenpark42/600/800"
                alt="Serhendi Genclik Faaliyeti"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.80) saturate(0.85)" }}
              />
              {/* Alt bilgi overlay */}
              <div className="absolute bottom-0 inset-x-0 px-5 py-5"
                style={{ background: "linear-gradient(to top, rgba(0,12,6,0.90) 0%, transparent 100%)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIGHT.gold }} />
                  <p className="text-[13px] font-bold" style={{ color: "#fff" }}>2024-2025 Faaliyet Donemi</p>
                </div>
                <p className="text-[12px]" style={{ color: LIGHT.heroBody }}>
                  Turkiye genelinde 81 ilde es zamanli faaliyetler
                </p>
              </div>
            </div>
            {/* Dekor */}
            <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-md -z-10"
              style={{ background: LIGHT.gold, opacity: 0.20 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   STATS BAR
════════════════════════════════════════ */
function StatsBar() {
  const t = useTokens();
  const stats = [
    { n: "81",    l: "İlde Aktif Yapılanma"         },
    { n: "500+",  l: "Aktif Gönüllü"                 },
    { n: "10.000+", l: "Öğrenciye Ulaşıldı"          },
    { n: "12+",   l: "Yıllık Tecrübe"                },
  ];
  return (
    <div style={{ background: t.statsBg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: t.statsMuted }}>
          {stats.map((s, i) => (
            <div key={i} className="px-6 lg:px-10 py-8 text-center" style={{ background: t.statsBg }}>
              <p className="text-[2.2rem] font-black leading-none mb-2"
                style={{ color: t.statsText, letterSpacing: "-0.04em" }}>{s.n}</p>
              <p className="text-[12px] font-medium" style={{ color: t.statsMuted }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   HAKKIMIZDA
════════════════════════════════════════ */
function Hakkimizda() {
  const t = useTokens();
  const items = [
    { n: "01", t: "Kuran-ı Kerim Eğitimi",     d: "Elif-Ba'dan başlayarak her seviyede nitelikli haftalık kurslar." },
    { n: "02", t: "İlim Halkaları",             d: "Lise ve üniversite öğrencilerine sistematik ders programları."  },
    { n: "03", t: "Kafile Programları",         d: "Gençleri buluşturan manevi seyahatler ve sosyal etkinlikler."   },
    { n: "04", t: "Barınma ve Burs Desteği",    d: "Güvenli barınma ve Nezir Bursu ile kesintisiz eğitim desteği."  },
  ];

  return (
    <section id="hakkimizda" style={{ background: t.bg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-start">

          <div>
            <h2 className="font-black leading-[1.06] mb-8"
              style={{ fontSize: "clamp(2rem, 3.8vw, 2.9rem)", color: t.heading, letterSpacing: "-0.028em" }}>
              Gençliğe Değer,<br />Geleceğe Yatırım
            </h2>
            <p className="text-[15px] leading-[1.8] mb-5" style={{ color: t.body }}>
              Serhendi Vakfı bünyesindeki Gençlik Eğitim Birimi olarak 12 yılı aşkın
              tecrübemizle Türkiye'nin her köşesinde ilköğretimden üniversiteye kadar
              gençleri kucaklayan kapsamlı programlar yürütüyoruz.
            </p>
            <p className="text-[15px] leading-[1.8] mb-10" style={{ color: t.body }}>
              Amacımız yalnızca bilgi aktarmak değil; güçlü karakter, derin inanç
              ve toplumsal sorumluluk taşıyan nesiller yetiştirmektir.
            </p>
            <a href="#faaliyetler"
              className="inline-flex items-center gap-2 text-[14px] font-bold transition hover:gap-3"
              style={{ color: t.accent }}>
              Faaliyetlerimizi İnceleyin
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}` }}>
            {items.map(it => (
              <div key={it.n} className="flex items-start gap-4 py-6 border-b"
                style={{ borderColor: t.borderSubtle }}>
                <span className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                  style={{ background: t.surfaceAlt, color: t.accent }}>
                  {it.n}
                </span>
                <div>
                  <p className="font-bold text-[15px] mb-1.5" style={{ color: t.heading }}>{it.t}</p>
                  <p className="text-[14px] leading-[1.65]" style={{ color: t.body }}>{it.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   FAALİYETLER — asimetrik layout
════════════════════════════════════════ */
function Faaliyetler() {
  const t = useTokens();

  const birimler = [
    {
      n: "01", r: LIGHT.accent,
      t: "İlköğretim Birimi",
      d: "Elif-Ba'dan Kur'an-ı Kerim'e uzanan yolda çocuklara haftalık eğitim kursları. Deneyimli eğitmen kadrosu, sistematik program.",
      img: "https://picsum.photos/seed/classroom88/600/400",
    },
    {
      n: "02", r: "#0F5FA0",
      t: "Lise Birimi",
      d: "Sabah namazı buluşmaları, ilim dersleri ve kafile programlarıyla lise gençliğine kapsamlı destek.",
      img: "https://picsum.photos/seed/students22/600/400",
    },
    {
      n: "03", r: "#5B21B6",
      t: "Üniversite Birimi",
      d: "KYK buluşmaları, dergah programları ve ilim halkaları ile üniversite öğrencilerine derinlikli topluluk ortamı.",
      img: "https://picsum.photos/seed/library55/600/400",
    },
    {
      n: "04", r: "#92400E",
      t: "Barınma Hizmetleri",
      d: "Öğrenci evleri, apart ve yurtlarda şeffaf yönetim. Güvenli, değerli ve sistematik takip edilen barınma ortamları.",
      img: "https://picsum.photos/seed/building33/600/400",
    },
  ];

  const ek = ["Sabah Namazı Buluşmaları","Kafile Programları","Sosyal Faaliyetler","Nezir Burs Programı","KYK Buluşmaları","Eğitim Materyalleri"];

  return (
    <section id="faaliyetler" style={{ background: t.surface }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-28">
        <div className="mb-16 max-w-2xl">
          <h2 className="font-black leading-[1.06] mb-5"
            style={{ fontSize: "clamp(2rem, 3.8vw, 2.9rem)", color: t.heading, letterSpacing: "-0.028em" }}>
            Geniş Bir Hizmet Yelpazesi
          </h2>
          <p className="text-[15px] leading-[1.75]" style={{ color: t.body }}>
            İlköğretimden üniversiteye, barınmadan burs programlarına kadar gençliğin
            her ihtiyacına yanıt veren sistematik ve kararlı bir hizmet anlayışı.
          </p>
        </div>

        {/* Asimetrik grid: büyük + iki küçük */}
        <div className="grid lg:grid-cols-2 gap-px mb-px" style={{ background: t.border }}>
          {/* Sol büyük kart */}
          <div className="flex flex-col" style={{ background: t.surface }}>
            <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img src={birimler[0].img} alt={birimler[0].t}
                className="w-full h-full object-cover transition duration-700 hover:scale-[1.03]"
                style={{ filter: "saturate(0.75)" }} />
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: birimler[0].r }}>{birimler[0].n}</span>
                <span className="flex-1 h-px" style={{ background: t.borderSubtle }} />
              </div>
              <h3 className="font-black text-[1.2rem] mb-3" style={{ color: t.heading, letterSpacing: "-0.015em" }}>{birimler[0].t}</h3>
              <p className="text-[14px] leading-[1.65] flex-1" style={{ color: t.body }}>{birimler[0].d}</p>
              <div className="w-8 h-[3px] mt-6" style={{ background: birimler[0].r }} />
            </div>
          </div>

          {/* Sag 2 küçük kart dikey */}
          <div className="flex flex-col gap-px" style={{ background: t.border }}>
            {birimler.slice(1).map(b => (
              <div key={b.n} className="flex gap-0 flex-1" style={{ background: t.surface }}>
                <div className="w-[120px] flex-shrink-0 overflow-hidden">
                  <img src={b.img} alt={b.t}
                    className="w-full h-full object-cover transition duration-700 hover:scale-[1.05]"
                    style={{ filter: "saturate(0.7)" }} />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: b.r }}>{b.n}</span>
                  </div>
                  <h3 className="font-black text-[1rem] mb-2" style={{ color: t.heading }}>{b.t}</h3>
                  <p className="text-[13px] leading-[1.6] flex-1" style={{ color: t.body }}>{b.d}</p>
                  <div className="w-6 h-[2px] mt-4" style={{ background: b.r }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ek etiket listesi */}
        <div className="mt-9 flex flex-wrap gap-2">
          {ek.map(e => (
            <span key={e} className="px-4 py-2 text-[13px] font-medium rounded-md border"
              style={{ background: t.bg, borderColor: t.border, color: t.body }}>
              {e}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   PROJELER
════════════════════════════════════════ */
function Projeler() {
  const t = useTokens();
  const projeler = [
    { n: "01", title: "Nesil Yetiştirilmesi",  d: "İlköğretimden üniversiteye sistematik eğitim programı. Türkiye geneli kapsam.",     r: t.accent,    durum: "Devam Ediyor" },
    { n: "02", title: "Öğrenci Barınma Ağı",   d: "Üniversite öğrencileri için değer odaklı güvenli barınma ortamları ve takip.",      r: "#5B21B6",    durum: "Devam Ediyor" },
    { n: "03", title: "Nezir Burs Programı",   d: "İhtiyaç sahibi öğrencilere burs desteği ile eğitimde fırsat eşitliği.",            r: t.gold,       durum: "Devam Ediyor" },
  ];

  return (
    <section id="projeler" style={{ background: t.bg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-28">
        <div className="mb-14">
          <h2 className="font-black leading-[1.06]"
            style={{ fontSize: "clamp(2rem, 3.8vw, 2.9rem)", color: t.heading, letterSpacing: "-0.028em" }}>
            Uzun Vadeli Projelerimiz
          </h2>
        </div>

        <div style={{ borderTop: `1px solid ${t.border}` }}>
          {projeler.map(p => (
            <div key={p.n}
              className="grid grid-cols-12 gap-4 py-8 border-b items-start px-1 transition-colors"
              style={{ borderColor: t.borderSubtle }}
              onMouseEnter={e => (e.currentTarget.style.background = t.surfaceAlt)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div className="col-span-1 hidden sm:block pt-1">
                <span className="text-[11px] font-black" style={{ color: t.border }}>{p.n}</span>
              </div>
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <p className="font-bold text-[15px]" style={{ color: t.heading }}>{p.title}</p>
              </div>
              <div className="col-span-12 sm:col-span-5 lg:col-span-6">
                <p className="text-[14px] leading-[1.65]" style={{ color: t.body }}>{p.d}</p>
              </div>
              <div className="col-span-12 sm:col-span-2 flex sm:justify-end">
                <span className="text-[12px] font-bold px-2.5 py-1 rounded"
                  style={{ background: p.r + "20", color: p.r }}>
                  {p.durum}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   CTA
════════════════════════════════════════ */
function Cta() {
  const t = useTokens();
  return (
    <section id="gonullu" style={{ background: t.heroBg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="flex items-center gap-3 mb-7">
              <span className="w-6 h-[1.5px] flex-shrink-0" style={{ background: LIGHT.gold }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: LIGHT.gold }}>Katılım</span>
            </div>
            <h2 className="font-black leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2rem, 3.8vw, 3rem)", color: LIGHT.heroText, letterSpacing: "-0.028em" }}>
              Faaliyetlerimizden<br />Haberdar Olun.
            </h2>
            <p className="text-[15px] leading-[1.8] mb-10" style={{ color: LIGHT.heroSub }}>
              Eğitim programları, gençlik çalışmaları ve faaliyet haberlerini
              takip etmek için gönüllü topluluğumuza katılabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-8 py-3 text-[14px] font-bold rounded-md transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: LIGHT.gold, color: "#1a0a00" }}>
                Gönüllü Ol
              </button>
              <a href="#iletisim"
                className="px-8 py-3 text-[14px] font-semibold rounded-md border transition hover:opacity-80"
                style={{ color: LIGHT.heroSub, borderColor: "#2E5C3E" }}>
                İletişime Geç
              </a>
            </div>
          </div>

          <div className="hidden lg:block space-y-3">
            {[
              "Türkiye genelinde 81 ilde aktif yapılanma",
              "Haftalık Kuran-ı Kerim ve ilim dersleri",
              "Sabah namazı buluşmaları ve kafile programları",
              "Öğrenci barınma ve Nezir burs desteği",
            ].map(m => (
              <div key={m} className="flex items-start gap-3 px-5 py-4 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #152A1C" }}>
                <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 8l4 4 7-7" stroke={LIGHT.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[14px] font-medium" style={{ color: LIGHT.heroSub }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   BAGIS
════════════════════════════════════════ */
function Bagis() {
  const t = useTokens();
  return (
    <section id="bagis" style={{ background: t.surface }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="font-black leading-[1.06] mb-4"
              style={{ fontSize: "clamp(1.9rem, 3.2vw, 2.5rem)", color: t.heading, letterSpacing: "-0.025em" }}>
              Geleceğe Yatırım Yapın
            </h2>
            <p className="text-[15px] leading-[1.8] mb-8" style={{ color: t.body }}>
              Bağışlarınız öğrenci bursları, dergah faaliyetleri ve eğitim
              programlarının sürdürülmesine doğrudan katkı sağlar.
            </p>
            <button className="px-8 py-3 text-[14px] font-bold rounded-md text-white transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: t.accent }}>
              Bağış Yap
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Öğrenci Bursu",    s: "Eğitime kesintisiz devam"      },
              { l: "Dergah Desteği",   s: "Faaliyetlerin sürdürülmesi"    },
              { l: "Kafile Programı",  s: "Manevi seyahat desteği"        },
              { l: "Kitap & Materyal", s: "Eğitim kaynaklarının temini"   },
            ].map(b => (
              <div key={b.l} className="p-5 rounded-md border"
                style={{ background: t.bg, borderColor: t.borderSubtle }}>
                <p className="font-bold text-[14px] mb-1" style={{ color: t.heading }}>{b.l}</p>
                <p className="text-[13px] leading-[1.5]" style={{ color: t.body }}>{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   FOOTER
════════════════════════════════════════ */
function Footer() {
  const t = useTokens();
  return (
    <footer id="iletisim" style={{ background: t.footerBg }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src="/logo.svg" alt="" className="w-4 h-4 brightness-0 invert" style={{ opacity: 0.5 }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: t.footerHeading }}>Serhendi Gençlik</p>
                <p className="text-[11px]" style={{ color: t.footerText }}>Serhendi Vakfı Eğitim Birimi</p>
              </div>
            </div>
            <p className="text-[13px] leading-[1.75] max-w-xs" style={{ color: t.footerText }}>
              İlim, ahlak ve hizmet yolunda yürüyen Serhendi Gençlik, Türkiye'nin
              dört bir yanında nesil yetiştirme misyonunu sürdürmektedir.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: t.footerHeading }}>Erişim</p>
            <div className="space-y-3">
              {[
                ["#hakkimizda","Hakkımızda"],["#faaliyetler","Faaliyetlerimiz"],
                ["#projeler","Projelerimiz"],["#gonullu","Gönüllü Ol"],
                ["#bagis","Bağış Yap"],["/giris","Görevli Girişi"],
              ].map(([h,l]) => (
                <a key={l} href={h} className="block text-[13px] transition hover:text-white" style={{ color: t.footerText }}>{l}</a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: t.footerHeading }}>İletişim</p>
            <div className="space-y-3">
              <p className="text-[13px]" style={{ color: t.footerText }}>iletisim@serhendi.com</p>
              <p className="text-[13px]" style={{ color: t.footerText }}>Türkiye Geneli, 81 İl</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px]" style={{ color: t.muted }}>
            © {new Date().getFullYear()} Serhendi Vakfı Eğitim Birimi. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-5">
            {["Gizlilik","Kullanım Şartları"].map(l => (
              <a key={l} href="#" className="text-[12px] transition hover:text-white" style={{ color: t.muted }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════
   EXPORT
════════════════════════════════════════ */
export function HomePage() {
  return (
    <div>
      <Nav />
      <Hero />
      <StatsBar />
      <Hakkimizda />
      <Faaliyetler />
      <Projeler />
      <Cta />
      <Bagis />
      <Footer />
    </div>
  );
}
