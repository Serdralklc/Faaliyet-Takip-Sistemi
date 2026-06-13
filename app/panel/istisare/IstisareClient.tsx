"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TALEP_DURUM_LABEL, TALEP_DURUM_RENK, TALEP_HEDEF, birimSecenekleri,
  type TalepBirim, type TalepDurum,
} from "@/lib/istisare";

interface TalepOzet {
  id: string; baslik: string; birim: TalepBirim; durum: TalepDurum; sistem: string;
  createdAt: string; sonMesajAt: string;
  olusturan: { ad: string; soyad: string };
  _count: { mesajlar: number };
}

const FILTRELER: { key: string; label: string; durum?: TalepDurum }[] = [
  { key: "HEPSI", label: "Tümü" },
  { key: "YENI", label: "Yeni Talepler", durum: "YENI" },
  { key: "INCELENIYOR", label: "Bekleyen", durum: "INCELENIYOR" },
  { key: "YANITLANDI", label: "Yanıtlanan", durum: "YANITLANDI" },
  { key: "COZULDU", label: "Çözülen", durum: "COZULDU" },
  { key: "KAPATILDI", label: "Kapatılan", durum: "KAPATILDI" },
];

const ACCENT = "#0E7490"; // İstişare Merkezi rengi (camgöbeği-koyu)

function zaman(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function DurumRozet({ durum }: { durum: TalepDurum }) {
  const renk = TALEP_DURUM_RENK[durum];
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
      style={{ background: renk + "18", color: renk }}>
      {TALEP_DURUM_LABEL[durum]}
    </span>
  );
}

export function IstisareClient({ sistem, olusturabilir, panelci }: {
  sistem: string; olusturabilir: boolean; panelci: boolean;
}) {
  const router = useRouter();
  const [filtre, setFiltre] = useState("HEPSI");
  const [talepler, setTalepler] = useState<TalepOzet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYeni, setShowYeni] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = FILTRELER.find(f => f.key === filtre)?.durum;
      const qs = d ? `?durum=${d}` : "";
      const res = await fetch(`/api/talepler${qs}`).then(r => r.json());
      setTalepler(Array.isArray(res) ? res : []);
    } finally { setLoading(false); }
  }, [filtre]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-5 max-w-[1100px]">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>
      )}

      {/* Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>İstişare Merkezi</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {panelci && !olusturabilir
              ? "Size ve merkeze düşen talepler — kayıt altında, kurumsal yazışma."
              : "Merkez birimleriyle kurumsal yazışma; her talep kayıt altında saklanır."}
          </p>
        </div>
        {olusturabilir && (
          <button onClick={() => setShowYeni(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: `0 4px 14px ${ACCENT}50` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Yeni Talep
          </button>
        )}
      </div>

      {/* Durum filtreleri */}
      <div className="flex flex-wrap gap-1.5">
        {FILTRELER.map(f => {
          const aktif = filtre === f.key;
          const renk = f.durum ? TALEP_DURUM_RENK[f.durum] : ACCENT;
          return (
            <button key={f.key} onClick={() => setFiltre(f.key)}
              className="px-3.5 py-2 rounded-lg text-[13px] font-bold transition"
              style={aktif ? { background: renk, color: "#fff" } : { background: renk + "12", color: renk }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="sv-section p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor…</div>
      ) : talepler.length === 0 ? (
        <div className="sv-section p-12 text-center">
          <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Talep yok</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {olusturabilir ? "Yeni Talep ile bir istişare başlatabilirsiniz." : "Bu filtrede görüntülenecek talep bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {talepler.map(t => (
            <Link key={t.id} href={`/panel/istisare/${t.id}`}
              className="sv-section block px-4 py-3.5 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[15px] truncate" style={{ color: "var(--text-primary)" }}>{t.baslik}</p>
                  <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {t.olusturan.ad} {t.olusturan.soyad} · <span style={{ color: ACCENT, fontWeight: 700 }}>{TALEP_HEDEF[t.birim].etiket}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <DurumRozet durum={t.durum} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {t._count.mesajlar} mesaj · {zaman(t.sonMesajAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showYeni && (
        <YeniTalepModal sistem={sistem} onClose={() => setShowYeni(false)}
          onCreated={(id) => { setShowYeni(false); showToast("Talep oluşturuldu"); router.push(`/panel/istisare/${id}`); }} />
      )}
    </div>
  );
}

/* ── Yeni talep modalı ── */
function YeniTalepModal({ sistem, onClose, onCreated }: {
  sistem: string; onClose: () => void; onCreated: (id: string) => void;
}) {
  const secenekler = birimSecenekleri(sistem);
  const [baslik, setBaslik] = useState("");
  const [birim, setBirim] = useState<string>(secenekler[0].value);
  const [mesaj, setMesaj] = useState("");
  const [dosyalar, setDosyalar] = useState<{ ad: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hata, setHata] = useState("");

  async function dosyaEkle(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setHata("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/talep-dosya", { method: "POST", body: fd });
        if (res.ok) { const d = await res.json(); setDosyalar(prev => [...prev, { ad: d.ad, url: d.url }]); }
        else { const d = await res.json().catch(() => ({})); setHata(d.error ?? "Dosya yüklenemedi"); }
      }
    } finally { setUploading(false); }
  }

  async function kaydet() {
    if (baslik.trim().length < 3) { setHata("Başlık en az 3 karakter olmalı"); return; }
    if (!mesaj.trim()) { setHata("Açıklama / mesaj boş olamaz"); return; }
    setSaving(true); setHata("");
    try {
      const res = await fetch("/api/talepler", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baslik, birim, mesaj, dosyalar }),
      });
      if (res.ok) { const d = await res.json(); onCreated(d.id); }
      else { const d = await res.json().catch(() => ({})); setHata(d.error ?? "Talep oluşturulamadı"); }
    } finally { setSaving(false); }
  }

  const inputCls = "w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-card";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-black text-heading mb-4">Yeni İstişare Talebi</h2>
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wide">Başlık</label>
            <input value={baslik} onChange={e => setBaslik(e.target.value)} placeholder="Talebin konusu" className={inputCls} maxLength={200} />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wide">Birim Seçimi</label>
            <select value={birim} onChange={e => setBirim(e.target.value)} className={inputCls}>
              {secenekler.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
              → {TALEP_HEDEF[birim as TalepBirim].etiket}'na iletilecek
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wide">Açıklama / Mesaj</label>
            <textarea value={mesaj} onChange={e => setMesaj(e.target.value)} rows={5} placeholder="Talebinizi açıklayın…" className={inputCls + " resize-y"} maxLength={5000} />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wide">Belge / Ek Dosya</label>
            <input type="file" multiple onChange={e => { dosyaEkle(e.target.files); e.target.value = ""; }}
              className="block w-full text-sm text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-cyan-700" />
            {uploading && <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Yükleniyor…</p>}
            {dosyalar.length > 0 && (
              <div className="mt-2 space-y-1">
                {dosyalar.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-lg" style={{ background: "var(--bg-th)" }}>
                    <span className="truncate" style={{ color: "var(--text-secondary)" }}>📎 {d.ad}</span>
                    <button onClick={() => setDosyalar(prev => prev.filter((_, j) => j !== i))} className="text-red-500 font-bold ml-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {hata && <p className="text-[13px] font-bold text-red-600">{hata}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border-2 border-border rounded-xl py-2.5 text-sm font-bold text-secondary hover:bg-th">İptal</button>
          <button onClick={kaydet} disabled={saving || uploading}
            className="flex-1 rounded-xl py-2.5 text-sm font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
            {saving ? "Gönderiliyor…" : "Talebi Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
