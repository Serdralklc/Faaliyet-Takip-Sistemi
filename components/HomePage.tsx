"use client";

/**
 * Serhendi Gençlik — Kurumsal Ana Sayfa
 * Tema sistemi:
 *   AÇIK  → krem zemin + koyu orman yeşili metin + altın buton yazıları
 *   KOYU  → koyu antrasit-yeşil zemin + fildişi metin + altın buton yazıları
 * Her iki temada marka rengi (#0B6B3A) ve altın (#D4AF37) korunur.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

/* ═══════════════════════════════════════════
   MARKA SABİTLERİ
═══════════════════════════════════════════ */
const BRAND = {
  green:     "#0B6B3A",
  greenDark: "#064E2A",
  gold:      "#D4AF37",
  goldDim:   "#B8941E",
};

/* ═══════════════════════════════════════════
   TOKEN TİPİ
═══════════════════════════════════════════ */
type Tokens = {
  /* Zemin katmanları */
  bg: string; surface: string; card: string; navbar: string;
  /* Kenarlık */
  border: string; borderSubtle: string;
  /* Metin */
  heading: string; body: string; muted: string;
  /* Aksanlar */
  accent: string; accentText: string; gold: string;
  /* Hero — temaya göre ayrışır */
  heroBg: string; heroBorder: string; heroGrid: string;
  heroHeading: string; heroBody: string; heroMuted: string;
  /* Slider caption kutusu */
  captionBg: string; captionText: string; captionSub: string;
  /* Görsel filtresi */
  imgFilter: string;
  /* Nav link rengi (hero üzerinde) */
  navLink: string;
  /* Tema toggle */
  toggleBorder: string; toggleColor: string; toggleBg: string;
};

/* ─── AÇIK TEMA ─── */
const LIGHT: Tokens = {
  bg:           "#EDE9DF",   /* sıcak krem */
  surface:      "#F5F2EA",
  card:         "#FFFFFF",
  navbar:       "#FFFFFF",
  border:       "#D4C9B0",
  borderSubtle: "#E8E2D5",
  /* Metin — koyu orman yeşili */
  heading:      "#0A3520",
  body:         "#1C5232",
  muted:        "#38694E",
  accent:       BRAND.green,
  accentText:   BRAND.gold,   /* buton üstü altın */
  gold:         BRAND.gold,
  /* Hero açık: krem zemin, yeşil metin */
  heroBg:       "#EDE9DF",
  heroBorder:   "#C8BFA8",
  heroGrid:     "#C4BBA3",
  heroHeading:  "#0A3520",
  heroBody:     "#1C5232",
  heroMuted:    "#38694E",
  /* Caption kutusu: altın zemin + koyu yeşil */
  captionBg:    "rgba(212,175,55,0.18)",
  captionText:  "#0A3520",
  captionSub:   "#1C5232",
  /* Görsel: canlı, doygun yeşil */
  imgFilter:    "brightness(0.82) saturate(1.15) hue-rotate(-3deg)",
  /* Nav linkleri krem zemin üzerinde koyu yeşil */
  navLink:      "#1C5232",
  toggleBorder: "#C8BFA8",
  toggleColor:  "#1C5232",
  toggleBg:     "rgba(255,255,255,0.60)",
};

/* ─── KOYU TEMA ─── */
const DARK: Tokens = {
  bg:           "#081C15",   /* derin antrasit-yeşil */
  surface:      "#0F241C",
  card:         "#142C22",
  navbar:       "#10271F",
  border:       "#1F3D31",
  borderSubtle: "#193328",
  /* Metin — fildişi / ivory */
  heading:      "#F5F0E8",
  body:         "#E8E2D6",
  muted:        "#B8B0A0",
  accent:       "#22C55E",
  accentText:   BRAND.gold,  /* buton üstü altın */
  gold:         BRAND.gold,
  /* Hero koyu: antrasit-yeşil zemin, fildişi metin */
  heroBg:       "#081C15",
  heroBorder:   "#173327",
  heroGrid:     "#0F2A1C",
  heroHeading:  "#F5F0E8",
  heroBody:     "#E8E2D6",
  heroMuted:    "#B8B0A0",
  /* Caption kutusu: koyu yeşil zemin + fildişi metin */
  captionBg:    "rgba(8,40,24,0.82)",
  captionText:  "#F5F0E8",
  captionSub:   "#B8B0A0",
  /* Görsel: derin, orman yeşili, karanlık */
  imgFilter:    "brightness(0.66) saturate(1.30) hue-rotate(-5deg)",
  /* Nav linkleri koyu zemin üzerinde fildişi */
  navLink:      "#E8E2D6",
  toggleBorder: "rgba(255,255,255,0.15)",
  toggleColor:  "#E8E2D6",
  toggleBg:     "rgba(255,255,255,0.06)",
};

/* ═══════════════════════════════════════════
   HOOK
═══════════════════════════════════════════ */
function useTokens(): Tokens {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return LIGHT;
  return resolvedTheme === "dark" ? DARK : LIGHT;
}

