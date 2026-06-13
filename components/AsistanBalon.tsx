"use client";

/**
 * 💬 Faaliyet Asistanı — sağ altta açılır/kapanır sohbet balonu.
 * Yalnızca yöneticilere gösterilir (MobileLayout içinde role kontrolüyle render edilir).
 * /api/asistan ucuna sohbet geçmişini gönderir, Gemini'nin cevabını gösterir.
 *
 * Faz 1: genel soru-cevap. Veritabanı sorgulama (bölge kıyas, öğrenci listesi,
 * PDF indirme) sonraki fazlarda eklenecek.
 */

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, FileText, FileSpreadsheet, RotateCcw } from "lucide-react";
import {
  verilerdenSpec,
  asistanPdfIndir,
  asistanExcelIndir,
  type AsistanVeri,
} from "@/lib/asistan/disari-aktar";

interface Mesaj {
  rol: "user" | "model";
  metin: string;
  veriler?: AsistanVeri[];
}

const KARSILAMA: Mesaj = {
  rol: "model",
  metin:
    "Merhaba! Ben Faaliyet Asistanı 👋 Sistemin gerçek verisini sorgulayabilirim. Örnek:\n\n" +
    "• 5. bölgenin 1. ve 2. dönem kıyasını yap\n" +
    "• 9. bölgede öğrenci evinde kalanların isimleri\n" +
    "• 3. bölge hedeflerine ne kadar ulaştı?\n\n" +
    "Tablo içeren cevapların altından PDF/Excel indirebilirsin.",
};

export function AsistanBalon() {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([KARSILAMA]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [indiriliyor, setIndiriliyor] = useState<string | null>(null);

  const sonRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Yeni mesajda en alta kaydır
  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar, yukleniyor]);

  // Açılınca girdiye odaklan
  useEffect(() => {
    if (acik) setTimeout(() => inputRef.current?.focus(), 100);
  }, [acik]);

  // Escape ile kapat
  useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [acik]);

  async function gonder() {
    const metin = girdi.trim();
    if (!metin || yukleniyor) return;

    setHata(null);
    const yeniGecmis: Mesaj[] = [...mesajlar, { rol: "user", metin }];
    setMesajlar(yeniGecmis);
    setGirdi("");
    setYukleniyor(true);

    try {
      // Karşılama mesajını sunucuya gönderme (sadece gerçek diyalog)
      const gonderilecek = yeniGecmis.filter((m) => m !== KARSILAMA);
      const r = await fetch("/api/asistan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesajlar: gonderilecek }),
      });
      const data = await r.json();
      if (!r.ok) {
        setHata(data?.error ?? "Bir hata oluştu.");
      } else {
        setMesajlar((m) => [...m, { rol: "model", metin: data.cevap, veriler: data.veriler }]);
      }
    } catch {
      setHata("Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }

  function tusaBas(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      gonder();
    }
  }

  function yeniSohbet() {
    setMesajlar([KARSILAMA]);
    setGirdi("");
    setHata(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function indir(tip: "pdf" | "excel", veriler: AsistanVeri[] | undefined, anahtar: string) {
    if (indiriliyor) return;
    setIndiriliyor(anahtar + tip);
    try {
      const ok = tip === "pdf" ? await asistanPdfIndir(veriler) : await asistanExcelIndir(veriler);
      if (!ok) setHata("Bu cevap için indirilebilir tablo verisi yok.");
    } catch {
      setHata("İndirme sırasında bir hata oluştu.");
    } finally {
      setIndiriliyor(null);
    }
  }

  return (
    <>
      {/* ── Açma/kapama butonu ── */}
      <button
        onClick={() => setAcik((v) => !v)}
        aria-label={acik ? "Asistanı kapat" : "Faaliyet Asistanını aç"}
        aria-expanded={acik}
        className="fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--accent, #0B6B3A)", color: "#fff" }}
      >
        {acik ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* ── Sohbet penceresi ── */}
      {acik && (
        <div
          className="fixed z-[90] flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden
                     inset-x-3 bottom-24 top-20
                     sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-24 sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-7rem)]"
          style={{ background: "var(--bg-card, #fff)" }}
          role="dialog"
          aria-label="Faaliyet Asistanı sohbeti"
        >
          {/* Başlık */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0"
            style={{ background: "var(--accent, #0B6B3A)", color: "#fff" }}
          >
            <Sparkles size={18} />
            <div className="leading-tight">
              <p className="text-[13px] font-bold">Faaliyet Asistanı</p>
              <p className="text-[10.5px] opacity-80">Yapay zekâ destekli</p>
            </div>
            <button
              onClick={yeniSohbet}
              aria-label="Yeni sohbet"
              title="Yeni sohbet"
              className="ml-auto p-1.5 rounded-lg transition hover:bg-white/20"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setAcik(false)}
              aria-label="Kapat"
              className="p-1.5 rounded-lg transition hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" style={{ background: "var(--bg-page, #f7f7f7)" }}>
            {mesajlar.map((m, i) => {
              const spec = m.rol === "model" ? verilerdenSpec(m.veriler) : null;
              return (
                <div key={i} className={`flex flex-col ${m.rol === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words"
                    style={
                      m.rol === "user"
                        ? { background: "var(--accent, #0B6B3A)", color: "#fff", borderBottomRightRadius: 6 }
                        : { background: "var(--bg-card, #fff)", color: "var(--text-primary, #111)", border: "1px solid var(--border)", borderBottomLeftRadius: 6 }
                    }
                  >
                    {m.metin}
                  </div>

                  {spec && (
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        onClick={() => indir("pdf", m.veriler, String(i))}
                        disabled={indiriliyor !== null}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold transition disabled:opacity-50 hover:opacity-90"
                        style={{ background: "#FEE9E7", color: "#B91C1C" }}
                      >
                        <FileText size={13} />
                        {indiriliyor === String(i) + "pdf" ? "Hazırlanıyor…" : "PDF indir"}
                      </button>
                      <button
                        onClick={() => indir("excel", m.veriler, String(i))}
                        disabled={indiriliyor !== null}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold transition disabled:opacity-50 hover:opacity-90"
                        style={{ background: "#E6F4EA", color: "#0B6B3A" }}
                      >
                        <FileSpreadsheet size={13} />
                        {indiriliyor === String(i) + "excel" ? "Hazırlanıyor…" : "Excel indir"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {yukleniyor && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border)", borderBottomLeftRadius: 6 }}
                >
                  <span className="asistan-typing inline-flex gap-1">
                    <i></i><i></i><i></i>
                  </span>
                </div>
              </div>
            )}

            {hata && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                  style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>
                  ⚠️ {hata}
                </div>
              </div>
            )}

            <div ref={sonRef} />
          </div>

          {/* Girdi */}
          <div className="border-t border-border p-2.5 shrink-0 flex items-end gap-2" style={{ background: "var(--bg-card, #fff)" }}>
            <textarea
              ref={inputRef}
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              onKeyDown={tusaBas}
              rows={1}
              placeholder="Bir soru yazın…"
              className="flex-1 resize-none max-h-28 px-3 py-2 rounded-xl text-[13.5px] outline-none focus:ring-2"
              style={{ background: "var(--bg-page, #f4f4f4)", color: "var(--text-primary, #111)", border: "1px solid var(--border)" }}
            />
            <button
              onClick={gonder}
              disabled={!girdi.trim() || yukleniyor}
              aria-label="Gönder"
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "var(--accent, #0B6B3A)", color: "#fff" }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
