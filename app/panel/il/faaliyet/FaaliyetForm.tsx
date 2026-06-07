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

/* ─── Alan tanımları ─── */
type NormalField = {
  type?: "normal";
  key: string;
  label: string;
  suffix?: string;
};

type SelectGroupField = {
  type: "select-group";
  label: string;
  suffix?: string;
  /* Her seçenek hangi key'e yazılacak */
  options: { label: string; key: string }[];
  /* Seçili option değişince ek alanlar göster */
  extraKeys?: {
    [optionKey: string]: { key: string; label: string; suffix?: string }[];
  };
};

type Field = NormalField | SelectGroupField;

const FIELDS: Record<Tab, Field[]> = {
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
    {
      type: "select-group",
      label: "Sabah Namazı Buluşma",
      suffix: "buluşma",
      options: [
        { label: "Lise Sabah Namazı",  key: "ls_sabahNamaziSayisi"     },
        { label: "Ortak Sabah Namazı", key: "ortakSabahNamaziSayisi"   },
      ],
      extraKeys: {
        ls_sabahNamaziSayisi: [
          { key: "ls_sabahNamaziKatilim", label: "Katılan Liseli", suffix: "öğrenci" },
        ],
        ortakSabahNamaziSayisi: [
          { key: "ortakSabahNamaziLiseKatilim", label: "Katılan Liseli",       suffix: "öğrenci" },
          { key: "ortakSabahNamaziUniKatilim",  label: "Katılan Üniversiteli", suffix: "öğrenci" },
        ],
      },
    },
    {
      type: "select-group",
      label: "Kafile",
      suffix: "kafile",
      options: [
        { label: "Lise Kafilesi",  key: "ls_kafileSayisi"     },
        { label: "Ortak Kafile",   key: "ortakKafileSayisi"   },
      ],
      extraKeys: {
        ls_kafileSayisi: [
          { key: "ls_kafileOgrenci", label: "Kafile ile Giden Liseli", suffix: "öğrenci" },
        ],
        ortakKafileSayisi: [
          { key: "ortakKafileLiseKatilim", label: "Katılan Liseli",       suffix: "öğrenci" },
          { key: "ortakKafileUniKatilim",  label: "Katılan Üniversiteli", suffix: "öğrenci" },
        ],
      },
    },
    { key: "ls_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı",  suffix: "faaliyet" },
    { key: "ls_yeniIntisap",        label: "Yeni İntisap Sayısı",     suffix: "kişi"     },
  ],
  universite: [
    { key: "uni_toplamDergah",       label: "Toplam Dergah Sayısı",                     suffix: "dergah"   },
    { key: "uni_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı",         suffix: "yer"      },
    { key: "uni_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci",          suffix: "öğrenci"  },
    {
      type: "select-group",
      label: "Sabah Namazı Buluşma",
      suffix: "buluşma",
      options: [
        { label: "Üniversite Sabah Namazı", key: "uni_sabahNamaziSayisi"    },
        { label: "Ortak Sabah Namazı",      key: "ortakSabahNamaziSayisi"   },
      ],
      extraKeys: {
        uni_sabahNamaziSayisi: [
          { key: "uni_sabahNamaziKatilim", label: "Katılan Üniversiteli", suffix: "öğrenci" },
        ],
        ortakSabahNamaziSayisi: [
          { key: "ortakSabahNamaziLiseKatilim", label: "Katılan Liseli",       suffix: "öğrenci" },
          { key: "ortakSabahNamaziUniKatilim",  label: "Katılan Üniversiteli", suffix: "öğrenci" },
        ],
      },
    },
    {
      type: "select-group",
      label: "Kafile",
      suffix: "kafile",
      options: [
        { label: "Üniversite Kafilesi", key: "uni_kafileSayisi"     },
        { label: "Ortak Kafile",        key: "ortakKafileSayisi"    },
      ],
      extraKeys: {
        uni_kafileSayisi: [
          { key: "uni_kafileOgrenci", label: "Kafile ile Giden Üniversiteli", suffix: "öğrenci" },
        ],
        ortakKafileSayisi: [
          { key: "ortakKafileLiseKatilim", label: "Katılan Liseli",       suffix: "öğrenci" },
          { key: "ortakKafileUniKatilim",  label: "Katılan Üniversiteli", suffix: "öğrenci" },
        ],
      },
    },
    { key: "uni_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı",                   suffix: "faaliyet" },
    { key: "uni_kykBulusmaSayisi",   label: "KYK Buluşma Sayısı",                      suffix: "buluşma"  },
    { key: "uni_kykKatilim",         label: "KYK Buluşmalarına Katılan Öğrenci",        suffix: "öğrenci"  },
    { key: "uni_yeniIntisap",        label: "Yeni İntisap Sayısı",                      suffix: "kişi"     },
  ],
};

const HEADER: Record<Tab, { label: string; color: string }> = {
  ilkogretim: { label: "İlköğretim Birimi", color: "#006B3F" },
  lise:        { label: "Lise Birimi",       color: "#0369A1" },
  universite:  { label: "Üniversite Birimi", color: "#7C3AED" },
};

