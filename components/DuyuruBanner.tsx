"use client";

/**
 * 📢 Duyuru Bandı — tüm panellerin üstünde, süre boyunca kayan sabit duyuru.
 * /api/duyurular/aktif'ten o an aktif (tarih aralığında) duyuruları çeker.
 * Kapatılamaz (spec gereği süre boyunca herkes görür). Hover'da kayma durur.
 */

import { useQuery } from "@tanstack/react-query";

interface Duyuru {
  id: string;
  metin: string;
  link: string | null;
}

export function DuyuruBanner() {
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

  if (!data.length) return null;

  // Kesintisiz döngü için aynı içerik iki kez yazılır (CSS -50% kaydırma)
  const itemEls = data.map(d => (
    <span className="duyuru-item" key={d.id}>
      <span aria-hidden="true">📢</span>
      {d.link
        ? <a href={d.link} className="duyuru-link">{d.metin}</a>
        : <span>{d.metin}</span>}
      <span className="duyuru-sep" aria-hidden="true">•</span>
    </span>
  ));

  return (
    <div className="duyuru-banner" role="region" aria-label="Duyurular">
      <div className="duyuru-marquee">
        <div className="duyuru-track">{itemEls}</div>
        <div className="duyuru-track" aria-hidden="true">{itemEls}</div>
      </div>
    </div>
  );
}
