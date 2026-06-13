"use client";

/**
 * 📢 Duyuru Bandı — tüm panellerin üstünde, süre boyunca kayan sabit duyuru.
 * /api/duyurular/aktif'ten o an aktif (tarih aralığında) duyuruları çeker.
 * Kapatılamaz (spec gereği süre boyunca herkes görür). Hover'da kayma durur.
 * Bir duyuruya tıklanınca tam metni (ve varsa bağlantısı) bir pencerede açılır.
 */

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Duyuru {
  id: string;
  metin: string;
  link: string | null;
}

export function DuyuruBanner() {
  const [secili, setSecili] = useState<Duyuru | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // İçerik genişliğine göre süre — duyuru azken de tempolu (hızlı) kaysın
  const [sure, setSure] = useState(14);

  const { data = [] } = useQuery({
    queryKey: ["duyuru-aktif"],
    queryFn: async (): Promise<Duyuru[]> => {
      const res = await fetch("/api/duyurular/aktif");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  // Bir set'in piksel genişliğini ölç → sabit ~110px/sn hız (min 5s, maks 22s)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.scrollWidth;
    if (w > 0) setSure(Math.max(5, Math.min(22, Math.round(w / 110))));
  }, [data]);

  if (!data.length) return null;

  // Kesintisiz döngü için aynı içerik iki kez yazılır (CSS -50% kaydırma)
  const itemEls = data.map(d => (
    <span
      className="duyuru-item"
      key={d.id}
      role="button"
      tabIndex={0}
      onClick={() => setSecili(d)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSecili(d); } }}
    >
      <span aria-hidden="true">📢</span>
      <span>{d.metin}</span>
      <span className="duyuru-sep" aria-hidden="true">•</span>
    </span>
  ));

  return (
    <>
      <div className="duyuru-banner" role="region" aria-label="Duyurular">
        <span className="duyuru-badge"><span aria-hidden="true">📢</span> Duyurular</span>
        <div className="duyuru-viewport">
          <div className="duyuru-marquee" style={{ animationDuration: `${sure}s` }}>
            <div className="duyuru-track" ref={trackRef}>{itemEls}</div>
            <div className="duyuru-track" aria-hidden="true">{itemEls}</div>
          </div>
        </div>
      </div>

      {secili && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSecili(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl" aria-hidden="true">📢</span>
              <h3 className="flex-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>Duyuru</h3>
              <button
                onClick={() => setSecili(null)}
                aria-label="Kapat"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg leading-none"
                style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {secili.metin}
            </p>
            {secili.link && (
              <a
                href={secili.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                Bağlantıya Git →
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
