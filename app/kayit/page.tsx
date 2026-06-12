"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Il    { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

/* ── Sistem → etiket eşlemesi ── */
type SistemKey = "EGITIMCI" | "UNIVERSITE" | "LISE";

const SISTEM_LABELS: Record<SistemKey, { bolge: string; il: string; baslik: string; renk: string }> = {
  EGITIMCI:   {
    bolge:  "Bölge Eğitimcisi",
    il:     "İl Eğitimcisi",
    baslik: "Eğitimci Kadrosu Başvurusu",
    renk:   "#0B6B3A",
  },
  UNIVERSITE: {
    bolge:  "Bölge Üniversite Gençlik Sorumlusu",
    il:     "İl Üniversite Gençlik Sorumlusu",
    baslik: "Üniversite Gençlik Başvurusu",
    renk:   "#1D4ED8",
  },
  LISE: {
    bolge:  "Bölge Lise Gençlik Sorumlusu",
    il:     "İl Lise Gençlik Sorumlusu",
    baslik: "Lise Gençlik Başvurusu",
    renk:   "#7C3AED",
  },
};

/* ── Yönetici başvuru rolleri ── */
const YONETICI_ROLLER = [
  { label: "Türkiye Eğitim Sorumlusu",            gorev: "TURKIYE_EGITIM_SORUMLUSU",     sistem: "EGITIMCI"   },
  { label: "Merkez Ekibi",                         gorev: "GENEL_MERKEZ",                 sistem: "EGITIMCI"   },
  { label: "Türkiye Üniversite Gençlik Sorumlusu", gorev: "TURKIYE_UNIVERSITE_SORUMLUSU", sistem: "UNIVERSITE" },
  { label: "Türkiye Lise Gençlik Sorumlusu",       gorev: "TURKIYE_LISE_SORUMLUSU",       sistem: "LISE"       },
] as const;

/* ── Query param'dan sistem oku ── */
function getSistem(raw: string | null): SistemKey | "YONETICI" {
  const map: Record<string, SistemKey | "YONETICI"> = {
    egitimci:   "EGITIMCI",
    universite: "UNIVERSITE",
    lise:       "LISE",
    yonetici:   "YONETICI",
    EGITIMCI:   "EGITIMCI",
    UNIVERSITE: "UNIVERSITE",
    LISE:       "LISE",
    YONETICI:   "YONETICI",
  };
  return map[raw ?? ""] ?? "EGITIMCI";
}

