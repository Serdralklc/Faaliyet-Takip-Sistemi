"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Tab = "evler" | "apartlar" | "yurtlar";

const TABS: { key: Tab; label: string }[] = [
  { key: "evler",    label: "Evler" },
  { key: "apartlar", label: "Apartlar" },
  { key: "yurtlar",  label: "Yurtlar" },
];

const DONEMLER = [
  { value: "DONEM_1", label: "1. Dönem" },
  { value: "DONEM_2", label: "2. Dönem" },
  { value: "YAZ_DONEMI", label: "Yaz Dönemi" },
];
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

type TabFields = {
  mevcut: { key: string; label: string };
  acilacak: { key: string; label: string };
  kapanacak: { key: string; label: string };
  extra?: { key: string; label: string; suffix?: string }[];
};

const TAB_FIELDS: Record<Tab, TabFields> = {
  evler: {
    mevcut:    { key: "eay_mevcutEv",    label: "Mevcut Ev Sayısı" },
    acilacak:  { key: "eay_acilacakEv",  label: "Açılacak Ev" },
    kapanacak: { key: "eay_kapanacakEv", label: "Kapanacak Ev" },
    extra: [
      { key: "eay_bursBalan",    label: "Burs Alan Sayısı",   suffix: "kişi" },
      { key: "eay_iliskiKesme",  label: "İlişki Kesme Talebi", suffix: "kişi" },
      { key: "eay_toplamZiyaret",label: "Toplam Ziyaret Sayısı", suffix: "ziyaret" },
    ],
  },
  apartlar: {
    mevcut:    { key: "eay_mevcutApart",    label: "Mevcut Apart Sayısı" },
    acilacak:  { key: "eay_acilacakApart",  label: "Açılacak Apart" },
    kapanacak: { key: "eay_kapanacakApart", label: "Kapanacak Apart" },
  },
  yurtlar: {
    mevcut:    { key: "eay_mevcutYurt",    label: "Mevcut Yurt Sayısı" },
    acilacak:  { key: "eay_acilacakYurt",  label: "Açılacak Yurt" },
    kapanacak: { key: "eay_kapanacakYurt", label: "Kapanacak Yurt" },
  },
};

