"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type Tab = "ilkogretim" | "lise" | "universite";

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
    { key: "ls_toplamDergah",       label: "Toplam Dergah Sayısı",              suffix: "dergah"   },
    { key: "ls_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı",  suffix: "yer"      },
    { key: "ls_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci",   suffix: "öğrenci"  },
    { key: "ls_sabahNamaziSayisi",  label: "Lise Sabah Namazı Buluşma",         suffix: "buluşma"  },
    { key: "ls_sabahNamaziKatilim", label: "Sabah Namazına Katılan Liseli",     suffix: "öğrenci"  },
    { key: "ls_kafileSayisi",       label: "Lise Kafile Sayısı",                suffix: "kafile"   },
    { key: "ls_kafileOgrenci",      label: "Kafile ile Giden Liseli Öğrenci",   suffix: "öğrenci"  },
    { key: "ls_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı",            suffix: "faaliyet" },
    { key: "ls_yeniIntisap",        label: "Yeni İntisap Sayısı",               suffix: "kişi"     },
  ],
  universite: [
    { key: "uni_toplamDergah",       label: "Toplam Dergah Sayısı",                     suffix: "dergah"   },
    { key: "uni_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı",         suffix: "yer"      },
    { key: "uni_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci",          suffix: "öğrenci"  },
    { key: "uni_sabahNamaziSayisi",  label: "Üniversite Sabah Namazı Buluşma",          suffix: "buluşma"  },
    { key: "uni_sabahNamaziKatilim", label: "Sabah Namazına Katılan Üniversiteli",      suffix: "öğrenci"  },
    { key: "uni_kafileSayisi",       label: "Üniversite Kafile Sayısı",                 suffix: "kafile"   },
    { key: "uni_kafileOgrenci",      label: "Kafile ile Giden Üniversiteli",            suffix: "öğrenci"  },
    { key: "uni_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı",                   suffix: "faaliyet" },
    { key: "uni_kykBulusmaSayisi",   label: "KYK Buluşma Sayısı",                      suffix: "buluşma"  },
    { key: "uni_kykKatilim",         label: "KYK Buluşmalarına Katılan Öğrenci",        suffix: "öğrenci"  },
    { key: "uni_yeniIntisap",        label: "Yeni İntisap Sayısı",                      suffix: "kişi"     },
  ],
};

// Ortak faaliyet alanları — her iki birimde de gösterilir, aynı Activity kaydına yazılır
const ORTAK_KAFILE_FIELDS = [
  { key: "ortakKafileSayisi",      label: "Ortak Kafile Sayısı",             suffix: "kafile"  },
  { key: "ortakKafileLiseKatilim", label: "Ortak Kafileye Katılan Liseli",   suffix: "öğrenci" },
  { key: "ortakKafileUniKatilim",  label: "Ortak Kafileye Katılan Üniv.",    suffix: "öğrenci" },
];

const ORTAK_SABAH_FIELDS = [
  { key: "ortakSabahNamaziSayisi",      label: "Ortak Sabah Namazı Buluşma",        suffix: "buluşma"  },
  { key: "ortakSabahNamaziLiseKatilim", label: "Katılan Liseli",                    suffix: "öğrenci" },
  { key: "ortakSabahNamaziUniKatilim",  label: "Katılan Üniversiteli",              suffix: "öğrenci" },
];

const ALL_ORTAK_KEYS = [
  ...ORTAK_KAFILE_FIELDS.map(f => f.key),
  ...ORTAK_SABAH_FIELDS.map(f => f.key),
];

const HEADER: Record<Tab, { label: string; color: string }> = {
  ilkogretim: { label: "İlköğretim Birimi", color: "#006B3F" },
  lise:        { label: "Lise Birimi",       color: "#0369A1" },
  universite:  { label: "Üniversite Birimi", color: "#7C3AED" },
};

