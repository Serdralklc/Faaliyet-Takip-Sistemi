"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

const FIELDS: Record<Tab, { key: string; label: string; suffix?: string; group?: string }[]> = {
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
    // Öğrenci ve Dergâh Bilgileri
    { key: "ls_toplamDergah",        label: "Toplam Dergâh Sayısı",                      suffix: "dergah",   group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "ls_ilimSohbetDergah",    label: "İlim/Sohbet Faaliyeti Yapılan Dergâh",      suffix: "dergah",   group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "ls_liseliOgrenciSayisi", label: "Toplam Liseli Öğrenci Sayısı",              suffix: "öğrenci",  group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "ls_mezunOgrenci",        label: "Bu Yıl Mezun Olacak Liseli Öğrenci",        suffix: "öğrenci",  group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "ls_yeniIntisap",         label: "Toplam Yeni İntisap Eden Öğrenci",          suffix: "öğrenci",  group: "Öğrenci ve Dergâh Bilgileri" },
    // İlim / Sohbet Faaliyetleri
    { key: "ls_ilimSohbetSayisi",    label: "Toplam İlim/Sohbet Faaliyeti Sayısı",       suffix: "faaliyet", group: "İlim / Sohbet Faaliyetleri" },
    { key: "ls_ilimSohbetKatilim",   label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "İlim / Sohbet Faaliyetleri" },
    // Sosyal Faaliyetler
    { key: "ls_sosyalSayisi",        label: "Toplam Sosyal Faaliyet Sayısı",             suffix: "faaliyet", group: "Sosyal Faaliyetler" },
    { key: "ls_sosyalKatilim",       label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Sosyal Faaliyetler" },
    // Sosyal Sorumluluk Faaliyetleri
    { key: "ls_sorumlulukSayisi",    label: "Toplam Sosyal Sorumluluk Faaliyeti Sayısı", suffix: "faaliyet", group: "Sosyal Sorumluluk Faaliyetleri" },
    { key: "ls_sorumlulukKatilim",   label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Sosyal Sorumluluk Faaliyetleri" },
    // Muhabbet Buluşmaları
    { key: "ls_muhabbetSayisi",      label: "Toplam Muhabbet Buluşması Sayısı",          suffix: "buluşma",  group: "Muhabbet Buluşmaları" },
    { key: "ls_muhabbetKatilim",     label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Muhabbet Buluşmaları" },
    // Namaz Buluşmaları
    { key: "ls_namazSayisi",         label: "Toplam Namaz Buluşması Sayısı",             suffix: "buluşma",  group: "Namaz Buluşmaları" },
    { key: "ls_namazKatilim",        label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Namaz Buluşmaları" },
    // Kafile Faaliyetleri
    { key: "ls_kafileSayisi",        label: "Toplam Kafile Sayısı",                      suffix: "kafile",   group: "Kafile Faaliyetleri" },
    { key: "ls_kafileOgrenci",       label: "Kafilelere Katılan Toplam Öğrenci",         suffix: "öğrenci",  group: "Kafile Faaliyetleri" },
  ],
  universite: [
    // Öğrenci ve Dergâh Bilgileri
    { key: "uni_toplamDergah",              label: "Toplam Dergâh Sayısı",                  suffix: "dergah",   group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "uni_ilimSohbetDergah",          label: "İlim/Sohbet Faaliyeti Yapılan Dergâh",  suffix: "dergah",   group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "uni_universiteliOgrenciSayisi", label: "Toplam Üniversite Öğrenci Sayısı",      suffix: "öğrenci",  group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "uni_sonSinifOgrenci",           label: "Son Sınıf Üniversite Öğrenci Sayısı",   suffix: "öğrenci",  group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "uni_yeniIntisap",               label: "Toplam Yeni İntisap Eden Öğrenci",      suffix: "öğrenci",  group: "Öğrenci ve Dergâh Bilgileri" },
    { key: "uni_aktifKulup",                label: "Aktif Kulüp Sayısı",                    suffix: "kulüp",    group: "Öğrenci ve Dergâh Bilgileri" },
    // İlim / Sohbet Faaliyetleri
    { key: "uni_ilimSohbetSayisi",   label: "Toplam İlim/Sohbet Faaliyeti Sayısı",       suffix: "faaliyet", group: "İlim / Sohbet Faaliyetleri" },
    { key: "uni_ilimSohbetKatilim",  label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "İlim / Sohbet Faaliyetleri" },
    // Kulüp Faaliyetleri
    { key: "uni_kulupSayisi",        label: "Toplam Kulüp Faaliyeti Sayısı",             suffix: "faaliyet", group: "Kulüp Faaliyetleri" },
    { key: "uni_kulupKatilim",       label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Kulüp Faaliyetleri" },
    // Sosyal Faaliyetler
    { key: "uni_sosyalSayisi",       label: "Toplam Sosyal Faaliyet Sayısı",             suffix: "faaliyet", group: "Sosyal Faaliyetler" },
    { key: "uni_sosyalKatilim",      label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Sosyal Faaliyetler" },
    // Sosyal Sorumluluk Faaliyetleri
    { key: "uni_sorumlulukSayisi",   label: "Toplam Sosyal Sorumluluk Faaliyeti Sayısı", suffix: "faaliyet", group: "Sosyal Sorumluluk Faaliyetleri" },
    { key: "uni_sorumlulukKatilim",  label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Sosyal Sorumluluk Faaliyetleri" },
    // Muhabbet Buluşmaları
    { key: "uni_muhabbetSayisi",     label: "Toplam Muhabbet Buluşması Sayısı",          suffix: "buluşma",  group: "Muhabbet Buluşmaları" },
    { key: "uni_muhabbetKatilim",    label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Muhabbet Buluşmaları" },
    // Namaz Buluşmaları
    { key: "uni_namazSayisi",        label: "Toplam Namaz Buluşması Sayısı",             suffix: "buluşma",  group: "Namaz Buluşmaları" },
    { key: "uni_namazKatilim",       label: "Katılan Toplam Öğrenci Sayısı",             suffix: "öğrenci",  group: "Namaz Buluşmaları" },
    // Kafile Faaliyetleri
    { key: "uni_kafileSayisi",       label: "Toplam Kafile Sayısı",                      suffix: "kafile",   group: "Kafile Faaliyetleri" },
    { key: "uni_kafileOgrenci",      label: "Kafilelere Katılan Toplam Öğrenci",         suffix: "öğrenci",  group: "Kafile Faaliyetleri" },
    // KYK Faaliyetleri
    { key: "uni_kykBulusmaSayisi",   label: "Toplam KYK Buluşması Sayısı",               suffix: "buluşma",  group: "KYK Faaliyetleri" },
    { key: "uni_kykKatilim",         label: "KYK Buluşmalarına Katılan Toplam Öğrenci",  suffix: "öğrenci",  group: "KYK Faaliyetleri" },
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

// Birim muafiyeti — il eğitimcisi "ilimizde bu birim faaliyeti yoktur" işaretleyebilir.
// Toggle: geri alınabilir. Ortak Faaliyetler için muafiyet yoktur (opsiyonel zaten).
const MUAF: Partial<Record<Tab, { key: string; label: string }>> = {
  ilkogretim: { key: "muafIlkogretim", label: "İlimizde ilköğretim (dergah) faaliyeti bulunmamaktadır" },
  lise:       { key: "muafLise",       label: "İlimizde lise faaliyeti bulunmamaktadır" },
  universite: { key: "muafUniversite", label: "İlimizde üniversite faaliyeti bulunmamaktadır" },
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

type FieldDef = { key: string; label: string; suffix?: string; group?: string };

/** Alanları ardışık grup başlıklarına böler (grup yoksa tek blok, başlıksız) */
function groupFields(fields: FieldDef[]): { title: string; items: FieldDef[] }[] {
  const out: { title: string; items: FieldDef[] }[] = [];
  for (const f of fields) {
    const title = f.group ?? "";
    const last = out[out.length - 1];
    if (last && last.title === title) last.items.push(f);
    else out.push({ title, items: [f] });
  }
  return out;
}

export function FaaliyetForm({ activeTab }: { activeTab: Tab }) {
  const { data: session } = useSession();
  const router = useRouter();
  // Lise/Üniversite Gençlik sistemli kullanıcı eğitimci formuna erişemez
  useEffect(() => {
    if (session?.user?.sistem === "LISE") router.replace("/panel/il/lise-faaliyet");
    else if (session?.user?.sistem === "UNIVERSITE") router.replace("/panel/il/universite-faaliyet");
  }, [session, router]);
  const [yil, setYil] = useState(THIS_YEAR);
  const [donem, setDonem] = useState("DONEM_1");
  const [form, setForm] = useState<Record<string, number>>({});
  const [muaf, setMuaf] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [loaded, setLoaded] = useState(false);

  const fields = FIELDS[activeTab];
  const donemler = DONEMLER[activeTab];
  const header = HEADER[activeTab];
  const muafDef = MUAF[activeTab];
  const groups = groupFields(fields);
  const hasGroups = groups.some(g => g.title);

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
        setMuaf(muafDef ? !!data?.[muafDef.key] : false);
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
        ilId: session.user.activeIlId, yil, donem, ...form,
        ...(muafDef ? { [muafDef.key]: muaf } : {}),
      }),
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

      {/* Lise/Üni: kafile-sabah namazı nereye girilir bilgisi (çift sayım önleme) */}
      {(activeTab === "lise" || activeTab === "universite") && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
          <span className="text-xl mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "#1E40AF" }}>Ortak faaliyetler nereye girilir?</p>
            <p className="text-xs mt-0.5" style={{ color: "#1D4ED8" }}>
              Buraya YALNIZCA {activeTab === "lise" ? "lise grubunun" : "üniversite grubunun"} kendi başına
              yaptığı faaliyetleri girin. Lise + üniversite <strong>birlikte</strong> yapılan
              (kafile, namaz buluşması vb.) faaliyetleri “Ortak Faaliyetler” sekmesine girin — böylece çift sayım olmaz.
            </p>
          </div>
        </div>
      )}

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

      {/* Birim muafiyeti — "ilimizde bu birim faaliyeti yoktur" (geri alınabilir) */}
      {muafDef && (
        <label className="mb-5 flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition select-none"
          style={muaf
            ? { background: "#FEF3C7", borderColor: "#F59E0B" }
            : { background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <input type="checkbox" checked={muaf}
            onChange={e => setMuaf(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: muaf ? "#92400E" : "var(--text-primary)" }}>
              {muafDef.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: muaf ? "#B45309" : "var(--text-muted)" }}>
              İşaretlerseniz bu birim bu dönem için <strong>muaf</strong> sayılır; bölge eğitimcisi ekranında
              “veri girilmedi” yerine <strong>“çalışma yok”</strong> görünür. Durum değişirse işareti kaldırıp veri girebilirsiniz.
            </p>
          </div>
        </label>
      )}

      <form onSubmit={handleSubmit}>
        <div className="sv-section mb-6 overflow-hidden">
          <div className="px-6 py-4" style={{ background: header.color }}>
            <h2 className="text-white font-bold text-base">{header.label}</h2>
            <p className="text-white/60 text-xs mt-0.5">
              {yil} / {donemler.find(d => d.value === donem)?.label}
            </p>
          </div>

          {muaf ? (
            <div className="p-8 text-center">
              <p className="text-3xl mb-2">🚫</p>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Bu birim bu dönem için muaf işaretlendi
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Faaliyet alanları gizlendi. Kaydetmek için “Kaydet”e basın. Yukarıdaki işareti kaldırıp veri girebilirsiniz.
              </p>
            </div>
          ) : hasGroups ? (
            <div className="p-6 space-y-6">
              {groups.map((g, gi) => (
                <div key={gi}>
                  {g.title && (
                    <p className="text-xs font-bold uppercase tracking-wide mb-3 pb-1.5 border-b"
                      style={{ color: header.color, borderColor: "var(--border)" }}>
                      {g.title}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {g.items.map(f => (
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
              ))}
            </div>
          ) : (
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
          )}
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
