"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Bolge { id: string; no: number; ad: string; iller: Il[] }
interface Il { id: string; ad: string }

export default function KayitPage() {
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [form, setForm] = useState({
    ad: "", soyad: "", email: "", telefon: "",
    bolgeId: "", ilId: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bolgeler?public=1").then((r) => r.json()).then(setBolgeler);
  }, []);

  const seciliBolge = bolgeler.find((b) => b.id === form.bolgeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/kayit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error || "Hata oluştu");
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Başvurunuz Alındı</h2>
          <p className="text-gray-500 text-sm">
            Hesabınız aktif bir göreve atanmayı beklemektedir. Yönetici onayı sonrasında sisteme erişebilirsiniz.
          </p>
          <Link href="/giris" className="inline-block mt-4 text-blue-700 hover:underline text-sm">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Başvuru Oluştur</h1>
        <p className="text-gray-500 text-sm mb-6">Bilgilerinizi doldurun, yönetici onayı beklenir.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                required value={form.ad}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                required value={form.soyad}
                onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel" value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="05xx xxx xx xx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bölge</label>
            <select
              value={form.bolgeId}
              onChange={(e) => setForm({ ...form, bolgeId: e.target.value, ilId: "" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {bolgeler.map((b) => (
                <option key={b.id} value={b.id}>{b.ad}</option>
              ))}
            </select>
          </div>

          {seciliBolge && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
              <select
                value={form.ilId}
                onChange={(e) => setForm({ ...form, ilId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                {seciliBolge.iller.map((il) => (
                  <option key={il.id} value={il.id}>{il.ad}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Hesabınız var mı?{" "}
          <Link href="/giris" className="text-blue-700 hover:underline font-medium">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