/* ═══════════════════════════════════════════
   TEMA BUTONU
═══════════════════════════════════════════ */
function ThemeBtn({ t }: { t: Tokens }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-80 active:scale-95"
      style={{ border: `1px solid ${t.toggleBorder}`, color: t.toggleColor, background: t.toggleBg }}
    >
      {dark
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
const NAV_LINKS = [
  { href: "/hakkimizda",  label: "Hakkımızda"  },
  { href: "/faaliyetler", label: "Faaliyetler"  },
  { href: "/projeler",    label: "Projeler"     },
  { href: "/iletisim",    label: "İletişim"     },
  { href: "/bagis",       label: "Bağış Yap"    },
];

function Navbar() {
  const t = useTokens();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
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

  /* Navbar başlangıçta hero üzerinde — her iki temada da hero zemini ile uyumlu */
  const navBg     = scrolled ? t.navbar : "transparent";
  const navShadow = scrolled ? `0 1px 0 ${t.border}` : "none";

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-200"
      style={{ background: navBg, boxShadow: navShadow, backdropFilter: scrolled ? "blur(20px)" : "none" }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-[66px] flex items-center justify-between gap-6">

        {/* Logo kartı — her zaman beyaz, okunabilir */}
        <Link href="/" className="flex-shrink-0 group">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group-hover:shadow-md"
            style={{ background: "#FFFFFF", border: "1px solid #D0E8DA", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#EAF5EE" }}
            >
              <img src="/logo.svg" alt="Serhendi" className="w-[17px] h-[17px]" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-[12.5px] font-bold" style={{ color: "#064E2A" }}>Serhendi Gençlik</p>
              <p className="text-[10px] mt-0.5"      style={{ color: "#4A7A5A" }}>Vakfı Eğitim Birimi</p>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-all hover:opacity-70"
              style={{ color: t.navLink }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop sağ */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0" ref={loginRef}>
          <ThemeBtn t={t} />

          <div className="relative">
            <button
              onClick={() => setLoginOpen(v => !v)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-black rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
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
                style={{ background: t.card, borderColor: t.border }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: t.borderSubtle }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.muted }}>Giriş Türü</p>
                </div>

                <Link
                  href="/giris"
                  onClick={() => setLoginOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-4 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = t.surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5EE" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold"  style={{ color: t.heading }}>Görevli Girişi</p>
                    <p className="text-[12px] mt-0.5"     style={{ color: t.muted   }}>İl / Bölge Sorumlusu, Yönetici</p>
                  </div>
                </Link>

                <div className="flex items-center gap-3.5 px-4 py-4 border-t" style={{ borderColor: t.borderSubtle, opacity: 0.45 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEF9E7" }}>
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
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-lg transition"
            style={{ color: t.navLink }}
          >
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobil menü */}
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
            <Link
              href="/giris"
              className="block w-full py-3 text-center text-[14px] font-black rounded-xl transition active:scale-[0.98]"
              style={{ background: BRAND.green, color: BRAND.gold }}
            >
              Görevli Girişi
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════
   GÖRSEL SLİDER
═══════════════════════════════════════════ */
const SLIDES = [
  { src: "https://picsum.photos/seed/mosque_youth_1/700/900",  caption: "Sabah Namazı Buluşmaları", sub: "Ülke genelinde gençlik halkası"           },
  { src: "https://picsum.photos/seed/classroom_study/700/900", caption: "İlim Dersleri",            sub: "Haftalık sistematik eğitim programı"      },
  { src: "https://picsum.photos/seed/youth_camp_2024/700/900", caption: "Kafile Programları",       sub: "Gençleri birleştiren manevi yolculuklar"  },
  { src: "https://picsum.photos/seed/university_dorm/700/900", caption: "Barınma Hizmetleri",       sub: "Güvenli ve değer odaklı yaşam ortamları"  },
  { src: "https://picsum.photos/seed/quran_lesson_22/700/900", caption: "Kur'an-ı Kerim Eğitimi",   sub: "Elif-Ba'dan başlayan köklü yolculuk"      },
];

function ImageSlider({ t }: { t: Tokens }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading]   = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 320);
  }, []);

  useEffect(() => {
    timer.current = setTimeout(() => goTo((current + 1) % SLIDES.length), 4500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, goTo]);

  const slide = SLIDES[current];

  return (
    <div className="relative w-full h-full select-none">
      {/* Görsel */}
      <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity: fading ? 0 : 1 }}>
        <img
          src={slide.src}
          alt={slide.caption}
          className="w-full h-full object-cover"
          style={{ filter: t.imgFilter }}
        />
      </div>

      {/* Gradient */}
      <div
        className="absolute inset-x-0 bottom-0 px-5 py-6"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.0) 100%)" }}
      >
        {/* Caption */}
        <div
          className="inline-block px-4 py-3 rounded-xl mb-4 backdrop-blur-sm transition-opacity duration-300"
          style={{ background: t.captionBg, opacity: fading ? 0 : 1 }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BRAND.gold }} />
            <p className="text-[13px] font-bold" style={{ color: t.captionText }}>{slide.caption}</p>
          </div>
          <p className="text-[12px] pl-[18px]" style={{ color: t.captionSub }}>{slide.sub}</p>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:      i === current ? 20 : 6,
                height:     6,
                background: i === current ? BRAND.gold : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Sağ dekor çizgisi */}
      <div
        className="absolute top-6 bottom-6 right-0 w-[2px]"
        style={{ background: `linear-gradient(to bottom, transparent, ${BRAND.gold}66, transparent)` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO — 100 dvh, temaya duyarlı
═══════════════════════════════════════════ */
function Hero() {
  const t = useTokens();

  const stats = [
    { n: "81",    l: "İlde Yapılanma"  },
    { n: "500+",  l: "Aktif Gönüllü"  },
    { n: "12+",   l: "Yıllık Tecrübe" },
  ];

  return (
    <section
      className="relative flex flex-col"
      style={{ minHeight: "100dvh", background: t.heroBg }}
    >
      {/* Hafif ızgara dokusu */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${t.heroGrid} 1px, transparent 1px), linear-gradient(90deg, ${t.heroGrid} 1px, transparent 1px)`,
          backgroundSize:  "64px 64px",
          opacity: 0.25,
        }}
      />

      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-5 lg:px-10 flex items-center pt-[66px]">
        <div className="w-full grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-10 lg:gap-16 items-center py-14 lg:py-0 lg:min-h-[calc(100dvh-66px)]">

          {/* Sol — metin */}
          <div className="flex flex-col justify-center">

            {/* Üst etiket */}
            <div className="flex items-center gap-3 mb-8">
              <span className="w-7 h-px flex-shrink-0" style={{ background: BRAND.gold }} />
              <span className="text-[11px] font-black uppercase tracking-[0.20em]" style={{ color: BRAND.gold }}>
                Serhendi Vakfı Eğitim Birimi
              </span>
            </div>

            {/* Ana başlık */}
            <h1
              className="font-black leading-[1.03] mb-7"
              style={{
                fontSize:      "clamp(2.6rem, 5.2vw, 4rem)",
                color:         t.heroHeading,
                letterSpacing: "-0.030em",
              }}
            >
              İlim, Ahlâk<br />
              ve Hizmet<br />
              <span style={{ color: BRAND.gold }}>Yolunda.</span>
            </h1>

            {/* Alt açıklama */}
            <p
              className="text-[15.5px] leading-[1.80] mb-10 max-w-[460px]"
              style={{ color: t.heroBody }}
            >
              Türkiye'nin 81 ilinde ilköğretimden üniversiteye kadar her kademedeki
              gencin ilmî, ahlâkî ve manevî gelişimine katkı sağlayan köklü bir
              gençlik ve eğitim organizasyonu.
            </p>

            {/* Butonlar */}
            <div className="flex flex-wrap items-center gap-3 mb-14">
              {/* Hakkımızda — yeşil zemin + altın yazı */}
              <Link
                href="/hakkimizda"
                className="px-7 py-3 text-[14px] font-black rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: BRAND.green, color: BRAND.gold }}
              >
                Hakkımızda
              </Link>
              {/* Faaliyetlerimiz — çerçeveli */}
              <Link
                href="/faaliyetler"
                className="px-7 py-3 text-[14px] font-semibold rounded-xl transition-all hover:opacity-75 active:scale-[0.98]"
                style={{
                  color:      t.heroBody,
                  border:     `1.5px solid ${t.heroBorder}`,
                  background: "transparent",
                }}
              >
                Faaliyetlerimiz
              </Link>
            </div>

            {/* İstatistikler */}
            <div className="flex items-start gap-10 pt-8 border-t" style={{ borderColor: t.heroBorder }}>
              {stats.map(s => (
                <div key={s.l}>
                  <p
                    className="font-black leading-none mb-1.5"
                    style={{
                      fontSize:      "clamp(1.8rem, 3vw, 2.4rem)",
                      color:         t.heroHeading,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {s.n}
                  </p>
                  <p className="text-[12.5px] font-medium" style={{ color: t.heroMuted }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ — slider */}
          <div className="relative hidden lg:block self-stretch py-10">
            <div
              className="relative h-full min-h-[480px] overflow-hidden rounded-2xl"
              style={{ border: `1px solid ${t.heroBorder}` }}
            >
              <ImageSlider t={t} />
            </div>

            {/* Dekor köşeler */}
            <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-xl -z-10" style={{ background: BRAND.gold,  opacity: 0.18 }} />
            <div className="absolute -top-2  -left-2  w-8  h-8  rounded-lg -z-10" style={{ background: BRAND.green, opacity: 0.25 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════ */
export function HomePage() {
  return (
    <div>
      <Navbar />
      <Hero />
    </div>
  );
}
