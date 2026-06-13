"use client";

/**
 * Yeniden kullanılır motion sarmalayıcıları.
 *
 * - MotionReveal : components/Reveal.tsx ile AYNI API (children/className/delay/as/style)
 *                  ama whileInView ile. Mevcut Reveal çağrıları minimum değişiklikle geçer.
 * - HoverReveal  : kart hover'ı — yukarı kalkma (+gölge) ve "rest"/"hover" etiketlerini
 *                  çocuklarına yayar. İçine hoverZoom/hoverOverlay/hoverSlideUp varyantlı
 *                  motion çocukları konunca TÜGVA tarzı "hover'da kayan örtü" elde edilir.
 * - Pressable    : buton/CTA için hafif kalkma + tıklama efekti.
 *
 * Erişilebilirlik global: app/providers.tsx <MotionConfig reducedMotion="user">.
 */

import { motion, type Variants, type TargetAndTransition } from "motion/react";
import type { JSX } from "react";
import { VIEWPORT, fadeUp, SPRING } from "@/lib/motion";

type Tag = keyof JSX.IntrinsicElements;

/* ── MotionReveal — scroll ile beliren sarmalayıcı (Reveal drop-in) ── */
interface MotionRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Gecikme (ms) — Reveal API uyumu için ms; içeride saniyeye çevrilir. */
  delay?: number;
  as?: Tag;
  style?: React.CSSProperties;
  variants?: Variants;
  /** viewport görünürlük eşiği (0–1). */
  amount?: number;
  once?: boolean;
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  as = "div",
  style,
  variants = fadeUp,
  amount,
  once = true,
}: MotionRevealProps) {
  // motion proxy üzerinden dinamik etiket (motion.div, motion.section, ...)
  const MotionTag = ((motion as unknown) as Record<string, typeof motion.div>)[as as string] ?? motion.div;
  return (
    <MotionTag
      className={className}
      style={style}
      variants={variants}
      custom={delay / 1000}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: amount ?? VIEWPORT.amount }}
    >
      {children}
    </MotionTag>
  );
}

/* ── HoverReveal — kart hover sarmalayıcı + rest/hover yayıcı ── */
interface HoverRevealProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Hover'da yukarı kalkma (px). 0 = kalkma yok. */
  lift?: number;
  restShadow?: string;
  hoverShadow?: string;
  as?: Tag;
}

export function HoverReveal({
  children,
  className,
  style,
  lift = 0,
  restShadow,
  hoverShadow,
  as = "div",
}: HoverRevealProps) {
  const MotionTag = ((motion as unknown) as Record<string, typeof motion.div>)[as as string] ?? motion.div;

  const rest: TargetAndTransition = { y: 0 };
  const hover: TargetAndTransition = { y: -lift };
  if (restShadow !== undefined) rest.boxShadow = restShadow;
  if (hoverShadow !== undefined || restShadow !== undefined) hover.boxShadow = hoverShadow ?? restShadow;

  return (
    <MotionTag
      className={className}
      style={style}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      variants={{ rest, hover }}
      transition={SPRING}
    >
      {children}
    </MotionTag>
  );
}

/* ── Pressable — buton/CTA mikro-etkileşimi ── */
interface PressableProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Pressable({ children, className, style }: PressableProps) {
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex", ...style }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 350, damping: 18 }}
    >
      {children}
    </motion.span>
  );
}

/* Kolaylık: varyant presetlerini buradan da dışa aktar. */
export {
  fadeUp,
  fadeIn,
  scaleIn,
  staggerContainer,
  staggerItem,
  hoverZoom,
  hoverOverlay,
  hoverSlideUp,
  VIEWPORT,
  SPRING,
} from "@/lib/motion";
