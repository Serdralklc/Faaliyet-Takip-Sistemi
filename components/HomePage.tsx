"use client";

/**
 * Serhendi Gençlik — Kurumsal Ana Sayfa
 *
 * Hero: TÜGVA tarzı TAM EKRAN sinematik arka plan.
 *   - faaliyet-1..5.jpg üzerinde Ken Burns (yavaş zoom) + crossfade döngüsü.
 *   - Üstüne koyu degrade örtü; içerik sol-altta (başlık/CTA/istatistik) stagger ile belirir.
 *   - VİDEO TAKAS NOKTASI: <HeroBackdrop> içindeki <motion.img> yerine
 *     <video autoPlay muted loop playsInline src="/videos/hero.mp4" /> konularak
 *     tek hamlede videoya geçilebilir (örtü/içerik aynen kalır).
 *
 * Navbar: PublicLayout'taki ortak PublicNavbar (transparentAtTop modunda; koyu hero
 * üzerinde linkler beyaz görünür — PublicNavbar bunu otomatik yönetir).
 * Erişilebilirlik: prefers-reduced-motion'da zoom/bounce kapanır (MotionConfig + useReducedMotion).
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { BRAND } from "@/lib/theme";
import { PublicNavbar } from "./PublicLayout";
import { Pressable, fadeUp, staggerContainer } from "@/components/motion";

/* ─── SLAYTLAR ──────────────────────────── */
const SLIDES = [
  { src: "/images/faaliyet-1.jpg", caption: "Kafile Programları",       sub: "Gençleri birleştiren manevi yolculuklar"   },
  { src: "/images/faaliyet-2.jpg", caption: "İlim Dersleri",            sub: "Haftalık sistematik eğitim programı"       },
  { src: "/images/faaliyet-3.jpg", caption: "Sabah Namazı Buluşmaları", sub: "Türkiye genelinde gençlik halkası"         },
  { src: "/images/faaliyet-4.jpg", caption: "Gençlik Faaliyetleri",     sub: "Birlikte büyüyen, birlikte güçlenen nesil" },
  { src: "/images/faaliyet-5.jpg", caption: "Kur'an-ı Kerim Eğitimi",   sub: "Elif-Ba'dan başlayan köklü yolculuk"       },
];

const SLIDE_MS = 6000;

/* ─── TAM EKRAN ARKA PLAN (Ken Burns + crossfade) ─── */
function HeroBackdrop({ current, reduce }: { current: number; reduce: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#06140d" }}>
      <AnimatePresence>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <motion.img
            src={SLIDES[current].src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-full h-full object-cover"
            initial={{ scale: reduce ? 1 : 1.0 }}
            animate={{ scale: reduce ? 1 : 1.12 }}
            transition={{ duration: SLIDE_MS / 1000 + 1.4, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dikey karartma (üst: navbar okunurluğu, alt: metin okunurluğu) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(3,12,8,0.70) 0%, rgba(3,12,8,0.30) 28%, rgba(3,12,8,0.50) 64%, rgba(3,12,8,0.90) 100%)",
        }}
      />
      {/* Marka yeşili köşe tonu */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(115deg, rgba(6,78,42,0.55) 0%, transparent 58%)" }}
      />
    </div>
  );
}

/* ─── HERO ───────────────────────────────── */
function Hero() {
  const reduce = useReducedMotion() ?? false;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { n: "81",   l: "İlde Yapılanma" },
    { n: "500+", l: "Aktif Gönüllü"  },
    { n: "12+",  l: "Yıllık Tecrübe" },
  ];

  return (
    <section className="relative flex flex-col justify-end overflow-hidden" style={{ minHeight: "100dvh" }}>
      <HeroBackdrop current={current} reduce={reduce} />

      {/* ── İçerik (sol-alt) ── */}
      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-5 lg:px-10 pt-[120px] pb-20 lg:pb-28"
        variants={staggerContainer(0.12, 0.15)}
        initial="hidden"
        animate="show"
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
          <span className="w-7 h-px flex-shrink-0" style={{ background: BRAND.gold }} />
          <span className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: BRAND.gold }}>
            Serhendi Vakfı · Eğitim Birimi
          </span>
        </motion.div>

        {/* Başlık */}
        <motion.h1
          variants={fadeUp}
          className="font-black text-white leading-[1.02] mb-6"
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 40px rgba(0,0,0,0.45)",
          }}
        >
          İlim, Ahlâk ve<br />
          Hizmet <span style={{ color: BRAND.gold }}>Yolunda.</span>
        </motion.h1>

        {/* Açıklama */}
        <motion.p
          variants={fadeUp}
          className="text-[16px] lg:text-[18px] leading-[1.8] mb-9 max-w-[560px]"
          style={{ color: "rgba(255,255,255,0.82)" }}
        >
          Türkiye&apos;nin 81 ilinde ilköğretimden üniversiteye kadar her kademedeki gencin
          ilmî, ahlâkî ve manevî gelişimine katkı sağlayan köklü bir gençlik ve eğitim organizasyonu.
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-14">
          <Pressable>
            <Link
              href="/hakkimizda"
              className="px-8 py-3.5 text-[14px] font-bold rounded-xl"
              style={{ background: BRAND.green, color: "#FFFFFF", boxShadow: "0 12px 32px rgba(11,107,58,0.45)" }}
            >
              Hakkımızda
            </Link>
          </Pressable>
          <Pressable>
            <Link
              href="/faaliyetler"
              className="px-8 py-3.5 text-[14px] font-semibold rounded-xl"
              style={{
                color: "#FFFFFF",
                border: "1.5px solid rgba(255,255,255,0.40)",
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(4px)",
              }}
            >
              Faaliyetlerimiz
            </Link>
          </Pressable>
        </motion.div>

        {/* İstatistikler */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-start gap-x-10 gap-y-5 pt-7 border-t"
          style={{ borderColor: "rgba(255,255,255,0.18)" }}
        >
          {stats.map((s) => (
            <div key={s.l}>
              <p
                className="font-black text-white leading-none mb-1.5"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", letterSpacing: "-0.04em" }}
              >
                {s.n}
              </p>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.70)" }}>{s.l}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Slayt başlığı (sağ-alt, crossfade) ── */}
      <div className="absolute bottom-7 right-5 lg:right-10 z-10 hidden md:block text-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BRAND.gold }} />
              <p className="text-[13px] font-bold text-white">{SLIDES[current].caption}</p>
            </div>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>{SLIDES[current].sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Aşağı kaydır oku ── */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
        aria-hidden="true"
        animate={reduce ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
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
