"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gorevEtiket } from "@/lib/constants";
import {
  TALEP_DURUM_LABEL, TALEP_DURUM_RENK, TALEP_DURUMLAR, TALEP_HEDEF, TALEP_BIRIM_LABEL,
  talepKarsilayanMi, cozDosya, type TalepBirim, type TalepDurum,
} from "@/lib/istisare";

const ACCENT = "#0E7490";

interface Mesaj {
  id: string; mesaj: string; dosyalar: string[]; createdAt: string; gonderenId: string;
  gonderen: { ad: string; soyad: string; role: string; merkezGorev: string | null; sistem: string };
}
interface Detay {
  id: string; baslik: string; birim: TalepBirim; durum: TalepDurum; sistem: string; createdAt: string;
  olusturanId: string;
  olusturan: { ad: string; soyad: string; role: string; sistem: string };
  mesajlar: Mesaj[];
}

function saat(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function TalepThread({ talepId, meId, role }: { talepId: string; meId: string; role: string }) {
  const [detay, setDetay] = useState<Detay | null>(null);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [dosyalar, setDosyalar] = useState<{ ad: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [durumBusy, setDurumBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/talepler/${talepId}`);
    if (res.ok) { setDetay(await res.json()); setHata(""); }
    else { const d = await res.json().catch(() => ({})); setHata(d.error ?? "Talep yüklenemedi"); }
    setLoading(false);
  }, [talepId]);

  useEffect(() => { load(); }, [load]);

  const karsilayan = detay ? talepKarsilayanMi(detay.birim, role) : false;
  const olusturanMi = detay ? detay.olusturanId === meId : false;
  const kapali = detay?.durum === "KAPATILDI";

  async function dosyaEkle(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/talep-dosya", { method: "POST", body: fd });
        if (res.ok) { const d = await res.json(); setDosyalar(prev => [...prev, { ad: d.ad, url: d.url }]); }
      }
    } finally { setUploading(false); }
  }

  async function gonder() {
    if (!mesaj.trim() && dosyalar.length === 0) return;
    setSending(true);
    const res = await fetch(`/api/talepler/${talepId}/mesaj`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesaj: mesaj.trim() || "(dosya)", dosyalar }),
    });
    setSending(false);
    if (res.ok) { setMesaj(""); setDosyalar([]); load(); }
  }

  async function durumDegistir(durum: TalepDurum) {
    setDurumBusy(true);
    const res = await fetch(`/api/talepler/${talepId}/durum`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durum }),
    });
    setDurumBusy(false);
    if (res.ok) load();
  }

  if (loading) return <div className="p-6 max-w-[900px]"><div className="sv-section p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor…</div></div>;
  if (hata || !detay) return (
    <div className="p-6 max-w-[900px] space-y-4">
      <Link href="/panel/istisare" className="text-sm font-bold" style={{ color: ACCENT }}>← İstişare Merkezi</Link>
      <div className="sv-section p-12 text-center"><p className="font-bold" style={{ color: "var(--text-primary)" }}>{hata || "Talep bulunamadı"}</p></div>
    </div>
  );

  const renk = TALEP_DURUM_RENK[detay.durum];

  return (
    <div className="p-6 max-w-[900px] space-y-4">
      <Link href="/panel/istisare" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: ACCENT }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        İstişare Merkezi
      </Link>

      {/* Başlık kartı */}
      <div className="sv-section p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{detay.baslik}</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              {detay.olusturan.ad} {detay.olusturan.soyad} · {gorevEtiket(detay.olusturan.role, detay.olusturan.sistem)}
              {" · "}<span style={{ color: ACCENT, fontWeight: 700 }}>{TALEP_BIRIM_LABEL[detay.birim]} → {TALEP_HEDEF[detay.birim].etiket}</span>
            </p>
          </div>
          <span className="text-[12px] px-3 py-1.5 rounded-full font-bold whitespace-nowrap" style={{ background: renk + "18", color: renk }}>
            {TALEP_DURUM_LABEL[detay.durum]}
          </span>
        </div>

        {/* Durum kontrolleri (karşılayan: tümü; oluşturan: kapatabilir) */}
        {(karsilayan || olusturanMi) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px] font-bold uppercase tracking-wide mr-1" style={{ color: "var(--text-muted)" }}>Durum:</span>
            {TALEP_DURUMLAR.map(d => {
              const izin = karsilayan || (olusturanMi && d === "KAPATILDI");
              if (!izin) return null;
              const aktif = detay.durum === d;
              const dr = TALEP_DURUM_RENK[d];
              return (
                <button key={d} disabled={durumBusy || aktif} onClick={() => durumDegistir(d)}
                  className="px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition disabled:opacity-60"
                  style={aktif ? { background: dr, color: "#fff" } : { background: dr + "12", color: dr }}>
                  {TALEP_DURUM_LABEL[d]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mesajlar */}
      <div className="space-y-3">
        {detay.mesajlar.map(m => {
          const benim = m.gonderenId === meId;
          const dosyaList = m.dosyalar.map(cozDosya).filter(Boolean) as { ad: string; url: string }[];
          return (
            <div key={m.id} className={`flex ${benim ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%] rounded-2xl px-4 py-3"
                style={benim
                  ? { background: ACCENT, color: "#fff" }
                  : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold" style={{ color: benim ? "rgba(255,255,255,0.95)" : "var(--text-primary)" }}>
                    {m.gonderen.ad} {m.gonderen.soyad}
                  </span>
                  <span className="text-[10px]" style={{ color: benim ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                    {gorevEtiket(m.gonderen.role, m.gonderen.sistem, m.gonderen.merkezGorev)}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.6] whitespace-pre-wrap">{m.mesaj}</p>
                {dosyaList.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dosyaList.map((d, i) => (
                      <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] font-semibold underline"
                        style={{ color: benim ? "#fff" : ACCENT }}>
                        📎 {d.ad}
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-[10px] mt-1.5 text-right" style={{ color: benim ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>{saat(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Yanıt kutusu */}
      {kapali ? (
        <div className="sv-section p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Bu talep kapatıldı. Yeni mesaj eklenemez.
        </div>
      ) : (
        <div className="sv-section p-4 space-y-3 sticky bottom-0">
          <textarea value={mesaj} onChange={e => setMesaj(e.target.value)} rows={3} placeholder="Yanıtınızı yazın…"
            className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-card resize-y" maxLength={5000} />
          {dosyalar.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dosyalar.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg" style={{ background: "var(--bg-th)", color: "var(--text-secondary)" }}>
                  📎 {d.ad}
                  <button onClick={() => setDosyalar(prev => prev.filter((_, j) => j !== i))} className="text-red-500 font-bold">✕</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <label className="text-[13px] font-bold cursor-pointer" style={{ color: ACCENT }}>
              <input type="file" multiple className="hidden" onChange={e => { dosyaEkle(e.target.files); e.target.value = ""; }} />
              📎 Dosya ekle {uploading && "…"}
            </label>
            <button onClick={gonder} disabled={sending || uploading || (!mesaj.trim() && dosyalar.length === 0)}
              className="px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
              {sending ? "Gönderiliyor…" : "Gönder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
