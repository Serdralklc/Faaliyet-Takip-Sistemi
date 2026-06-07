"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

/* ════════════════════════════════════════
   RENK SİSTEMİ
   — hiçbir yerde rgba opacity ile metin soldurma yok
════════════════════════════════════════ */
const G = {
  /* Marka */
  primary:   "#006B3F",
  dark:      "#004D2D",
  deep:      "#002E1A",
  gold:      "#C9A227",
  goldDark:  "#8A6A10",

  /* Açık zemin metinleri */
  ink:       "#0F172A",   /* ana başlık */
  sub:       "#1E293B",   /* alt başlık */
  body:      "#334155",   /* paragraf */
  muted:     "#4B5563",   /* yardımcı */

  /* Koyu zemin metinleri — WCAG AA geçer */
  onDark:    "#FFFFFF",
  onDarkSub: "#B8D4C0",   /* kontrast 4.9:1 */
  onDarkBody:"#7EA98F",   /* kontrast 4.5:1 */

  /* Yüzeyler */
  white:     "#FFFFFF",
  light:     "#F6F8F5",
  border:    "#C9D4CA",
  borderSoft:"#E2EBE4",
  footerBg:  "#0C1910",
  footerText:"#5A7F66",
};

/* ════════════════════════════════════════
   NAV
════════════════════════════════════════ */
function ThemeToggle({ scrolled }: { scrolled: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  const iconColor = scrolled ? G.sub : G.onDarkSub;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="w-9 h-9 flex items-center justify-center rounded-md border transition hover:opacity-80"
      style={{
        borderColor: scrolled ? G.borderSoft : "#3D6B50",
        background:  scrolled ? G.white      : "transparent",
        color: iconColor,
      }}
    >
      {isDark
        ? /* Güneş */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12"  x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
          </svg>
        : /* Ay */
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
      }
    </button>
  );
}

