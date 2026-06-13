"use client";

/**
 * 🪧 Pop-Up Host — panel genelinde aktif pop-up'ları gösterir.
 * Gösterim kuralları:
 *  - TEK_SEFER : kullanıcı başına bir kez (sunucu /aktif zaten görülenleri eler; kapanınca DB'ye işaretlenir).
 *  - HER_GIRIS : oturum başına bir kez (sessionStorage).
 *  - SUREKLI / TARIH_ARALIGI : her sayfa yüklemesinde (kapatılınca o oturumda tekrar açılmaz).
 * Modal: Kapat + (link varsa) Detay Gör.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Gosterim = "TEK_SEFER" | "HER_GIRIS" | "SUREKLI" | "TARIH_ARALIGI";
interface Popup {
  id: string;
  baslik: string;
  aciklama: string;
  gorselUrl: string | null;
  link: string | null;
  gosterim: Gosterim;
}

const SESSION_KEY = "popup-seen-session";
function sessionSeen(): string[] {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]"); } catch { return []; }
}
function markSessionSeen(id: string) {
  const s = sessionSeen();
  if (!s.includes(id)) { s.push(id); sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
}

export function PopupHost() {
  const { data = [] } = useQuery({
    queryKey: ["popup-aktif"],
    queryFn: async (): Promise<Popup[]> => {
      const res = await fetch("/api/popuplar/aktif");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // HER_GIRIS olup bu oturumda görülenler baştan "kapalı" sayılır (SSR'de boş başlar)
  const [kapali, setKapali] = useState<Set<string>>(
    () => (typeof window === "undefined" ? new Set<string>() : new Set(sessionSeen()))
  );

  // Gösterilecek ilk uygun pop-up (render sırasında türetilir)
  const popup = data.find(p => !kapali.has(p.id));

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup?.id]);

  if (!popup) return null;

  function kapat() {
    if (!popup) return;
    if (popup.gosterim === "HER_GIRIS") markSessionSeen(popup.id);
    if (popup.gosterim === "TEK_SEFER") fetch(`/api/popuplar/${popup.id}/goruldu`, { method: "POST" }).catch(() => {});
    setKapali(prev => new Set(prev).add(popup.id));
  }
  function detay() {
    if (!popup) return;
    const link = popup.link;
    kapat();
    if (link) window.location.href = link;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      role="dialog" aria-modal="true" aria-label={popup.baslik}
      onClick={kapat}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        {popup.gorselUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={popup.gorselUrl} alt="" className="w-full max-h-56 object-cover" />
        )}
        <div className="p-5 space-y-2">
          <h3 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>{popup.baslik}</h3>
          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
            {popup.aciklama}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={kapat}
              className="px-4 py-2 rounded-xl text-[13.5px] font-semibold transition"
              style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            >
              Kapat
            </button>
            {popup.link && (
              <button
                onClick={detay}
                className="px-4 py-2 rounded-xl text-[13.5px] font-semibold text-white transition"
                style={{ background: "var(--accent-solid)" }}
              >
                Detay Gör
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
