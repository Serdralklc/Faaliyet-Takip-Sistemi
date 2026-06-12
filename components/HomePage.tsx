"use client";

/**
 * Serhendi Gençlik — Kurumsal Ana Sayfa
 *
 * Tema: lib/theme.ts TOKENS (CSS değişkenleri) — açık/koyu otomatik.
 * Navbar: PublicLayout'taki ortak PublicNavbar (transparentAtTop modunda).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { BRAND, useTokens, type Tokens } from "@/lib/theme";
import { PublicNavbar } from "./PublicLayout";

/* ─── GÖRSEL SLİDER ──────────────────────── */
const SLIDES = [
  { src: "/images/faaliyet-1.jpg", caption: "Kafile Programları",       sub: "Gençleri birleştiren manevi yolculuklar"   },
  { src: "/images/faaliyet-2.jpg", caption: "İlim Dersleri",            sub: "Haftalık sistematik eğitim programı"       },
  { src: "/images/faaliyet-3.jpg", caption: "Sabah Namazı Buluşmaları", sub: "Türkiye genelinde gençlik halkası"         },
  { src: "/images/faaliyet-4.jpg", caption: "Gençlik Faaliyetleri",     sub: "Birlikte büyüyen, birlikte güçlenen nesil" },
  { src: "/images/faaliyet-5.jpg", caption: "Kur'an-ı Kerim Eğitimi",   sub: "Elif-Ba'dan başlayan köklü yolculuk"      },
];

function ImageSlider({ t }: { t: Tokens }) {
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);
  const [paused,  setPaused]  = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 300);
  }, []);

  // Otomatik ilerleme — hover/odak sırasında durur (WCAG 2.2.2)
  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => goTo((current + 1) % SLIDES.length), 4500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, paused, goTo]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full h-full select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity: fading ? 0 : 1 }}>
        <img
          src={slide.src}
          alt={slide.caption}
          className="w-full h-full object-cover"
          style={{ filter: t.imgFilter }}
        />
      </div>

      {/* Altta gradient + caption */}
      <div
        className="absolute inset-x-0 bottom-0 px-5 py-6"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      >
        <div
          className="inline-block px-4 py-3 rounded-xl mb-2 backdrop-blur-sm transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.45)", opacity: fading ? 0 : 1 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BRAND.gold }} />
            <p className="text-[13px] font-bold text-white">{slide.caption}</p>
          </div>
          <p className="text-[12px] pl-[18px]" style={{ color: "#CBD5E1" }}>{slide.sub}</p>
        </div>

        <div className="flex items-center" role="tablist" aria-label="Slayt seçimi">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slayt ${i + 1}: ${s.caption}`}
              aria-current={i === current}
              className="p-2 -my-1 group/dot"
            >
              <span
                className="block rounded-full transition-all duration-300 group-hover/dot:opacity-80"
                style={{
                  width:      i === current ? 20 : 6,
                  height:     6,
                  background: i === current ? BRAND.gold : "rgba(255,255,255,0.35)",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HERO ───────────────────────────────── */
function Hero() {
  const t = useTokens();

  const stats = [
    { n: "81",   l: "İlde Yapılanma"  },
    { n: "500+", l: "Aktif Gönüllü"   },
    { n: "12+",  l: "Yıllık Tecrübe"  },
  ];

  return (
    <section
      className="relative flex flex-col"
      style={{ minHeight: "100dvh", background: t.heroBg }}
    >
      {/* Hafif nokta dokusu */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${t.heroBorder} 1px, transparent 1px)`,
          backgroundSize:  "32px 32px",
          opacity: 0.35,
        }}
      />

      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-5 lg:px-10 flex items-center pt-[66px]">
        <div className="w-full grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-10 lg:gap-14 items-center py-14 lg:py-0 lg:min-h-[calc(100dvh-66px)]">

          {/* ── Sol: metin ── */}
          <div className="flex flex-col justify-center">

            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px flex-shrink-0" style={{ background: BRAND.gold }} />
              <span className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: BRAND.gold }}>
                Serhendi Vakfı Eğitim Birimi
              </span>
            </div>

            {/* Başlık */}
            <h1
              className="font-extrabold leading-[1.04] mb-7"
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

            {/* Açıklama */}
            <p
              className="text-[16px] leading-[1.80] mb-10 max-w-[480px]"
              style={{ color: t.heroBody, fontWeight: 400 }}
            >
              Türkiye'nin 81 ilinde ilköğretimden üniversiteye kadar her kademedeki
              gencin ilmî, ahlâkî ve manevî gelişimine katkı sağlayan köklü bir
              gençlik ve eğitim organizasyonu.
            </p>

            {/* Butonlar */}
            <div className="flex flex-wrap items-center gap-3 mb-14">
              <Link
                href="/hakkimizda"
                className="px-7 py-3 text-[14px] font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: BRAND.green, color: "#FFFFFF" }}
              >
                Hakkımızda
              </Link>
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
                      color:         t.heroStat,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {s.n}
                  </p>
                  <p className="text-[13px] font-medium" style={{ color: t.heroMuted }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sağ: slider ── */}
          <div className="relative hidden lg:flex lg:items-center lg:justify-center py-10">
            <div
              className="relative w-full overflow-hidden rounded-2xl"
              style={{ border: `1px solid ${t.heroBorder}`, aspectRatio: "1 / 1", maxHeight: "520px" }}
            >
              <ImageSlider t={t} />
            </div>

            {/* Dekor köşeler */}
            <div
              className="absolute -bottom-2 -right-2 w-14 h-14 rounded-xl -z-10"
              style={{ background: BRAND.gold, opacity: 0.15 }}
            />
            <div
              className="absolute -top-2 -left-2 w-8 h-8 rounded-lg -z-10"
              style={{ background: BRAND.green, opacity: 0.20 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── EXPORT ─────────────────────────────── */
export function HomePage() {
  return (
    <div>
      <PublicNavbar transparentAtTop />
      <Hero />
    </div>
  );
}