function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
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
    { href: "#hakkimizda",  label: "Hakkımızda"  },
    { href: "#faaliyetler", label: "Faaliyetler"  },
    { href: "#projeler",    label: "Projeler"     },
    { href: "#iletisim",    label: "İletişim"     },
  ];

  /* navbar arka planı scroll'a göre */
  const navBg     = scrolled ? G.white          : "transparent";
  const navBorder = scrolled ? G.borderSoft      : "transparent";
  const navShadow = scrolled ? "0 1px 0 rgba(0,0,0,0.07)" : "none";

  /* nav linkleri */
  const linkColor = scrolled ? G.sub : G.onDarkSub;

  /* logonun her durumda görünür olması için sabit beyaz kart */
  const logoBg     = G.white;
  const logoBorder = G.borderSoft;
  const logoText   = G.dark;
  const logoSub    = G.muted;

  /* sağ butonlar */
  const bagisColor  = scrolled ? G.sub      : G.onDarkSub;
  const bagisBorder = scrolled ? G.border   : "#4A7B5C";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{ background: navBg, borderBottom: `1px solid ${navBorder}`, boxShadow: navShadow, backdropFilter: scrolled ? "blur(16px)" : "none" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

        {/* ── Logo — beyaz kart, HER DURUMDA NET ── */}
        <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
            style={{ background: logoBg, border: `1px solid ${logoBorder}` }}>
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "#E8F5EE" }}>
              <img src="/logo.svg" alt="Serhendi" className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-bold leading-tight" style={{ color: logoText }}>Serhendi Gençlik</p>
              <p className="text-[10px] leading-tight" style={{ color: logoSub }}>Vakfı Eğitim Birimi</p>
            </div>
          </div>
        </a>

        {/* Desktop nav linkleri */}
        <div className="hidden lg:flex items-center gap-0.5">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 text-[13.5px] font-medium rounded-md transition-colors hover:opacity-100"
              style={{ color: linkColor }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop sağ */}
        <div className="hidden lg:flex items-center gap-3" ref={loginRef}>
          <ThemeToggle scrolled={scrolled} />
          <a href="#bagis"
            className="px-4 py-2 text-[13.5px] font-semibold rounded-md border transition"
            style={{ color: bagisColor, borderColor: bagisBorder }}>
            Bağış Yap
          </a>
          <div className="relative">
            <button onClick={() => setLoginOpen(v => !v)}
              className="px-5 py-2 text-[13.5px] font-bold rounded-md text-white flex items-center gap-1.5 transition hover:opacity-90"
              style={{ background: G.primary }}>
              Oturum Aç
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d={loginOpen ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {loginOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-[268px] rounded-xl border shadow-2xl overflow-hidden"
                style={{ background: G.white, borderColor: G.borderSoft }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: G.borderSoft }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: G.muted }}>Giriş Türü Seçin</p>
                </div>
                <Link href="/giris" onClick={() => setLoginOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5EE" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: G.ink }}>Görevli Girişi</p>
                    <p className="text-xs mt-0.5" style={{ color: G.muted }}>İl / Bölge Sorumlusu · Yönetici</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 px-4 py-4 border-t" style={{ borderColor: "#F3F4F6" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 opacity-40" style={{ background: "#FEF3C7" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="opacity-50">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold" style={{ color: G.ink }}>Gönüllü Girişi</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>Yakında</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: G.muted }}>Gönüllü katılımcılar</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2 rounded-md"
          onClick={() => setMenuOpen(v => !v)}
          style={{ color: scrolled ? G.ink : G.onDark }}>
          {menuOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden px-6 py-5 border-t" style={{ background: G.white, borderColor: G.borderSoft }}>
          <div className="space-y-0">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-3.5 text-[14px] font-medium border-b"
                style={{ color: G.sub, borderColor: G.borderSoft }}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="pt-4 flex flex-col gap-2.5">
            <Link href="/giris"
              className="py-3 text-center text-[14px] font-bold rounded-md text-white"
              style={{ background: G.primary }}>
              Görevli Girişi
            </Link>
            <a href="#bagis"
              className="py-3 text-center text-[14px] font-semibold rounded-md border"
              style={{ borderColor: G.border, color: G.sub }}>
              Bağış Yap
            </a>
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[13px] font-medium" style={{ color: G.muted }}>Tema</span>
              <ThemeToggle scrolled={true} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ════════════════════════════════════════
   HERO
════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{ background: G.deep, minHeight: "100vh" }}
      className="flex items-center pt-[68px]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full py-20 lg:py-0 lg:min-h-[calc(100vh-68px)] flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          {/* Sol: metin */}
          <div>
            {/* Altın şerit + etiket */}
            <div className="flex items-center gap-3 mb-7">
              <span className="w-8 h-[2px] flex-shrink-0" style={{ background: G.gold }} />
              <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: G.gold }}>
                Türkiye Geneli · 81 İl
              </span>
            </div>

            {/* Ana başlık — tam beyaz, hiç opacity yok */}
            <h1 className="font-black leading-[1.06] mb-6"
              style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", color: G.onDark, letterSpacing: "-0.025em" }}>
              İlim, Ahlâk<br />
              ve Hizmet<br />
              <span style={{ color: G.gold }}>Yolunda.</span>
            </h1>

            {/* Açıklama — WCAG AA geçen renk */}
            <p className="text-[16px] leading-[1.7] mb-10 max-w-md"
              style={{ color: G.onDarkSub }}>
              İlköğretimden üniversiteye kadar her kademedeki gencin
              ilmî, ahlâkî ve manevî gelişimine katkı sağlayan köklü
              bir gençlik ve eğitim organizasyonu.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 mb-14">
              <a href="#hakkimizda"
                className="px-7 py-3 text-[14px] font-bold text-white rounded-md transition hover:opacity-90"
                style={{ background: G.primary }}>
                Hakkımızda
              </a>
              <a href="#faaliyetler"
                className="px-7 py-3 text-[14px] font-semibold rounded-md transition"
                style={{ color: G.onDarkSub, border: "1px solid #3D6B50" }}>
                Faaliyetlerimiz →
              </a>
            </div>

            {/* İstatistikler — alt çizginin üstü */}
            <div className="flex items-start gap-10 pt-8 border-t" style={{ borderColor: "#1E3D28" }}>
              {[
                { n: "81",   l: "İl"            },
                { n: "500+", l: "Aktif Gönüllü" },
                { n: "12+",  l: "Yıl Tecrübe"   },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-3xl font-black" style={{ color: G.onDark, letterSpacing: "-0.03em" }}>{s.n}</p>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: G.onDarkBody }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: görsel alanı */}
          <div className="relative hidden lg:block">
            <div className="rounded-lg overflow-hidden"
              style={{ aspectRatio: "4/5", background: G.dark, border: "1px solid #1E3D28" }}>

              {/* Placeholder — gerçek fotoğraf eklenince görsel burada */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-10 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3D6B50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-[13px] font-semibold" style={{ color: "#3D6B50" }}>Faaliyet Fotoğrafı</p>
                <p className="text-xs" style={{ color: "#2A4E35" }}>public/hero.jpg olarak eklenebilir</p>
              </div>

              {/* Alt kart overlay */}
              <div className="absolute bottom-0 inset-x-0 px-6 py-5"
                style={{ background: "rgba(0,18,10,0.82)", borderTop: "1px solid #1E3D28" }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: G.gold }} />
                  <p className="text-[14px] font-bold" style={{ color: G.onDark }}>2024–2025 Faaliyet Dönemi</p>
                </div>
                <p className="text-[13px]" style={{ color: G.onDarkBody }}>
                  Türkiye genelinde 81 ilde eş zamanlı faaliyetler
                </p>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-md -z-10"
              style={{ background: G.gold, opacity: 0.18 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   HAKKIMIZDA
════════════════════════════════════════ */
function Hakkimizda() {
  const items = [
    { n: "01", t: "Kuran-ı Kerim Eğitimi",     d: "Elif-Ba'dan başlayarak her seviyede haftalık kurslar, deneyimli eğitmen kadrosu." },
    { n: "02", t: "İlim Halkaları",             d: "Lise ve üniversite öğrencilerine yönelik sistematik haftalık ders programları." },
    { n: "03", t: "Kafile & Sosyal Programlar", d: "Gençleri bir araya getiren manevi seyahatler ve sosyal etkinlikler." },
    { n: "04", t: "Barınma & Burs Desteği",     d: "Güvenli barınma ortamları ve Nezir Bursu ile eğitime kesintisiz destek." },
  ];

  return (
    <section id="hakkimizda" style={{ background: G.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: G.primary }}>Hakkımızda</p>
            <h2 className="font-black leading-[1.08] mb-7"
              style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", color: G.ink, letterSpacing: "-0.025em" }}>
              Gençliğe Değer,<br />Geleceğe Yatırım
            </h2>
            <p className="text-[15px] leading-[1.75] mb-5" style={{ color: G.body }}>
              Serhendi Vakfı çatısı altında faaliyet gösteren Gençlik Eğitim Birimi
              olarak 12 yılı aşkın tecrübemizle Türkiye'nin her köşesinde ilköğretimden
              üniversiteye kadar gençleri kucaklayan programlar yürütüyoruz.
            </p>
            <p className="text-[15px] leading-[1.75] mb-10" style={{ color: G.body }}>
              Amacımız yalnızca bilgi aktarmak değil; güçlü karakter, derin inanç
              ve toplumsal sorumluluk taşıyan nesiller yetiştirmektir.
            </p>
            <a href="#faaliyetler"
              className="inline-flex items-center gap-2 text-[14px] font-bold transition"
              style={{ color: G.primary }}>
              Faaliyetlerimizi İnceleyin
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <div className="border-t" style={{ borderColor: G.borderSoft }}>
            {items.map(it => (
              <div key={it.n} className="flex items-start gap-5 py-6 border-b" style={{ borderColor: G.borderSoft }}>
                <span className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                  style={{ background: "#E8F5EE", color: G.primary }}>
                  {it.n}
                </span>
                <div>
                  <p className="font-bold text-[15px] mb-1.5" style={{ color: G.ink }}>{it.t}</p>
                  <p className="text-[14px] leading-[1.6]" style={{ color: G.body }}>{it.d}</p>
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
   FAALİYETLER
════════════════════════════════════════ */
function Faaliyetler() {
  const birimler = [
    { n: "01", t: "İlköğretim Birimi",  r: G.primary,  d: "Elif-Ba'dan Kur'an-ı Kerim'e uzanan yolda çocuklara haftalık dini eğitim kursları. Deneyimli eğitmenler, sistematik program." },
    { n: "02", t: "Lise Birimi",        r: "#0F5FA0",   d: "Sabah namazı buluşmaları, ilim dersleri ve kafile programları. Lise öğrencilerinin ruhî ve ilmî gelişimine odaklanır." },
    { n: "03", t: "Üniversite Birimi",  r: "#5B21B6",   d: "KYK buluşmaları, dergah programları, ilim halkaları. Üniversite gençliğine derinlikli topluluk ve bilgi ortamı." },
    { n: "04", t: "Barınma Hizmetleri", r: "#92400E",   d: "Öğrenci evleri, apart ve yurtlarda şeffaf yönetim. Güvenli, değerli ve takip edilen barınma ortamları." },
  ];

  const ek = [
    "Sabah Namazı Buluşmaları",
    "Kafile Programları",
    "Sosyal Faaliyetler",
    "Nezir Burs Programı",
    "KYK Buluşmaları",
    "Eğitim Materyalleri",
  ];

  return (
    <section id="faaliyetler" style={{ background: G.light }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: G.primary }}>Faaliyetlerimiz</p>
          <h2 className="font-black leading-[1.08] mb-4"
            style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", color: G.ink, letterSpacing: "-0.025em" }}>
            Geniş Bir Hizmet Yelpazesi
          </h2>
          <p className="text-[15px] leading-[1.7]" style={{ color: G.body }}>
            İlköğretimden üniversiteye, barınmadan burs programlarına kadar gençliğin
            her alanında sistematik ve kararlı bir hizmet anlayışı.
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid sm:grid-cols-2 gap-px" style={{ background: G.border }}>
          {birimler.map(b => (
            <div key={b.n} className="p-8 lg:p-10 flex flex-col" style={{ background: G.white }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: b.r }}>{b.n}</span>
                <span className="flex-1 h-px" style={{ background: G.borderSoft }} />
              </div>
              <h3 className="font-black text-[1.15rem] mb-3" style={{ color: G.ink, letterSpacing: "-0.01em" }}>
                {b.t}
              </h3>
              <p className="text-[14px] leading-[1.65] flex-1" style={{ color: G.body }}>{b.d}</p>
              <div className="w-8 h-[3px] mt-6" style={{ background: b.r }} />
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap gap-2.5">
          {ek.map(e => (
            <span key={e}
              className="px-4 py-2 text-[13px] font-medium rounded-md border"
              style={{ background: G.white, borderColor: G.border, color: G.sub }}>
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
  const projeler = [
    { n: "01", t: "Nesil Yetiştirilmesi",  d: "İlköğretimden üniversiteye sistematik eğitim — Türkiye geneli kapsam.",     r: G.primary,   durum: "Devam Ediyor" },
    { n: "02", t: "Öğrenci Barınma Ağı",   d: "Üniversite öğrencileri için değer odaklı güvenli barınma ortamları.",       r: "#5B21B6",    durum: "Devam Ediyor" },
    { n: "03", t: "Nezir Burs Programı",   d: "İhtiyaç sahibi öğrencilere burs desteği ile eğitimde fırsat eşitliği.",    r: G.goldDark,   durum: "Devam Ediyor" },
  ];

  return (
    <section id="projeler" style={{ background: G.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: G.primary }}>Projelerimiz</p>
          <h2 className="font-black leading-[1.08]"
            style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", color: G.ink, letterSpacing: "-0.025em" }}>
            Uzun Vadeli Projelerimiz
          </h2>
        </div>

        <div className="border-t" style={{ borderColor: G.borderSoft }}>
          {projeler.map(p => (
            <div key={p.n}
              className="grid grid-cols-12 gap-4 py-8 border-b items-start hover:bg-slate-50 transition px-2"
              style={{ borderColor: G.borderSoft }}>
              <div className="col-span-1 hidden sm:block pt-0.5">
                <span className="text-[11px] font-black" style={{ color: G.border }}>{p.n}</span>
              </div>
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <p className="font-bold text-[15px]" style={{ color: G.ink }}>{p.t}</p>
              </div>
              <div className="col-span-12 sm:col-span-5 lg:col-span-6">
                <p className="text-[14px] leading-[1.65]" style={{ color: G.body }}>{p.d}</p>
              </div>
              <div className="col-span-12 sm:col-span-2 flex sm:justify-end">
                <span className="text-[12px] font-bold px-2.5 py-1 rounded"
                  style={{ background: p.r + "18", color: p.r }}>
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
  return (
    <section id="gonullu" style={{ background: G.deep }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-7">
              <span className="w-8 h-[2px] flex-shrink-0" style={{ background: G.gold }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: G.gold }}>Katılım</span>
            </div>
            <h2 className="font-black leading-[1.06] mb-6"
              style={{ fontSize: "clamp(2rem, 3.8vw, 3rem)", color: G.onDark, letterSpacing: "-0.025em" }}>
              Faaliyetlerimizden<br />Haberdar Olun.
            </h2>
            <p className="text-[15px] leading-[1.75] mb-10" style={{ color: G.onDarkSub }}>
              Eğitim programları, gençlik çalışmaları ve faaliyet haberlerini
              takip etmek için gönüllü topluluğumuza katılabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-8 py-3 text-[14px] font-bold rounded-md transition hover:opacity-90"
                style={{ background: G.gold, color: "#1a0a00" }}>
                Gönüllü Ol
              </button>
              <a href="#iletisim"
                className="px-8 py-3 text-[14px] font-semibold rounded-md border transition"
                style={{ color: G.onDarkSub, borderColor: "#3D6B50" }}>
                İletişime Geç
              </a>
            </div>
          </div>

          <div className="hidden lg:block space-y-3">
            {[
              "Türkiye genelinde 81 ilde aktif yapılanma",
              "Haftalık dini eğitim kursları",
              "Sabah namazı buluşmaları ve kafile programları",
              "Öğrenci barınma ve burs desteği",
            ].map(m => (
              <div key={m} className="flex items-start gap-3 px-5 py-4 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1E3D28" }}>
                <svg className="mt-0.5 flex-shrink-0" width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 8l4 4 7-7" stroke={G.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[14px] font-medium" style={{ color: G.onDarkSub }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   BAĞIŞ
════════════════════════════════════════ */
function Bagis() {
  return (
    <section id="bagis" style={{ background: G.light }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: G.goldDark }}>Destek Ol</p>
            <h2 className="font-black leading-[1.08] mb-4"
              style={{ fontSize: "clamp(1.9rem, 3vw, 2.4rem)", color: G.ink, letterSpacing: "-0.025em" }}>
              Geleceğe Yatırım Yapın
            </h2>
            <p className="text-[15px] leading-[1.75] mb-8" style={{ color: G.body }}>
              Bağışlarınız öğrenci bursları, dergah faaliyetleri ve eğitim
              programlarının sürdürülmesine doğrudan katkı sağlar.
            </p>
            <button className="px-8 py-3 text-[14px] font-bold rounded-md text-white transition hover:opacity-90"
              style={{ background: G.primary }}>
              Bağış Yap
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Öğrenci Bursu",    s: "Eğitime kesintisiz devam"       },
              { l: "Dergah Desteği",   s: "Faaliyetlerin sürdürülmesi"     },
              { l: "Kafile Programı",  s: "Manevi seyahat desteği"         },
              { l: "Kitap & Materyal", s: "Eğitim kaynaklarının temini"    },
            ].map(b => (
              <div key={b.l} className="p-5 rounded-md border"
                style={{ background: G.white, borderColor: G.borderSoft }}>
                <p className="font-bold text-[14px] mb-1" style={{ color: G.ink }}>{b.l}</p>
                <p className="text-[13px] leading-[1.5]" style={{ color: G.body }}>{b.s}</p>
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
  return (
    <footer id="iletisim" style={{ background: G.footerBg }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <img src="/logo.svg" alt="" className="w-5 h-5 brightness-0 invert" style={{ opacity: 0.55 }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "#C8DDD0" }}>Serhendi Gençlik</p>
                <p className="text-[11px]" style={{ color: G.footerText }}>Serhendi Vakfı Eğitim Birimi</p>
              </div>
            </div>
            <p className="text-[13px] leading-[1.7] max-w-xs" style={{ color: G.footerText }}>
              İlim, ahlâk ve hizmet yolunda yürüyen Serhendi Gençlik, Türkiye'nin
              dört bir yanında nesil yetiştirme misyonunu sürdürmektedir.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "#C8DDD0" }}>Erişim</p>
            <div className="space-y-3">
              {[
                { href: "#hakkimizda",  l: "Hakkımızda"     },
                { href: "#faaliyetler", l: "Faaliyetlerimiz" },
                { href: "#projeler",    l: "Projelerimiz"    },
                { href: "#gonullu",     l: "Gönüllü Ol"      },
                { href: "#bagis",       l: "Bağış Yap"       },
                { href: "/giris",       l: "Görevli Girişi"  },
              ].map(x => (
                <a key={x.l} href={x.href}
                  className="block text-[13px] transition hover:text-white"
                  style={{ color: G.footerText }}>{x.l}</a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "#C8DDD0" }}>İletişim</p>
            <div className="space-y-4">
              {[
                { t: "iletisim@serhendi.com" },
                { t: "Türkiye Geneli · 81 İl" },
              ].map((c, i) => (
                <p key={i} className="text-[13px]" style={{ color: G.footerText }}>{c.t}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px]" style={{ color: "#2E5040" }}>
            © {new Date().getFullYear()} Serhendi Vakfı Eğitim Birimi. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-5">
            {["Gizlilik", "Kullanım Şartları"].map(l => (
              <a key={l} href="#" className="text-[12px] transition hover:text-white" style={{ color: "#2E5040" }}>{l}</a>
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
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <Nav />
      <Hero />
      <Hakkimizda />
      <Faaliyetler />
      <Projeler />
      <Cta />
      <Bagis />
      <Footer />
    </div>
  );
}