/* ── Ana form bileşeni ── */
function KayitForm() {
  const params     = useSearchParams();
  const sistemKey  = getSistem(params.get("sistem"));
  const isYonetici = sistemKey === "YONETICI";
  const sl = isYonetici
    ? { bolge: "", il: "", baslik: "Yönetici Başvurusu", renk: "#92400E" }
    : SISTEM_LABELS[sistemKey as SistemKey];

  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [form, setForm] = useState({
    ad: "", soyad: "", email: "", telefon: "",
    sifre: "", sifreTekrar: "",
    gorev: "" as "" | "IL_SORUMLUSU" | "BOLGE_SORUMLUSU",
    bolgeId: "", ilId: "",
    // Yönetici modunda seçilen rol index'i
    yoneticiRolIdx: -1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!isYonetici) {
      fetch("/api/bolgeler?public=1").then(r => r.json()).then(setBolgeler);
    }
  }, [isYonetici]);

  const seciliBolge = bolgeler.find(b => b.id === form.bolgeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.sifre.length < 8)           { setError("Şifre en az 8 karakter olmalıdır."); return; }
    if (form.sifre !== form.sifreTekrar) { setError("Şifreler eşleşmiyor."); return; }

    let payload: Record<string, unknown>;

    if (isYonetici) {
      if (form.yoneticiRolIdx < 0) { setError("Başvurulan rolü seçiniz."); return; }
      const secilen = YONETICI_ROLLER[form.yoneticiRolIdx];
      payload = {
        ad: form.ad, soyad: form.soyad, email: form.email,
        telefon: form.telefon, sifre: form.sifre,
        gorev:  secilen.gorev,
        sistem: secilen.sistem,
      };
    } else {
      if (!form.gorev)   { setError("Başvurulan görevi seçiniz."); return; }
      if (!form.bolgeId) { setError("Bölge seçiniz."); return; }
      if (form.gorev === "IL_SORUMLUSU" && !form.ilId) { setError("İl seçiniz."); return; }
      payload = {
        ad: form.ad, soyad: form.soyad, email: form.email,
        telefon: form.telefon, sifre: form.sifre,
        gorev: form.gorev, bolgeId: form.bolgeId,
        ilId: form.gorev === "IL_SORUMLUSU" ? form.ilId : undefined,
        sistem: sistemKey,
      };
    }

    setLoading(true);
    const res = await fetch("/api/kayit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error || "Hata oluştu.");
    else setSuccess(true);
  }

  /* ── Başarı ekranı ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F6F8F5" }}>
        <div className="bg-card rounded-2xl shadow-xl p-10 max-w-md w-full text-center border" style={{ borderColor: "#E2E8F0" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: sl.renk + "15" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sl.renk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-[20px] font-black mb-2" style={{ color: "#0F172A" }}>Başvurunuz Alındı</h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: "#64748B" }}>
            {isYonetici
              ? "Başvurunuz alındı. Admin onayı sonrasında Yönetici Paneli'nden giriş yapabilirsiniz."
              : `Hesabınız oluşturuldu. Yönetici onayı sonrasında ${sl.baslik.replace(" Başvurusu", "")} sistemine giriş yapabilirsiniz.`
            }
          </p>
          <Link
            href="/giris"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl text-[14px] font-bold text-white transition hover:opacity-90"
            style={{ background: sl.renk }}
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border-2 rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none transition bg-card"
    + " border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]";
  const labelCls = "block text-[12px] font-bold mb-1.5 uppercase tracking-wide text-[#64748B]";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F6F8F5" }}>
      {/* Üst bar */}
      <header
        className="w-full border-b px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderColor: "#E2E8F0" }}
      >
        <Link href={`/giris?sistem=${sistemKey.toLowerCase()}`} className="flex items-center gap-2 hover:opacity-75 transition">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0B6B3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span className="text-[13px] font-semibold" style={{ color: "#0B6B3A" }}>Geri Dön</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#EAF5EE" }}>
            <img src="/logo.svg" alt="Serhendi" className="w-4 h-4" />
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[12px] font-bold" style={{ color: "#064E2A" }}>Serhendi Gençlik</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>Faaliyet Takip Sistemi</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div
          className="w-full max-w-lg rounded-3xl overflow-hidden shadow-xl border"
          style={{ background: "#fff", borderColor: "#E2E8F0" }}
        >
          {/* Header */}
          <div
            className="px-8 py-7"
            style={{ background: `linear-gradient(135deg, ${sl.renk}E8, ${sl.renk})` }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              Başvuru Formu
            </p>
            <h1 className="text-[20px] font-black text-white" style={{ letterSpacing: "-0.02em" }}>
              {sl.baslik}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {/* Ad Soyad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Ad <span className="text-red-500">*</span></label>
                <input
                  required value={form.ad}
                  onChange={e => setForm({ ...form, ad: e.target.value })}
                  className={inputCls} placeholder="Adınız"
                  onFocus={e => (e.target.style.borderColor = sl.renk)}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                />
              </div>
              <div>
                <label className={labelCls}>Soyad <span className="text-red-500">*</span></label>
                <input
                  required value={form.soyad}
                  onChange={e => setForm({ ...form, soyad: e.target.value })}
                  className={inputCls} placeholder="Soyadınız"
                  onFocus={e => (e.target.style.borderColor = sl.renk)}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className={labelCls}>E-posta <span className="text-red-500">*</span></label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={inputCls} placeholder="ornek@email.com"
                autoComplete="email"
                onFocus={e => (e.target.style.borderColor = sl.renk)}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Telefon */}
            <div>
              <label className={labelCls}>Telefon <span className="text-red-500">*</span></label>
              <input
                type="tel" required value={form.telefon}
                onChange={e => setForm({ ...form, telefon: e.target.value })}
                className={inputCls} placeholder="05xx xxx xx xx"
                onFocus={e => (e.target.style.borderColor = sl.renk)}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Şifre */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Şifre <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required value={form.sifre}
                    onChange={e => setForm({ ...form, sifre: e.target.value })}
                    className={inputCls + " pr-16"} placeholder="En az 8 karakter"
                    autoComplete="new-password"
                    onFocus={e => (e.target.style.borderColor = sl.renk)}
                    onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold"
                    style={{ color: sl.renk }}>
                    {showPass ? "Gizle" : "Göster"}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Şifre Tekrar <span className="text-red-500">*</span></label>
                <input
                  type={showPass ? "text" : "password"}
                  required value={form.sifreTekrar}
                  onChange={e => setForm({ ...form, sifreTekrar: e.target.value })}
                  className={inputCls} placeholder="Tekrar girin"
                  autoComplete="new-password"
                  onFocus={e => (e.target.style.borderColor = sl.renk)}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                />
              </div>
            </div>

            {/* ── Başvurulan Görev ── */}
            <div className="border-t pt-5" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: "#94A3B8" }}>
                Başvurulan Görev
              </p>

              {isYonetici ? (
                /* Yönetici modunda 4 rol seçeneği */
                <div className="grid grid-cols-1 gap-2">
                  {YONETICI_ROLLER.map((rol, idx) => (
                    <label
                      key={idx}
                      className="relative flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition"
                      style={{
                        borderColor: form.yoneticiRolIdx === idx ? sl.renk : "#E2E8F0",
                        background:  form.yoneticiRolIdx === idx ? sl.renk + "08" : "#fff",
                      }}
                    >
                      <input
                        type="radio" name="yoneticiRol"
                        checked={form.yoneticiRolIdx === idx}
                        onChange={() => setForm(p => ({ ...p, yoneticiRolIdx: idx }))}
                        className="sr-only"
                      />
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition"
                        style={{
                          borderColor: form.yoneticiRolIdx === idx ? sl.renk : "#CBD5E1",
                          background:  form.yoneticiRolIdx === idx ? sl.renk : "transparent",
                        }}
                      >
                        {form.yoneticiRolIdx === idx && <div className="w-1.5 h-1.5 rounded-full bg-card" />}
                      </div>
                      <span className="text-[14px] font-semibold" style={{ color: form.yoneticiRolIdx === idx ? "#0F172A" : "#475569" }}>
                        {rol.label}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                /* Normal mod — Bölge / İl seçimi */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "BOLGE_SORUMLUSU", label: sl.bolge, side: "Bölge Yetkilisi" },
                      { val: "IL_SORUMLUSU",    label: sl.il,    side: "İl Yetkilisi"    },
                    ].map(({ val, label, side }) => (
                      <label
                        key={val}
                        className="relative flex flex-col gap-1.5 border-2 rounded-2xl px-4 py-4 cursor-pointer transition"
                        style={{
                          borderColor: form.gorev === val ? sl.renk : "#E2E8F0",
                          background:  form.gorev === val ? sl.renk + "08" : "#fff",
                        }}
                      >
                        <input
                          type="radio" name="gorev" value={val}
                          checked={form.gorev === val}
                          onChange={() => setForm(p => ({ ...p, gorev: val as typeof form.gorev, bolgeId: "", ilId: "" }))}
                          className="sr-only"
                        />
                        <div
                          className="absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition"
                          style={{
                            borderColor: form.gorev === val ? sl.renk : "#CBD5E1",
                            background:  form.gorev === val ? sl.renk : "transparent",
                          }}
                        >
                          {form.gorev === val && <div className="w-1.5 h-1.5 rounded-full bg-card" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: form.gorev === val ? sl.renk : "#94A3B8" }}>
                          {side}
                        </span>
                        <span className="text-[13px] font-bold leading-tight pr-4" style={{ color: form.gorev === val ? "#0F172A" : "#475569" }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {form.gorev && (
                    <div className="mt-4">
                      <label className={labelCls}>Bölge <span className="text-red-500">*</span></label>
                      <select
                        value={form.bolgeId}
                        onChange={e => setForm({ ...form, bolgeId: e.target.value, ilId: "" })}
                        className={inputCls} style={{ borderColor: "#E2E8F0" }}
                        onFocus={e => (e.target.style.borderColor = sl.renk)}
                        onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                      >
                        <option value="">Bölge seçiniz</option>
                        {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                      </select>
                    </div>
                  )}

                  {form.gorev === "IL_SORUMLUSU" && seciliBolge && (
                    <div className="mt-4">
                      <label className={labelCls}>İl <span className="text-red-500">*</span></label>
                      <select
                        value={form.ilId}
                        onChange={e => setForm({ ...form, ilId: e.target.value })}
                        className={inputCls} style={{ borderColor: "#E2E8F0" }}
                        onFocus={e => (e.target.style.borderColor = sl.renk)}
                        onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                      >
                        <option value="">İl seçiniz</option>
                        {seciliBolge.iller.map(il => <option key={il.id} value={il.id}>{il.ad}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 border" style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
                <p className="text-[13px] font-bold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: sl.renk }}
            >
              {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>

            <p className="text-center text-[13px]" style={{ color: "#64748B" }}>
              Hesabınız var mı?{" "}
              <Link href={`/giris?sistem=${sistemKey.toLowerCase()}`} className="font-bold hover:underline" style={{ color: sl.renk }}>
                Giriş Yap
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* Suspense wrapper — useSearchParams için zorunlu */
export default function KayitPage() {
  return (
    <Suspense fallback={null}>
      <KayitForm />
    </Suspense>
  );
}
