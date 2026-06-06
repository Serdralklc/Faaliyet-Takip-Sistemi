"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Il { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

const inputClass = "w-full border-2 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
  + " bg-white border-gray-300 text-gray-900 placeholder-gray-500";

const labelClass = "block text-sm font-semibold mb-1.5 text-gray-800";

export default function KayitPage() {
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [form, setForm] = useState({
    ad: "", soyad: "", email: "", telefon: "",
    sifre: "", sifreTekrar: "",
    gorev: "" as "" | "IL_SORUMLUSU" | "BOLGE_SORUMLUSU",
    bolgeId: "", ilId: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    fetch("/api/bolgeler?public=1").then((r) => r.json()).then(setBolgeler);
  }, []);

  const seciliBolge = bolgeler.find((b) => b.id === form.bolgeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.sifre.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (form.sifre !== form.sifreTekrar) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (!form.gorev) {
      setError("Başvurulan görevi seçiniz.");
      return;
    }
    if (!form.bolgeId) {
      setError("Bölge seçiniz.");
      return;
    }
    if (form.gorev === "IL_SORUMLUSU" && !form.ilId) {
      setError("İl seçiniz.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/kayit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ad: form.ad,
        soyad: form.soyad,
        email: form.email,
        telefon: form.telefon,
        sifre: form.sifre,
        gorev: form.gorev,
        bolgeId: form.bolgeId,
        ilId: form.gorev === "IL_SORUMLUSU" ? form.ilId : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error || "Hata oluştu.");
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Hesabınız oluşturuldu. Yönetici onayı sonrasında sisteme giriş yapabilirsiniz.
          </p>
          <Link href="/giris"
            className="inline-block mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition">
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Başvuru Oluştur</h1>
          <p className="text-blue-200 text-sm mt-1">Serhendi Gençlik Faaliyet Takip Sistemi</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Ad Soyad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ad <span className="text-red-500">*</span></label>
              <input
                required value={form.ad}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className={inputClass} placeholder="Adınız"
              />
            </div>
            <div>
              <label className={labelClass}>Soyad <span className="text-red-500">*</span></label>
              <input
                required value={form.soyad}
                onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                className={inputClass} placeholder="Soyadınız"
              />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className={labelClass}>E-posta <span className="text-red-500">*</span></label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass} placeholder="ornek@email.com"
              autoComplete="email"
            />
          </div>

          {/* Telefon */}
          <div>
            <label className={labelClass}>Telefon <span className="text-red-500">*</span></label>
            <input
              type="tel" required value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              className={inputClass} placeholder="05xx xxx xx xx"
            />
          </div>

          {/* Şifre */}
          <div>
            <label className={labelClass}>Şifre <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required value={form.sifre}
                onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                className={inputClass + " pr-12"} placeholder="En az 8 karakter"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs font-medium">
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>

          {/* Şifre Tekrar */}
          <div>
            <label className={labelClass}>Şifre Tekrar <span className="text-red-500">*</span></label>
            <input
              type={showPass ? "text" : "password"}
              required value={form.sifreTekrar}
              onChange={(e) => setForm({ ...form, sifreTekrar: e.target.value })}
              className={inputClass} placeholder="Şifrenizi tekrar girin"
              autoComplete="new-password"
            />
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Başvuru Bilgileri</p>

            {/* Görev Seçimi */}
            <div className="mb-4">
              <label className={labelClass}>Başvurulan Görev <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "IL_SORUMLUSU", label: "İl Sorumlusu" },
                  { val: "BOLGE_SORUMLUSU", label: "Bölge Sorumlusu" },
                ].map(({ val, label }) => (
                  <label key={val}
                    className={`flex items-center gap-3 border-2 rounded-lg px-4 py-3 cursor-pointer transition font-medium text-sm ${
                      form.gorev === val
                        ? "border-blue-600 bg-blue-50 text-blue-800"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}>
                    <input type="radio" name="gorev" value={val}
                      checked={form.gorev === val}
                      onChange={() => setForm({ ...form, gorev: val as typeof form.gorev, bolgeId: "", ilId: "" })}
                      className="accent-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Bölge */}
            {form.gorev && (
              <div className="mb-4">
                <label className={labelClass}>Bölge <span className="text-red-500">*</span></label>
                <select
                  value={form.bolgeId}
                  onChange={(e) => setForm({ ...form, bolgeId: e.target.value, ilId: "" })}
                  className={inputClass}
                >
                  <option value="">Bölge seçiniz</option>
                  {bolgeler.map((b) => (
                    <option key={b.id} value={b.id}>{b.ad}</option>
                  ))}
                </select>
              </div>
            )}

            {/* İl — sadece İl Sorumlusu için */}
            {form.gorev === "IL_SORUMLUSU" && seciliBolge && (
              <div>
                <label className={labelClass}>İl <span className="text-red-500">*</span></label>
                <select
                  value={form.ilId}
                  onChange={(e) => setForm({ ...form, ilId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">İl seçiniz</option>
                  {seciliBolge.iller.map((il) => (
                    <option key={il.id} value={il.id}>{il.ad}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg px-4 py-3">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-3 rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Hesabınız var mı?{" "}
            <Link href="/giris" className="text-blue-700 font-bold hover:underline">Giriş Yap</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
