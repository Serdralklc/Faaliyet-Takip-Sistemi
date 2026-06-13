/**
 * PAYLAŞILAN MOTION VARYANTLARI
 *
 * Framer Motion (`motion` paketi) için tek kaynak varyant/ayar modülü.
 * Renk/tema burada YOK — yalnız hareket. Renkler lib/theme.ts'te kalır.
 *
 * Erişilebilirlik: app/providers.tsx içindeki <MotionConfig reducedMotion="user">
 * sayesinde `prefers-reduced-motion: reduce` olan kullanıcılarda transform/layout
 * animasyonları otomatik nötrlenir (opacity korunur). Bu yüzden varyantlar
 * serbestçe y/scale kullanabilir.
 *
 * Giriş varyantlarında `custom` = saniye cinsinden gecikme (stagger için kullanışlı).
 */

import type { Variants } from "motion/react";

/** Yumuşak easeOut (quint benzeri) — giriş animasyonları için. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** whileInView için standart görünürlük ayarı (tek seferlik tetik). */
export const VIEWPORT = { once: true, amount: 0.2 } as const;

/* ── Scroll / giriş varyantları (custom = gecikme, saniye) ── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_OUT, delay },
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT, delay },
  }),
};

/* ── Grid stagger ── */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Stagger içindeki tek öğe — fadeUp ile aynı (parent "show"u tetikler). */
export const staggerItem: Variants = fadeUp;

/* ── Hover presetleri (rest/hover) — HoverReveal ile kullanılır ──
   Parent HoverReveal "rest"/"hover" etiketlerini çocuklara yayar. */
export const hoverZoom: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.06 },
};
export const hoverOverlay: Variants = {
  rest: { opacity: 0 },
  hover: { opacity: 1 },
};
export const hoverSlideUp: Variants = {
  rest: { y: "130%", opacity: 0 },
  hover: { y: "0%", opacity: 1 },
};

/** Genel amaçlı yumuşak yay geçişi (hover/lift için). */
export const SPRING = { type: "spring" as const, stiffness: 280, damping: 22 };