/* ─── Tüm select-group alanlarından key listesi çıkar (fetch için) ─── */
function getAllKeys(tab: Tab): string[] {
  const keys: string[] = [];
  for (const f of FIELDS[tab]) {
    if (!f.type || f.type === "normal") {
      keys.push((f as NormalField).key);
    } else {
      for (const opt of (f as SelectGroupField).options) keys.push(opt.key);
      for (const extras of Object.values((f as SelectGroupField).extraKeys ?? {})) {
        for (const e of extras) keys.push(e.key);
      }
    }
  }
  return [...new Set(keys)];
}

/* ─── Sayı Input ─── */
function NumberInput({ label, value, suffix, onChange, accent, compact }: {
  label: string; value: number; suffix?: string;
  onChange: (v: number) => void; accent?: string; compact?: boolean;
}) {
  const [focused, setFocused] = React.useState(false);
  const display = focused ? (value === 0 ? "" : String(value)) : String(value);

  return (
    <div className={compact ? "" : ""}>
      {!compact && (
        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}>{label}</label>
      )}
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

/* ─── Select-Group Input ─── */
function SelectGroupInput({
  field, form, onChange, accent,
}: {
  field: SelectGroupField;
  form: Record<string, number>;
  onChange: (key: string, val: number) => void;
  accent: string;
}) {
  /* Hangi option seçili? Değeri sıfırdan büyük olan onu seç, yoksa ilk seçenek */
  const activeOption = field.options.find(o => (form[o.key] ?? 0) > 0) ?? field.options[0];
  const [selected, setSelected] = React.useState(activeOption.key);

  React.useEffect(() => {
    const active = field.options.find(o => (form[o.key] ?? 0) > 0);
    if (active) setSelected(active.key);
  }, [form]);

  function handleSelectChange(newKey: string) {
    // Eski key'in değerini sıfırla, ekstra keylerini de sıfırla
    const old = field.options.find(o => o.key === selected);
    if (old) {
      onChange(old.key, 0);
      for (const e of field.extraKeys?.[old.key] ?? []) onChange(e.key, 0);
    }
    setSelected(newKey);
  }

  const extras = field.extraKeys?.[selected] ?? [];

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}>{field.label}</label>
      <div className="flex flex-wrap gap-3 items-start">
        {/* Dropdown */}
        <div className="flex-shrink-0">
          <select
            value={selected}
            onChange={e => handleSelectChange(e.target.value)}
            className="border-2 rounded-xl px-3 py-3 text-sm font-bold focus:outline-none transition"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border-input)",
              color: "var(--text-primary)",
              minWidth: 180,
            }}
          >
            {field.options.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Ana sayı */}
        <div className="w-36">
          <div className="relative">
            <input
              type="number" min={0}
              value={(() => {
                const v = form[selected] ?? 0;
                return v === 0 ? "" : String(v);
              })()}
              placeholder="0"
              onChange={e => onChange(selected, Number(e.target.value) || 0)}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold border-2 focus:outline-none transition"
              style={{
                background: "var(--bg-input)",
                borderColor: accent,
                color: "var(--text-primary)",
              }}
            />
            {field.suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                style={{ color: "var(--text-muted)" }}>{field.suffix}</span>
            )}
          </div>
        </div>

        {/* Ek alanlar (katılımcı sayıları) */}
        {extras.map(e => (
          <div key={e.key} className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}>{e.label}</label>
            <div className="relative w-32">
              <input
                type="number" min={0}
                value={(() => {
                  const v = form[e.key] ?? 0;
                  return v === 0 ? "" : String(v);
                })()}
                placeholder="0"
                onChange={ev => onChange(e.key, Number(ev.target.value) || 0)}
                className="w-full rounded-xl px-3 py-3 text-sm font-bold border-2 focus:outline-none transition"
                style={{
                  background: "var(--bg-input)",
                  borderColor: "var(--border-input)",
                  color: "var(--text-primary)",
                }}
              />
              {e.suffix && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                  style={{ color: "var(--text-muted)" }}>{e.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Ana Form ─── */
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
        getAllKeys(activeTab).forEach(k => { vals[k] = data?.[k] ?? 0; });
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

      <form onSubmit={handleSubmit}>
        <div className="sv-section mb-6 overflow-hidden">
          <div className="px-6 py-4" style={{ background: header.color }}>
            <h2 className="text-white font-bold text-base">{header.label}</h2>
            <p className="text-white/60 text-xs mt-0.5">
              {yil} / {donemler.find(d => d.value === donem)?.label}
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fields.map((f, i) => {
              if (f.type === "select-group") {
                return (
                  <SelectGroupInput
                    key={i}
                    field={f as SelectGroupField}
                    form={form}
                    onChange={handleChange}
                    accent={header.color}
                  />
                );
              }
              const nf = f as NormalField;
              return (
                <NumberInput
                  key={nf.key}
                  label={nf.label}
                  suffix={nf.suffix}
                  value={form[nf.key] ?? 0}
                  onChange={v => handleChange(nf.key, v)}
                  accent={header.color}
                />
              );
            })}
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
