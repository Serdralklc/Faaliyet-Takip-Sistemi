"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BRAND, COLORS } from "@/lib/theme";
import { maskPhone, unmaskPhone } from "@/lib/format";

const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];

const inputSt: React.CSSProperties = {
  background: COLORS.inp, border: `1px solid ${COLORS.br}`, borderRadius: "0.75rem",
  padding: "0.625rem 1rem", width: "100%", fontSize: "14px", color: COLORS.h, outline: "none",
  boxSizing: "border-box",
};
const labelSt: React.CSSProperties = {
  color: COLORS.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.06em", display: "block", marginBottom: "6px",
};
const errSt: React.CSSProperties = { color: "#DC2626", fontSize: "12px", marginTop: "4px", fontWeight: 600 };

function Section({ title }: { title: string }) {
  return (
    <div style={{ borderBottom: `2px solid ${BRAND.green}20`, marginBottom: "20px", paddingBottom: "6px" }}>
      <p style={{ color: BRAND.green, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</p>
    </div>
  );
}

const BOS_FORM = {
  ogrenciAd: "", ogrenciSoyad: "", telefon: "",
  geldigiUlke: "", geldigiIl: "", geldigiIlce: "",
  gidecegiBolge: "", gidecegiIl: "", gidecegiIlce: "",
  universite: "", fakulte: "", bolum: "", kayitTipi: "",
  veliAdSoyad: "", veliTelefon: "",
  referansAdSoyad: "", referansTelefon: "", referansGorev: "",
};

type FormState = typeof BOS_FORM;

const DRAFT_KEY = "sv-ekkayit-draft";

const ADIMLAR = [
  { no: 1, label: "Öğrenci Bilgileri" },
  { no: 2, label: "Eğitim & Yerleşim" },
  { no: 3, label: "Veli & Referans" },
];

export default function EkKayitBasvurusuPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(BOS_FORM);
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [ilToBolge, setIlToBolge] = useState<Record<string, string>>({});
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // İl → bölge eşlemesi (gideceği bölge otomatik dolsun)
  useEffect(() => {
    fetch("/api/bolgeler?public=1")
      .then(r => (r.ok ? r.json() : []))
      .then((bolgeler: { ad: string; iller: { ad: string }[] }[]) => {
        const map: Record<string, string> = {};
        for (const b of bolgeler) for (const il of b.iller) map[il.ad] = b.ad;
        setIlToBolge(map);
      })
      .catch(() => { /* eşleme yoksa bölge boş kalır */ });
  }, []);

  // Taslağı geri yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { form: FormState; step: number };
        if (draft.form && Object.values(draft.form).some(v => v)) {
          setForm({ ...BOS_FORM, ...draft.form });
          setStep(draft.step >= 1 && draft.step <= 3 ? draft.step : 1);
          setDraftRestored(true);
        }
      }
    } catch { /* bozuk taslak yok sayılır */ }
  }, []);

  // Taslağı otomatik kaydet (800ms debounce)
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step })); } catch { /* dolu olabilir */ }
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [form, step]);

  function set(k: keyof FormState, v: string) {
    dirtyRef.current = true;
    setForm(f => {
      const next = { ...f, [k]: v };
      // Gideceği il seçilince bölge otomatik dolar
      if (k === "gidecegiIl") next.gidecegiBolge = ilToBolge[v] ?? "";
      return next;
    });
    setFieldErrors(e => (e[k] ? { ...e, [k]: undefined } : e));
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* yok say */ }
    setForm(BOS_FORM);
    setStep(1);
    setDraftRestored(false);
    dirtyRef.current = false;
  }

  /** Adım bazlı zorunlu alan kontrolü — hatalar alanın altında gösterilir */
  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      if (form.ogrenciAd.trim().length < 2) errs.ogrenciAd = "Öğrenci adı zorunludur.";
      if (form.ogrenciSoyad.trim().length < 2) errs.ogrenciSoyad = "Öğrenci soyadı zorunludur.";
      if (unmaskPhone(form.telefon).length !== 11) errs.telefon = "Geçerli bir cep telefonu girin (05xx xxx xx xx).";
    }
    if (s === 2) {
      if (!form.universite.trim()) errs.universite = "Üniversite zorunludur.";
      if (!form.fakulte.trim()) errs.fakulte = "Fakülte zorunludur.";
      if (!form.bolum.trim()) errs.bolum = "Bölüm zorunludur.";
      if (!form.kayitTipi) errs.kayitTipi = "Kayıt tipi seçin.";
    }
    if (s === 3) {
      if (form.veliTelefon && unmaskPhone(form.veliTelefon).length !== 11) errs.veliTelefon = "Geçerli bir telefon girin veya boş bırakın.";
      if (form.referansTelefon && unmaskPhone(form.referansTelefon).length !== 11) errs.referansTelefon = "Geçerli bir telefon girin veya boş bırakın.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep(s => Math.min(3, s + 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(3)) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gonullu/ek-kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          telefon: unmaskPhone(form.telefon),
          veliTelefon: form.veliTelefon ? unmaskPhone(form.veliTelefon) : "",
          referansTelefon: form.referansTelefon ? unmaskPhone(form.referansTelefon) : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Başvuru gönderilemedi."); return; }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* yok say */ }
      setSuccess(true);
      setTimeout(() => router.push("/gonullu/panel/basvurularim"), 2000);
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const inp = (k: keyof FormState, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => ({
    style: { ...inputSt, ...(fieldErrors[k] ? { borderColor: "#FCA5A5" } : {}) },
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
    "aria-invalid": fieldErrors[k] ? true : undefined,
    ...extra,
  });
  const tel = (k: keyof FormState) => ({
    ...inp(k, { type: "tel", placeholder: "05xx xxx xx xx", inputMode: "numeric" as const }),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, maskPhone(e.target.value)),
  });
  const sel = (k: keyof FormState) => ({
    style: { ...inputSt, cursor: "pointer", ...(fieldErrors[k] ? { borderColor: "#FCA5A5" } : {}) } as React.CSSProperties,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => set(k, e.target.value),
  });
  const Hata = ({ k }: { k: keyof FormState }) => (fieldErrors[k] ? <p style={errSt} role="alert">{fieldErrors[k]}</p> : null);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Serhendi Vakfı</p>
        <h1 style={{ color: COLORS.h, fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.025em" }}>Öğrenci Evi / Apart / Yurt Başvurusu</h1>
        <p style={{ color: COLORS.b, fontSize: "14px", marginTop: "6px" }}>
          Form 3 kısa adımdan oluşur; yazdıklarınız otomatik taslak olarak saklanır.
        </p>
      </div>

      {/* Adım göstergesi */}
      {!success && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }} aria-label={`Adım ${step} / 3`}>
          {ADIMLAR.map((a, i) => {
            const done = step > a.no;
            const active = step === a.no;
            return (
              <div key={a.no} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < 2 ? 1 : "0 0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800,
                      background: done || active ? BRAND.green : "transparent",
                      color: done || active ? "#fff" : COLORS.mu,
                      border: done || active ? "none" : `2px solid ${COLORS.br}`,
                    }}
                  >
                    {done ? "✓" : a.no}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: active ? COLORS.h : COLORS.mu }} className="hidden sm:inline">
                    {a.label}
                  </span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, borderRadius: 2, background: step > a.no ? BRAND.green : COLORS.br }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Taslak bildirimi */}
      {draftRestored && !success && (
        <div style={{ background: BRAND.green + "12", border: `1px solid ${BRAND.green}40`, borderRadius: "0.75rem", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ color: BRAND.green, fontSize: "13px", fontWeight: 600 }}>Kaldığınız yerden devam ediyorsunuz — taslağınız geri yüklendi.</p>
          <button type="button" onClick={clearDraft} style={{ color: "#DC2626", fontSize: "12.5px", fontWeight: 700, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            Taslağı Sil
          </button>
        </div>
      )}

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.br}`, borderRadius: "1.25rem", padding: "28px" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: BRAND.green + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p style={{ color: COLORS.h, fontWeight: 700, fontSize: "1.1rem" }}>Başvurunuz Alındı!</p>
            <p style={{ color: COLORS.b, fontSize: "14px", marginTop: "6px" }}>Başvurularım sayfasına yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "20px" }}>
                <p style={{ color: "#B91C1C", fontSize: "14px" }} role="alert">{error}</p>
              </div>
            )}

            {/* ── ADIM 1: Öğrenci Bilgileri ── */}
            {step === 1 && (
              <>
                <Section title="Öğrenci Bilgileri" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelSt} htmlFor="ogrenciAd">Öğrenci Adı *</label>
                    <input id="ogrenciAd" placeholder="Ad" autoFocus {...inp("ogrenciAd")} />
                    <Hata k="ogrenciAd" />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="ogrenciSoyad">Öğrenci Soyadı *</label>
                    <input id="ogrenciSoyad" placeholder="Soyad" {...inp("ogrenciSoyad")} />
                    <Hata k="ogrenciSoyad" />
                  </div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelSt} htmlFor="telefon">Cep Telefonu *</label>
                  <input id="telefon" {...tel("telefon")} />
                  <Hata k="telefon" />
                </div>

                <Section title="Geldiği Yer" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "8px" }}>
                  <div>
                    <label style={labelSt} htmlFor="geldigiUlke">Ülke</label>
                    <input id="geldigiUlke" placeholder="Türkiye" {...inp("geldigiUlke")} />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="geldigiIl">İl</label>
                    <select id="geldigiIl" {...sel("geldigiIl")}>
                      <option value="">Seçiniz...</option>
                      {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="geldigiIlce">İlçe</label>
                    <input id="geldigiIlce" placeholder="İlçe / Merkez" {...inp("geldigiIlce")} />
                  </div>
                </div>
              </>
            )}

            {/* ── ADIM 2: Eğitim & Yerleşim ── */}
            {step === 2 && (
              <>
                <Section title="Üniversite Bilgileri" />
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelSt} htmlFor="universite">Kazandığı Üniversite *</label>
                  <input id="universite" placeholder="Üniversite adı" autoFocus {...inp("universite")} />
                  <Hata k="universite" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelSt} htmlFor="fakulte">Fakülte *</label>
                    <input id="fakulte" placeholder="Fakülte" {...inp("fakulte")} />
                    <Hata k="fakulte" />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="bolum">Bölüm *</label>
                    <input id="bolum" placeholder="Bölüm" {...inp("bolum")} />
                    <Hata k="bolum" />
                  </div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelSt} htmlFor="kayitTipi">Kayıt Tipi *</label>
                  <select id="kayitTipi" {...sel("kayitTipi")}>
                    <option value="">Seçiniz...</option>
                    <option value="Yurt">Yurt</option>
                    <option value="Apart">Apart</option>
                    <option value="Öğrenci Evi">Öğrenci Evi</option>
                    <option value="Aile Yanı">Aile Yanı</option>
                  </select>
                  <Hata k="kayitTipi" />
                </div>

                <Section title="Gideceği Yer" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "8px" }}>
                  <div>
                    <label style={labelSt} htmlFor="gidecegiIl">İl</label>
                    <select id="gidecegiIl" {...sel("gidecegiIl")}>
                      <option value="">Seçiniz...</option>
                      {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="gidecegiBolge">Bölge (otomatik)</label>
                    <input
                      id="gidecegiBolge"
                      readOnly
                      placeholder="İl seçince dolar"
                      value={form.gidecegiBolge}
                      style={{ ...inputSt, background: COLORS.su, color: form.gidecegiBolge ? COLORS.h : COLORS.mu, cursor: "default" }}
                      tabIndex={-1}
                    />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="gidecegiIlce">İlçe</label>
                    <input id="gidecegiIlce" placeholder="İlçe / Merkez" {...inp("gidecegiIlce")} />
                  </div>
                </div>
              </>
            )}

            {/* ── ADIM 3: Veli & Referans ── */}
            {step === 3 && (
              <>
                <Section title="Veli Bilgileri" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelSt} htmlFor="veliAdSoyad">Velinin Adı Soyadı</label>
                    <input id="veliAdSoyad" placeholder="Ad Soyad" autoFocus {...inp("veliAdSoyad")} />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="veliTelefon">Velinin Cep Telefonu</label>
                    <input id="veliTelefon" {...tel("veliTelefon")} />
                    <Hata k="veliTelefon" />
                  </div>
                </div>

                <Section title="Referans Bilgileri" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelSt} htmlFor="referansAdSoyad">Referans Adı Soyadı</label>
                    <input id="referansAdSoyad" placeholder="Ad Soyad" {...inp("referansAdSoyad")} />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="referansTelefon">Referans Cep Telefonu</label>
                    <input id="referansTelefon" {...tel("referansTelefon")} />
                    <Hata k="referansTelefon" />
                  </div>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <label style={labelSt} htmlFor="referansGorev">Referansın Vakıftaki Görevi</label>
                  <input id="referansGorev" placeholder="Vakıftaki görevi" {...inp("referansGorev")} />
                </div>
              </>
            )}

            {/* ── Adım gezinme ── */}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  style={{ flex: 1, background: "transparent", color: COLORS.b, border: `1.5px solid ${COLORS.br}`, padding: "13px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                >
                  ← Geri
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={{ flex: 2, background: BRAND.green, color: "#FFFFFF", border: "none", padding: "13px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
                >
                  İleri →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 2, background: BRAND.green, color: "#FFFFFF", border: "none", padding: "13px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
