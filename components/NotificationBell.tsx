"use client";

/**
 * 🔔 Bildirim Merkezi çanı — okunmamış sayacı + açılır liste.
 * 60 sn'de bir sayacı tazeler; bildirim açılınca "görüldü" kaydedilir.
 * Hem yönetici/panel hem gönüllü oturumlarıyla çalışır (/api/bildirimlerim ikisini de tanır).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";

interface BildirimItem {
  alimId: string;
  baslik: string;
  mesaj: string;
  tip: string;
  link: string | null;
  tarih: string;
  goruldu: boolean;
}

const TIP_RENK: Record<string, string> = {
  DUYURU: "#0B6B3A",
  BILGILENDIRME: "#1D4ED8",
  DOSYA: "#D97706",
  FORM: "#7C3AED",
};

const TIP_LABEL: Record<string, string> = {
  DUYURU: "Duyuru",
  BILGILENDIRME: "Bilgilendirme",
  DOSYA: "Dosya Paylaşımı",
  FORM: "Yeni Form",
};

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detay, setDetay] = useState<BildirimItem | null>(null);
  const [filtre, setFiltre] = useState<"hepsi" | "okunmamis" | "okunmus">("hepsi");
  const ref = useRef<HTMLDivElement>(null);

  // Kapalıyken yalnızca hafif sayaç; açıkken tam liste
  const { data: sayac } = useQuery({
    queryKey: ["bildirim-sayac"],
    queryFn: async () => {
      const r = await fetch("/api/bildirimlerim?sayac=1");
      if (!r.ok) throw new Error();
      return r.json() as Promise<{ okunmamis: number }>;
    },
    refetchInterval: 60_000,
    retry: false,
  });

  const { data: liste, isLoading } = useQuery({
    queryKey: ["bildirimlerim"],
    queryFn: async () => {
      const r = await fetch("/api/bildirimlerim");
      if (!r.ok) throw new Error();
      return r.json() as Promise<{ okunmamis: number; bildirimler: BildirimItem[] }>;
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setDetay(null); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setDetay(null); } };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function ac(b: BildirimItem) {
    if (!b.goruldu) {
      fetch("/api/bildirimlerim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alimId: b.alimId }),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["bildirim-sayac"] });
        queryClient.invalidateQueries({ queryKey: ["bildirimlerim"] });
      });
    }
    if (b.link) {
      setOpen(false);
      router.push(b.link);
    } else {
      setDetay(b);
    }
  }

  const okunmamis = sayac?.okunmamis ?? 0;
  const gosterilen = (liste?.bildirimler ?? []).filter(b =>
    filtre === "hepsi" ? true : filtre === "okunmamis" ? !b.goruldu : b.goruldu
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(v => !v); setDetay(null); }}
        aria-label={okunmamis > 0 ? `Bildirim Merkezi — ${okunmamis} okunmamış` : "Bildirim Merkezi"}
        aria-expanded={open}
        className="relative p-2 rounded-xl transition hover:bg-[var(--bg-hover)]"
        style={{ color: "var(--text-secondary)" }}
      >
        <Bell size={18} />
        {okunmamis > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center"
            style={{ background: "#DC2626" }}
          >
            {okunmamis > 99 ? "99+" : okunmamis}
          </span>
        )}
      </button>

      {open && (
        <div
          /* Mobil: ekrana sabit, kenarlardan 12px (asla tasmaz).
             Masaustu: butona gore, sola tasmayi onlemek icin sola yasli. */
          className="fixed inset-x-3 top-16 w-auto sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[360px] z-[80] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-bold text-heading">🔔 Bildirim Merkezi</p>
            {okunmamis > 0 && <span className="text-[11px] font-bold text-red-500">{okunmamis} okunmamış</span>}
          </div>

          {detay ? (
            <div className="p-4">
              <button onClick={() => setDetay(null)} className="text-[12px] font-bold text-[var(--accent)] hover:underline mb-2">
                ← Geri
              </button>
              <span className="block text-[10.5px] font-bold uppercase tracking-wider mb-1" style={{ color: TIP_RENK[detay.tip] ?? "var(--text-muted)" }}>
                {TIP_LABEL[detay.tip] ?? detay.tip}
              </span>
              <p className="text-[14px] font-bold text-heading mb-2">{detay.baslik}</p>
              <p className="text-[13px] text-secondary leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">{detay.mesaj}</p>
              <p className="text-[11px] text-muted mt-3">{new Date(detay.tarih).toLocaleString("tr-TR")}</p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto">
              {/* Filtre: Tümü / Okunmamış / Okunmuş */}
              <div className="flex gap-1 px-3 py-2 border-b border-border sticky top-0 z-10" style={{ background: "var(--bg-card)" }}>
                {([["hepsi", "Tümü"], ["okunmamis", "Okunmamış"], ["okunmus", "Okunmuş"]] as const).map(([k, etiket]) => (
                  <button
                    key={k}
                    onClick={() => setFiltre(k)}
                    className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition"
                    style={filtre === k
                      ? { background: "var(--accent-solid)", color: "#fff" }
                      : { color: "var(--text-muted)", background: "var(--bg-hover)" }}
                  >
                    {etiket}
                  </button>
                ))}
              </div>
              {isLoading ? (
                <p className="px-4 py-8 text-center text-[13px] text-muted">Yükleniyor...</p>
              ) : !gosterilen.length ? (
                <p className="px-4 py-8 text-center text-[13px] text-muted">
                  {filtre === "okunmamis" ? "Okunmamış bildiriminiz yok." : filtre === "okunmus" ? "Okunmuş bildiriminiz yok." : "Henüz bildiriminiz yok."}
                </p>
              ) : (
                gosterilen.map(b => (
                  <button
                    key={b.alimId}
                    onClick={() => ac(b)}
                    className="w-full text-left px-4 py-3 border-b border-border last:border-0 transition hover:bg-[var(--bg-hover)]"
                    style={!b.goruldu ? { background: "var(--bg-active)" } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.goruldu ? "transparent" : TIP_RENK[b.tip] ?? "#DC2626" }} />
                      <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: TIP_RENK[b.tip] ?? "var(--text-muted)" }}>
                        {TIP_LABEL[b.tip] ?? b.tip}
                      </span>
                      <span className="ml-auto text-[10.5px] text-muted shrink-0">{new Date(b.tarih).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <p className={`text-[13px] mt-1 truncate ${b.goruldu ? "text-secondary" : "font-bold text-heading"}`}>{b.baslik}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