function NumberInput({ label, value, suffix, onChange, color }: {
  label: string; value: number; suffix?: string; onChange: (v: number) => void;
  color?: "green" | "red" | "gray";
}) {
  const borderColor = color === "green" ? "#22c55e" : color === "red" ? "#ef4444" : undefined;
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="relative">
        <input
          type="number" min={0} value={value === 0 ? "" : value} placeholder="0"
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-16"
          style={{
            background: "var(--bg-input)",
            borderColor: borderColor ?? "var(--border-input)",
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

export function BarinmaForm({ activeTab }: { activeTab: Tab }) {
  const { data: session } = useSession();
  const [yil, setYil] = useState(THIS_YEAR);
  const [donem, setDonem] = useState("DONEM_1");
  const [form, setForm] = useState<Record<string, number>>({});
  const [muaf, setMuaf] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const tabDef = TAB_FIELDS[activeTab];
  const allKeys = [
    tabDef.mevcut.key, tabDef.acilacak.key, tabDef.kapanacak.key,
    ...(tabDef.extra?.map(e => e.key) ?? []),
  ];

  useEffect(() => {
    if (!session?.user?.activeIlId) return;
    fetch(`/api/faaliyetler?ilId=${session.user.activeIlId}&yil=${yil}&donem=${donem}&single=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const vals: Record<string, number> = {};
        allKeys.forEach(k => { vals[k] = data?.[k] ?? 0; });
        setForm(vals);
        setMuaf(!!data?.muafBarinma);
      });
  }, [session?.user?.activeIlId, yil, donem, activeTab]);

  function set(key: string, val: number) { setForm(p => ({ ...p, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.activeIlId) return;
    setStatus("loading");
    const res = await fetch("/api/faaliyetler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ilId: session.user.activeIlId, yil, donem, ...form,
        // Muafiyet yalnızca "Evler" sekmesinden yönetilir (tek bayrak tüm barınmayı kapsar)
        ...(activeTab === "evler" ? { muafBarinma: muaf } : {}),
      }),
    });
    setStatus(res.ok ? "success" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  const tabColor = { evler: "bg-orange-600", apartlar: "bg-red-600", yurtlar: "bg-teal-600" }[activeTab];
  const tabTitle = { evler: "Evler", apartlar: "Apartlar", yurtlar: "Yurtlar" }[activeTab];

  const mevcut = form[tabDef.mevcut.key] ?? 0;
  const acilacak = form[tabDef.acilacak.key] ?? 0;
  const kapanacak = form[tabDef.kapanacak.key] ?? 0;
  const tahmini = mevcut + acilacak - kapanacak;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Barınma Yönetimi</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Ev, apart ve yurt takibini dönem bazında yönetin</p>
      </div>

      {/* Sekmeler */}
      <div className="flex border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {TABS.map(tab => (
          <Link key={tab.key} href={`/panel/il/barinma/${tab.key}`}
            className={`px-5 py-3 text-sm font-bold border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? "text-orange-600 border-orange-600"
                : "border-transparent hover:border-border"
            }`}
            style={activeTab !== tab.key ? { color: "var(--text-muted)" } : {}}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Dönem seçici */}
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
      </div>

      {/* Barınma muafiyeti — "ilimizde ev/apart/yurt yoktur" (yalnızca Evler sekmesinde yönetilir) */}
      {activeTab === "evler" ? (
        <label className="mb-6 flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition select-none"
          style={muaf
            ? { background: "#FEF3C7", borderColor: "#F59E0B" }
            : { background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <input type="checkbox" checked={muaf}
            onChange={e => setMuaf(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: muaf ? "#92400E" : "var(--text-primary)" }}>
              İlimizde ev / apart / yurt bulunmamaktadır
            </p>
            <p className="text-xs mt-0.5" style={{ color: muaf ? "#B45309" : "var(--text-muted)" }}>
              İşaretlerseniz barınma bu dönem için <strong>muaf</strong> sayılır; bölge eğitimcisi ekranında
              “veri girilmedi” yerine <strong>“ev/apart/yurt yoktur”</strong> görünür. Durum değişirse işareti
              kaldırıp veri girebilirsiniz.
            </p>
          </div>
        </label>
      ) : muaf ? (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "#FEF3C7", borderColor: "#F59E0B" }}>
          <span className="text-lg mt-0.5">🚫</span>
          <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
            Bu il bu dönem için barınmadan muaf işaretlenmiş. Değiştirmek için <strong>Evler</strong> sekmesini kullanın.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={muaf && activeTab !== "evler" ? "hidden" : ""}>
        {muaf && (
          <div className="mb-6 p-8 rounded-xl border text-center"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-3xl mb-2">🚫</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Barınma bu dönem için muaf işaretlendi
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Alanlar gizlendi. Kaydetmek için “Kaydet”e basın. Yukarıdaki işareti kaldırıp veri girebilirsiniz.
            </p>
          </div>
        )}

        {/* Özet kartları */}
        <div className={`grid grid-cols-3 gap-3 mb-6 ${muaf ? "hidden" : ""}`}>
          {[
            { label: "Mevcut", val: mevcut, color: "bg-blue-50 border-blue-200 text-blue-800" },
            { label: "Tahmini Dönem Sonu", val: tahmini, color: "bg-green-50 border-green-200 text-green-800" },
            { label: "Net Değişim", val: acilacak - kapanacak, color: (acilacak - kapanacak) >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700" },
          ].map(c => (
            <div key={c.label} className={`rounded-xl border p-4 text-center ${c.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{c.label}</p>
              <p className="text-3xl font-black mt-1">{c.val >= 0 ? c.val : c.val}</p>
              <p className="text-xs mt-0.5 opacity-60">{tabTitle.toLowerCase()}</p>
            </div>
          ))}
        </div>

        {/* Ana kartlar */}
        <div className={`rounded-xl border overflow-hidden mb-6 ${muaf ? "hidden" : ""}`} style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className={`px-5 py-4 ${tabColor}`}>
            <h2 className="text-white font-bold text-lg">{tabTitle} Takibi</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <NumberInput label={tabDef.mevcut.label}    value={form[tabDef.mevcut.key] ?? 0}    onChange={v => set(tabDef.mevcut.key, v)}    color="gray" suffix={activeTab === "evler" ? "ev" : activeTab === "apartlar" ? "apart" : "yurt"} />
            <NumberInput label={tabDef.acilacak.label}  value={form[tabDef.acilacak.key] ?? 0}  onChange={v => set(tabDef.acilacak.key, v)}  color="green" suffix="adet" />
            <NumberInput label={tabDef.kapanacak.label} value={form[tabDef.kapanacak.key] ?? 0} onChange={v => set(tabDef.kapanacak.key, v)} color="red" suffix="adet" />
          </div>
        </div>

        {/* Extra alanlar (Evler için) */}
        {!muaf && tabDef.extra && tabDef.extra.length > 0 && (
          <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Ek Bilgiler</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {tabDef.extra.map(f => (
                <NumberInput key={f.key} label={f.label} value={form[f.key] ?? 0} suffix={f.suffix} onChange={v => set(f.key, v)} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === "loading"}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition shadow-sm text-white ${
              status === "loading" ? "bg-blue-400 cursor-not-allowed" :
              status === "success" ? "bg-green-600 hover:bg-green-700" :
              status === "error"   ? "bg-red-600 hover:bg-red-700" :
              "bg-blue-600 hover:bg-blue-700"
            }`}>
            {status === "loading" && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            {status === "idle" && "Kaydet"}
            {status === "loading" && "Kaydediliyor..."}
            {status === "success" && "✓ Kaydedildi"}
            {status === "error"   && "✕ Hata oluştu"}
          </button>
          {status === "success" && <p className="text-sm font-semibold text-green-600">Veriler başarıyla kaydedildi.</p>}
          {status === "error"   && <p className="text-sm font-semibold text-red-600">Kayıt sırasında bir hata oluştu.</p>}
        </div>
      </form>
    </div>
  );
}
