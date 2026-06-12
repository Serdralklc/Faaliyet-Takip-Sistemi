"use client";

/**
 * Scroll-triggered reveal wrapper.
 * Çocuklarını viewport'a girince hafifçe alttan kaydırarak belirtir.
 * IntersectionObserver ile tek seferlik (görününce unobserve).
 * prefers-reduced-motion saygısı CSS tarafında (.sv-reveal kuralı).
 */

import { useEffect, useRef, useState, type JSX } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Gecikme (ms) — inline transition-delay; grid stagger için kullanışlı. */
  delay?: number;
  /** Sarmalayıcı etiket; varsayılan "div". */
  as?: keyof JSX.IntrinsicElements;
  /** Ek inline stil (transition-delay ile birleşir). */
  style?: React.CSSProperties;
}

export function Reveal({ children, className, delay = 0, as = "div", style }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // IntersectionObserver yoksa (çok eski tarayıcı/SSR sonrası) doğrudan göster.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target); // tek seferlik
          }
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as as "div";

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`sv-reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