function NumberInput({ label, value, suffix, onChange, accent }: {
  label: string; value: number; suffix?: string;
  onChange: (v: number) => void; accent?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  const displayValue = focused ? (value === 0 ? "" : String(value)) : String(value);

  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="number" min={0}
          value={displayValue}
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
            style={{ color: "var(--text-muted)" }}>
            {suffix}
          </span>
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
  const showOrtak = activeTab === "lise" || activeTab === "universite";

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
        if (showOrtak) {
          ALL_ORTAK_KEYS.forEach(k => { vals[k] = data?.[k] ?? 0; });
        }
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

  const ortakAcent = "#EA580C"; // turuncu — ortak bölüm rengi

  return (
    <div className="p-6 max-w-5xl">
      <div className="sv-page-header">
        <h1>{header.label}</h1>
        <p>Dönem bazında faaliyet verilerini girin ve kaydedin</p>
      </div>

      {/* Yıl + Dönem seçici */}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Ana alanlar */}
        <div className="sv-section overflow-hidden">
          <div className="px-6 py-4" style={{ background: header.color }}>
            <h2 className="text-white font-bold text-base">{header.label}</h2>
            <p className="text-white/60 text-xs mt-0.5">
              {fields.length} alan · {yil} / {donemler.find(d => d.value === donem)?.label}
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

        {/* Ortak Kafile bölümü (Lise + Üniversite) */}
        {showOrtak && (
          <div className="sv-section overflow-hidden">
            <div className="px-6 py-4" style={{ background: ortakAcent }}>
              <h2 className="text-white font-bold text-base">🤝 Ortak Kafile</h2>
              <p className="text-white/70 text-xs mt-0.5">
                Lise ve üniversite öğrencilerinin birlikte katıldığı kafileler buraya girilir.
                Çift sayımı önlemek için bu alana girilir — birim alanlarına tekrar girilmez.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {ORTAK_KAFILE_FIELDS.map(f => (
                <NumberInput
                  key={f.key}
                  label={f.label}
                  suffix={f.suffix}
                  value={form[f.key] ?? 0}
                  onChange={v => handleChange(f.key, v)}
                  accent={ortakAcent}
                />
              ))}
            </div>
            <div className="px-6 pb-4">
              <p className="text-xs rounded-xl px-3 py-2 inline-block font-semibold"
                style={{ background: "#EA580C15", color: "#EA580C" }}>
                Toplam kafile = Lise kafilesi + Üniversite kafilesi + Ortak kafile
                ({(form["ls_kafileSayisi"] ?? 0) + (form["uni_kafileSayisi"] ?? 0) + (form["ortakKafileSayisi"] ?? 0)} toplam)
              </p>
            </div>
          </div>
        )}

        {/* Ortak Sabah Namazı bölümü */}
        {showOrtak && (
          <div className="sv-section overflow-hidden">
            <div className="px-6 py-4" style={{ background: "#6366F1" }}>
              <h2 className="text-white font-bold text-base">🤝 Ortak Sabah Namazı</h2>
              <p className="text-white/70 text-xs mt-0.5">
                Lise ve üniversite öğrencilerinin birlikte katıldığı sabah namazı buluşmaları.
              </p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {ORTAK_SABAH_FIELDS.map(f => (
                <NumberInput
                  key={f.key}
                  label={f.label}
                  suffix={f.suffix}
                  value={form[f.key] ?? 0}
                  onChange={v => handleChange(f.key, v)}
                  accent="#6366F1"
                />
              ))}
            </div>
            <div className="px-6 pb-4">
              <p className="text-xs rounded-xl px-3 py-2 inline-block font-semibold"
                style={{ background: "#6366F115", color: "#6366F1" }}>
                Toplam sabah namazı = Lise + Üniversite + Ortak
                ({(form["ls_sabahNamaziSayisi"] ?? 0) + (form["uni_sabahNamaziSayisi"] ?? 0) + (form["ortakSabahNamaziSayisi"] ?? 0)} toplam)
              </p>
            </div>
          </div>
        )}

        {/* Kaydet butonu */}
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
