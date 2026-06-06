"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Tab = "ilkogretim" | "lise" | "universite";

const TABS: { key: Tab; label: string }[] = [
  { key: "ilkogretim", label: "İlköğretim" },
  { key: "lise", label: "Lise" },
  { key: "universite", label: "Üniversite" },
];

const DONEMLER = [
  { value: "DONEM_1", label: "1. Dönem" },
  { value: "DONEM_2", label: "2. Dönem" },
  { value: "YAZ_DONEMI", label: "Yaz Dönemi" },
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const FIELDS: Record<Tab, { key: string; label: string; suffix?: string }[]> = {
  ilkogretim: [
    { key: "ik_toplamDergah",          label: "Toplam Dergah Sayısı", suffix: "dergah" },
    { key: "ik_kursuYapilanDergah",    label: "Hafta Sonu Kursu Yapılan Dergah", suffix: "dergah" },
    { key: "ik_egitmenSayisi",         label: "Eğitmen Sayısı", suffix: "kişi" },
    { key: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcısı Sayısı", suffix: "kişi" },
    { key: "ik_elifBaOgrenci",         label: "Elif Ba'dan Başlayan Öğrenci", suffix: "öğrenci" },
    { key: "ik_kuranOgrenci",          label: "Kuran-ı Kerim'den Başlayan Öğrenci", suffix: "öğrenci" },
    { key: "ik_gecisOgrenci",          label: "Elif Ba'dan Kuran'a Geçen Öğrenci", suffix: "öğrenci" },
  ],
  lise: [
    { key: "ls_toplamDergah",       label: "Toplam Dergah Sayısı", suffix: "dergah" },
    { key: "ls_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı", suffix: "yer" },
    { key: "ls_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci", suffix: "öğrenci" },
    { key: "ls_sabahNamaziSayisi",  label: "Sabah Namazı Buluşma Sayısı", suffix: "buluşma" },
    { key: "ls_sabahNamaziKatilim", label: "Sabah Namazına Katılan Liseli", suffix: "öğrenci" },
    { key: "ls_kafileSayisi",       label: "Yapılan Kafile Sayısı", suffix: "kafile" },
    { key: "ls_kafileOgrenci",      label: "Kafile ile Giden Liseli Öğrenci", suffix: "öğrenci" },
    { key: "ls_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı", suffix: "faaliyet" },
    { key: "ls_yeniIntisap",        label: "Yeni İntisap Sayısı", suffix: "kişi" },
  ],
  universite: [
    { key: "uni_toplamDergah",       label: "Toplam Dergah Sayısı", suffix: "dergah" },
    { key: "uni_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı", suffix: "yer" },
    { key: "uni_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci", suffix: "öğrenci" },
    { key: "uni_sabahNamaziSayisi",  label: "Sabah Namazı Buluşma Sayısı", suffix: "buluşma" },
    { key: "uni_sabahNamaziKatilim", label: "Sabah Namazına Katılan Üniversiteli", suffix: "öğrenci" },
    { key: "uni_kafileSayisi",       label: "Üniversite Kafile Sayısı", suffix: "kafile" },
    { key: "uni_kafileOgrenci",      label: "Kafile ile Giden Üniversiteli", suffix: "öğrenci" },
    { key: "uni_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı", suffix: "faaliyet" },
    { key: "uni_kykBulusmaSayisi",   label: "KYK Buluşma Sayısı", suffix: "buluşma" },
    { key: "uni_kykKatilim",         label: "KYK Buluşmalarına Katılan Öğrenci", suffix: "öğrenci" },
    { key: "uni_yeniIntisap",        label: "Yeni İntisap Sayısı", suffix: "kişi" },
  ],
};

function NumberInput({ label, value, suffix, onChange }: {
  label: string; value: number; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="group">
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="relative">
        <input
          type="number" min={0} value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-16"
          style={{
            background: "var(--bg-input)",
            borderColor: "var(--border-input)",
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

  // Mevcut veriyi çek
  useEffect(() => {
    if (!session?.user?.activeIlId) return;
    setLoaded(false);
    fetch(`/api/faaliyetler?ilId=${session.user.activeIlId}&yil=${yil}&donem=${donem}&single=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const vals: Record<string, number> = {};
          fields.forEach(f => { vals[f.key] = data[f.key] ?? 0; });
          setForm(vals);
        } else {
          const vals: Record<string, number> = {};
          fields.forEach(f => { vals[f.key] = 0; });
          setForm(vals);
        }
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
      body: JSON.stringify({
        ilId: session.user.activeIlId,
        yil, donem,
        ...form,
      }),
    });
    setStatus(res.ok ? "success" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  const tabColors: Record<Tab, string> = {
    ilkogretim: "text-blue-600 border-blue-600",
    lise: "text-green-600 border-green-600",
    universite: "text-purple-600 border-purple-600",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Faaliyet Yönetimi</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Dönem bazında faaliyet verilerini girin ve kaydedin</p>
      </div>

      {/* Sekmeler */}
      <div className="flex border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {TABS.map(tab => (
          <Link key={tab.key}
            href={`/panel/il/faaliyet/${tab.key}`}
            className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? tabColors[tab.key]
                : "border-transparent hover:border-gray-300"
            }`}
            style={activeTab !== tab.key ? { color: "var(--text-muted)" } : {}}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Dönem Seçici */}
      <div className="flex gap-4 mb-6 p-4 rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Yıl</label>
          <select value={yil} onChange={e => setYil(Number(e.target.value))}
            className="border-2 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Dönem</label>
          <select value={donem} onChange={e => setDonem(e.target.value)}
            className="border-2 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
            {DONEMLER.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        {loaded && (
          <div className="flex items-end pb-0.5">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {yil} / {DONEMLER.find(d => d.value === donem)?.label}
            </span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className={`px-5 py-4 ${
            activeTab === "ilkogretim" ? "bg-blue-600" :
            activeTab === "lise" ? "bg-green-600" : "bg-purple-600"
          }`}>
            <h2 className="text-white font-bold text-lg">
              {activeTab === "ilkogretim" ? "İlköğretim Birimi" : activeTab === "lise" ? "Lise Birimi" : "Üniversite Birimi"}
            </h2>
            <p className="text-white/70 text-xs mt-0.5">{fields.length} alan · {yil} / {DONEMLER.find(d => d.value === donem)?.label}</p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fields.map(f => (
              <NumberInput
                key={f.key}
                label={f.label}
                suffix={f.suffix}
                value={form[f.key] ?? 0}
                onChange={v => handleChange(f.key, v)}
              />
            ))}
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === "loading"}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition shadow-sm ${
              status === "loading" ? "bg-blue-400 cursor-not-allowed" :
              status === "success" ? "bg-green-600 hover:bg-green-700" :
              status === "error"   ? "bg-red-600 hover:bg-red-700" :
              "bg-blue-600 hover:bg-blue-700"
            } text-white`}>
            {status === "loading" && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {status === "idle"    && "Kaydet"}
            {status === "loading" && "Kaydediliyor..."}
            {status === "success" && "✓ Kaydedildi"}
            {status === "error"   && "✕ Hata oluştu"}
          </button>

          {status === "success" && (
            <p className="text-sm font-semibold text-green-600">Veriler başarıyla kaydedildi.</p>
          )}
          {status === "error" && (
            <p className="text-sm font-semibold text-red-600">Kayıt sırasında bir hata oluştu, tekrar deneyin.</p>
          )}
        </div>
      </form>
    </div>
  );
}
