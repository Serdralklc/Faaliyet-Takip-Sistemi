"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type Tab = "ilkogretim" | "lise" | "universite" | "ortak";

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const DONEMLER: Record<Tab, { value: string; label: string }[]> = {
  ilkogretim: [
    { value: "DONEM_1",    label: "1. Dönem" },
    { value: "DONEM_2",    label: "2. Dönem" },
    { value: "YAZ_DONEMI", label: "Yaz Dönemi" },
  ],
  lise: [
    { value: "DONEM_1", label: "1. Dönem" },
    { value: "DONEM_2", label: "2. Dönem" },
  ],
  universite: [
    { value: "DONEM_1", label: "1. Dönem" },
    { value: "DONEM_2", label: "2. Dönem" },
  ],
  ortak: [
    { value: "DONEM_1", label: "1. Dönem" },
    { value: "DONEM_2", label: "2. Dönem" },
  ],
};

const FIELDS: Record<Tab, { key: string; label: string; suffix?: string }[]> = {
  ilkogretim: [
    { key: "ik_toplamDergah",          label: "Toplam Dergah Sayısı",                   suffix: "dergah"   },
    { key: "ik_kursuYapilanDergah",    label: "Hafta Sonu Kursu Yapılan Dergah",        suffix: "dergah"   },
    { key: "ik_egitmenSayisi",         label: "Eğitmen Sayısı",                         suffix: "kişi"     },
    { key: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcısı Sayısı",              suffix: "kişi"     },
    { key: "ik_elifBaOgrenci",         label: "Elif Ba'dan Başlayan Öğrenci",           suffix: "öğrenci"  },
    { key: "ik_kuranOgrenci",          label: "Kuran-ı Kerim'den Başlayan Öğrenci",     suffix: "öğrenci"  },
    { key: "ik_gecisOgrenci",          label: "Elif Ba'dan Kuran'a Geçen Öğrenci",      suffix: "öğrenci"  },
  ],
  lise: [
    { key: "ls_toplamDergah",        label: "Toplam Dergah Sayısı",              suffix: "dergah"   },
    { key: "ls_ilimDersYeri",        label: "İlim Dersleri Yapılan Yer Sayısı",  suffix: "yer"      },
    { key: "ls_ilimDersKatilim",     label: "İlim Derslerine Katılan Öğrenci",   suffix: "öğrenci"  },
    { key: "ls_toplamFaaliyet",      label: "Toplam Faaliyet Sayısı",            suffix: "faaliyet" },
    { key: "ls_yeniIntisap",         label: "Yeni İntisap Sayısı",               suffix: "kişi"     },
    // Sabah namazı ve kafile alanları "Ortak Faaliyetler" sekmesinde girilir
  ],
  universite: [
    { key: "uni_toplamDergah",        label: "Toplam Dergah Sayısı",                     suffix: "dergah"   },
    { key: "uni_ilimDersYeri",        label: "İlim Dersleri Yapılan Yer Sayısı",         suffix: "yer"      },
    { key: "uni_ilimDersKatilim",     label: "İlim Derslerine Katılan Öğrenci",          suffix: "öğrenci"  },
    { key: "uni_toplamFaaliyet",      label: "Toplam Faaliyet Sayısı",                   suffix: "faaliyet" },
    { key: "uni_kykBulusmaSayisi",    label: "KYK Buluşma Sayısı",                       suffix: "buluşma"  },
    { key: "uni_kykKatilim",          label: "KYK Buluşmalarına Katılan Öğrenci",        suffix: "öğrenci"  },
    { key: "uni_yeniIntisap",         label: "Yeni İntisap Sayısı",                      suffix: "kişi"     },
    // Sabah namazı ve kafile alanları "Ortak Faaliyetler" sekmesinde girilir
  ],
  ortak: [
    { key: "ortakKafileSayisi",           label: "Ortak Kafile Sayısı",                   suffix: "kafile"   },
    { key: "ortakKafileLiseKatilim",      label: "Kafileye Katılan Liseli Öğrenci",        suffix: "öğrenci"  },
    { key: "ortakKafileUniKatilim",       label: "Kafileye Katılan Üniversiteli Öğrenci",  suffix: "öğrenci"  },
    { key: "ortakSabahNamaziSayisi",      label: "Ortak Sabah Namazı Buluşma Sayısı",      suffix: "buluşma"  },
    { key: "ortakSabahNamaziLiseKatilim", label: "Sabah Namazına Katılan Liseli",           suffix: "öğrenci"  },
    { key: "ortakSabahNamaziUniKatilim",  label: "Sabah Namazına Katılan Üniversiteli",     suffix: "öğrenci"  },
  ],
};

const HEADER: Record<Tab, { label: string; color: string; desc: string }> = {
  ilkogretim: { label: "İlköğretim Birimi",  color: "#006B3F", desc: "Dini eğitim kurs verileri"          },
  lise:        { label: "Lise Birimi",        color: "#0369A1", desc: "Lise öğrencilerine yönelik faaliyetler"       },
  universite:  { label: "Üniversite Birimi",  color: "#7C3AED", desc: "Üniversite öğrencilerine yönelik faaliyetler" },
  ortak:       { label: "Ortak Faaliyetler",  color: "#B45309", desc: "Liseli ve üniversiteli birlikte katıldığı ortak kafile / sabah namazı" },
};

function NumberInput({ label, value, suffix, onChange, accent }: {
  label: string; value: number; suffix?: string;
  onChange: (v: number) => void; accent?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  const display = focused ? (value === 0 ? "" : String(value)) : String(value);

  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="relative">
        <input
          type="number" min={0}
          value={display}
          placeholder="0"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold border-2 focus:outline-none transition"
          style={{
            background: "var(--bg-input)",
            borderColor: focused && accent ? accent : "var(--border-input)",
            color: "var(--text-primary)",
          }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
            style={{ color: "var(--text-muted)" }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function FaaliyetForm({ activeTab }: { activeTab: Tab }) {
  const { data: session } = useSession();
  const [yil, setYil] = useState(THIS_YEAR);
  const [donem, setDonem] = useState("DONEM_1");
  const [form, setForm] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loaded, setLoaded] = useState(false);

  const fields = FIELDS[activeTab];
  const donemler = DONEMLER[activeTab];
  const header = HEADER[activeTab];

  useEffect(() => {
    const valid = donemler.some(d => d.value === donem);
    if (!valid) setDonem("DONEM_1");
  }, [activeTab]);

  useEffect(() => {
    if (!session?.user?.activeIlId) return;
    setLoaded(false);
    fetch(`/api/faaliyetler?ilId=${session.user.activeIlId}&yil=${yil}&donem=${donem}&single=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const vals: Record<string, number> = {};
        fields.forEach(f => { vals[f.key] = data?.[f.key] ?? 0; });
        setForm(vals);
        setLoaded(true);
      });
  }, [session?.user?.activeIlId, yil, donem, activeTab]);

  function handleChange(key: string, val: number) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.activeIlId) return;
    setStatus("loading");
    const res = await fetch("/api/faaliyetler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ilId: session.user.activeIlId, yil, donem, ...form }),
    });
    setStatus(res.ok ? "success" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="sv-page-header">
        <h1>{header.label}</h1>
        <p>{header.desc}</p>
      </div>

      {/* Dönem seçici */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-2xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}>Yıl</label>
          <select value={yil} onChange={e => setYil(Number(e.target.value))}
            className="border-2 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none transition"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}>Dönem</label>
          <div className="flex gap-2">
            {donemler.map(d => (
              <button key={d.value} type="button"
                onClick={() => setDonem(d.value)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition"
                style={donem === d.value
                  ? { background: header.color, color: "#fff", borderColor: header.color }
                  : { background: "var(--bg-input)", color: "var(--text-muted)", borderColor: "var(--border-input)" }
                }>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        {loaded && (
          <div className="flex items-end">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
              {yil} / {donemler.find(d => d.value === donem)?.label}
            </span>
          </div>
        )}
      </div>

      {/* Ortak faaliyetler bilgi notu */}
      {activeTab === "ortak" && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "#FFF7ED", borderColor: "#FCD34D" }}>
          <span className="text-xl mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "#92400E" }}>Ortak Faaliyetler Hakkında</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              Bu bölüme yalnızca hem liseli hem üniversiteli öğrencilerin <strong>birlikte</strong> katıldığı
              kafile ve sabah namazı buluşmalarını girin. Yalnızca bir gruba ait etkinlikleri
              ilgili birim sayfasından kaydedin.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="sv-section mb-6 overflow-hidden">
          <div className="px-6 py-4" style={{ background: header.color }}>
            <h2 className="text-white font-bold text-base">{header.label}</h2>
            <p className="text-white/60 text-xs mt-0.5">
              {yil} / {donemler.find(d => d.value === donem)?.label}
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fields.map(f => (
              <NumberInput
                key={f.key}
                label={f.label}
                suffix={f.suffix}
                value={form[f.key] ?? 0}
                onChange={v => handleChange(f.key, v)}
                accent={header.color}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === "loading"}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition shadow-sm text-white"
            style={{
              background: status === "success" ? "#059669"
                : status === "error" ? "#DC2626"
                : status === "loading" ? "#9CA3AF"
                : header.color,
            }}>
            {status === "loading" && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {status === "idle"    && "Kaydet"}
            {status === "loading" && "Kaydediliyor..."}
            {status === "success" && "✓ Kaydedildi"}
            {status === "error"   && "✕ Hata oluştu"}
          </button>
          {status === "success" && (
            <p className="text-sm font-semibold" style={{ color: "#059669" }}>Veriler başarıyla kaydedildi.</p>
          )}
          {status === "error" && (
            <p className="text-sm font-semibold text-red-600">Kayıt sırasında hata oluştu, tekrar deneyin.</p>
          )}
        </div>
      </form>
    </div>
  );
}
