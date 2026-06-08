"use client";

import { useState } from "react";

type Durum = "BEKLEMEDE" | "INCELENIYOR" | "ONAYLANDI" | "REDDEDILDI";

interface Basvuru {
  id: string;
  adSoyad: string;
  telefon: string;
  email: string | null;
  universite: string;
  fakulteBolum: string;
  sinif: string;
  il: string;
  madiDurum: string;
  aciklama: string;
  belgeler: string[];
  durum: Durum;
  yoneticiNotu: string | null;
  createdAt: string;
  volunteer: { id: string; adSoyad: string; telefon: string; email?: string | null };
}

interface Stats {
  toplam: number;
  bekleyen: number;
  inceleniyor: number;
  onaylandi: number;
  reddedildi: number;
}

const DURUM_CONFIG: Record<Durum, { label: string; color: string; bg: string }> = {
  BEKLEMEDE:    { label: "Beklemede",    color: "#D97706", bg: "#FEF3C7" },
  INCELENIYOR:  { label: "İnceleniyor",  color: "#2563EB", bg: "#DBEAFE" },
  ONAYLANDI:    { label: "Onaylandı",    color: "#059669", bg: "#D1FAE5" },
  REDDEDILDI:   { label: "Reddedildi",   color: "#DC2626", bg: "#FEE2E2" },
};

const FILTER_TABS: { key: Durum | "TUMU"; label: string }[] = [
  { key: "TUMU",        label: "Tümü" },
  { key: "BEKLEMEDE",   label: "Beklemede" },
  { key: "INCELENIYOR", label: "İnceleniyor" },
  { key: "ONAYLANDI",   label: "Onaylandı" },
  { key: "REDDEDILDI",  label: "Reddedildi" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Bugün";
  if (d === 1) return "Dün";
  return `${d} gün önce`;
}

export function BursBasvurulariClient({ basvurular, stats }: { basvurular: Basvuru[]; stats: Stats }) {
  const [filter, setFilter]       = useState<Durum | "TUMU">("TUMU");
  const [selected, setSelected]   = useState<Basvuru | null>(null);
  const [notForm, setNotForm]      = useState("");
  const [durumForm, setDurumForm]  = useState<Durum>("INCELENIYOR");
  const [loading, setLoading]      = useState(false);
  const [toast, setToast]          = useState("");
  const [localList, setLocalList]  = useState<Basvuru[]>(basvurular);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  const filtered = filter === "TUMU" ? localList : localList.filter(b => b.durum === filter);

  async function handleDurumGuncelle() {
    if (!selected) return;
    setLoading(true);
    const res = await fetch(`/api/admin/burs-basvurulari/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum: durumForm, yoneticiNotu: notForm }),
    });
    setLoading(false);
    if (res.ok) {
      setLocalList(prev => prev.map(b =>
        b.id === selected.id ? { ...b, durum: durumForm, yoneticiNotu: notForm } : b
      ));
      setSelected(null);
      showToast("Başvuru güncellendi");
    } else {
      const d = await res.json();
      showToast("Hata: " + d.error);
    }
  }

  const statCards = [
    { label: "Toplam Başvuru", value: stats.toplam,     color: "#6B7280" },
    { label: "Beklemede",      value: stats.bekleyen,   color: "#D97706" },
    { label: "İnceleniyor",    value: stats.inceleniyor, color: "#2563EB" },
    { label: "Onaylandı",      value: stats.onaylandi,  color: "#059669" },
    { label: "Reddedildi",     value: stats.reddedildi, color: "#DC2626" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Başlık */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#0B6B3A" }}>YÖNETİM</p>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Nezir Burs Başvuruları
        </h1>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="sv-section p-4">
            <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtre tabları */}
      <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        {FILTER_TABS.map(t => {
          const cnt = t.key === "TUMU" ? localList.length : localList.filter(b => b.durum === t.key).length;
          return (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={filter === t.key
                ? { background: "#0B6B3A", color: "#fff" }
                : { color: "var(--text-muted)" }
              }>
              {t.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: filter === t.key ? "rgba(255,255,255,0.2)" : "var(--bg-hover)",
                  color: filter === t.key ? "#fff" : "var(--text-muted)",
                }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tablo */}
      <div className="sv-section overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Bu kategoride başvuru bulunmuyor.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b" style={{ borderColor: "var(--border)" }}>
              <tr>
                {["Ad Soyad", "Üniversite / Bölüm", "Sınıf", "İl", "Maddi Durum", "Durum", "Başvuru", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)", background: "var(--bg-th)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const dc = DURUM_CONFIG[b.durum];
                return (
                  <tr key={b.id} className="hover:bg-[color:var(--bg-hover)] border-b transition"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{b.adSoyad}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{b.telefon}</div>
                      {b.email && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{b.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{b.universite}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{b.fakulteBolum}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{b.sinif}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{b.il}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{b.madiDurum}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: dc.bg, color: dc.color }}>
                        {dc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(b.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(b); setDurumForm(b.durum); setNotForm(b.yoneticiNotu ?? ""); }}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "#0B6B3A" }}
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detay / Güncelleme Modalı */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h2 className="text-lg font-bold text-gray-900">Burs Başvurusu</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Kişi bilgileri */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="font-bold text-gray-900">{selected.adSoyad}</p>
                <p className="text-sm text-gray-500">{selected.telefon}</p>
                {selected.email && <p className="text-sm text-gray-500">{selected.email}</p>}
              </div>

              {/* Başvuru bilgileri */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Üniversite", selected.universite],
                  ["Fakülte / Bölüm", selected.fakulteBolum],
                  ["Sınıf", selected.sinif],
                  ["İl", selected.il],
                  ["Maddi Durum", selected.madiDurum],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{k}</p>
                    <p className="font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>

              {/* Açıklama */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Açıklama</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.aciklama}</p>
              </div>

              {/* Belgeler */}
              {selected.belgeler.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Belgeler</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.belgeler.map((b, i) => (
                      <a key={i} href={b} target="_blank" rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold border hover:bg-gray-50 transition"
                        style={{ borderColor: "#E2E8F0", color: "#0B6B3A" }}>
                        📎 Belge {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Durum güncelleme */}
              <div className="border-t pt-4" style={{ borderColor: "#E2E8F0" }}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Durum Güncelle</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(["BEKLEMEDE", "INCELENIYOR", "ONAYLANDI", "REDDEDILDI"] as Durum[]).map(d => {
                    const dc = DURUM_CONFIG[d];
                    return (
                      <button key={d} onClick={() => setDurumForm(d)}
                        className="py-2 rounded-xl text-xs font-bold border-2 transition"
                        style={{
                          background:  durumForm === d ? dc.bg     : "transparent",
                          borderColor: durumForm === d ? dc.color  : "#E2E8F0",
                          color:       durumForm === d ? dc.color  : "#94A3B8",
                        }}>
                        {dc.label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={notForm}
                  onChange={e => setNotForm(e.target.value)}
                  rows={3}
                  placeholder="Yönetici notu (isteğe bağlı)..."
                  className="w-full border-2 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                  style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <button onClick={() => setSelected(null)}
                className="flex-1 border-2 border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
              <button onClick={handleDurumGuncelle} disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "#0B6B3A" }}>
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
