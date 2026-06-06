"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Il { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

export default function ProfilTamamlaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [form, setForm] = useState({
    gorev: "" as "" | "IL_SORUMLUSU" | "BOLGE_SORUMLUSU",
    bolgeId: "",
    ilId: "",
    telefon: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bolgeler?public=1").then(r => r.json()).then(setBolgeler);
  }, []);

  // Zaten aktif kullanıcı ise yönlendir
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "BEKLEYEN") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") return null;
  if (!session?.user) {
    router.push("/giris");
    return null;
  }

  const seciliBolge = bolgeler.find(b => b.id === form.bolgeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.gorev) { setError("Başvurulan görevi seçiniz."); return; }
    if (!form.bolgeId) { setError("Bölge seçiniz."); return; }
    if (form.gorev === "IL_SORUMLUSU" && !form.ilId) { setError("İl seçiniz."); return; }

    setLoading(true);
    const res = await fetch("/api/profil-tamamla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setSuccess(true);
    else setError(data.error || "Hata oluştu.");
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Yönetici inceleyip onayladıktan sonra sisteme giriş yapabilirsiniz.
            Onay sonrasında aynı Google hesabınızla veya belirlenecek şifrenizle giriş yapın.
          </p>
          <button onClick={() => signOut({ callbackUrl: "/giris" })}
            className="mt-6 text-sm text-blue-600 hover:underline font-semibold">
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-8 py-6">
          <h1 className="text-xl font-bold text-white">Başvuru Bilgilerini Tamamla</h1>
          <p className="text-blue-200 text-sm mt-1">Hoş geldin, <span className="font-semibold">{session.user.ad} {session.user.soyad}</span></p>
        </div>

        <div className="px-8 py-6">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Google hesabınızla kaydoldunuz. Hangi görev için başvurduğunuzu seçin.
            Yönetici onayından sonra sisteme erişebilirsiniz.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Telefon */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-gray-800">
                Telefon <span className="font-normal text-gray-400">(opsiyonel)</span>
              </label>
              <input
                type="tel" value={form.telefon}
                onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                placeholder="05xx xxx xx xx"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>

            {/* Görev seçimi */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800">
                Başvurulan Görev <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "IL_SORUMLUSU", label: "İl Sorumlusu" },
                  { val: "BOLGE_SORUMLUSU", label: "Bölge Sorumlusu" },
                ].map(({ val, label }) => (
                  <label key={val}
                    className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition font-semibold text-sm ${
                      form.gorev === val
                        ? "border-blue-600 bg-blue-50 text-blue-800"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}>
                    <input type="radio" name="gorev" value={val}
                      checked={form.gorev === val}
                      onChange={() => setForm(p => ({ ...p, gorev: val as typeof form.gorev, bolgeId: "", ilId: "" }))}
                      className="accent-blue-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Bölge */}
            {form.gorev && (
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">
                  Bölge <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.bolgeId}
                  onChange={e => setForm(p => ({ ...p, bolgeId: e.target.value, ilId: "" }))}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Bölge seçiniz</option>
                  {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                </select>
              </div>
            )}

            {/* İl — sadece İl Sorumlusu */}
            {form.gorev === "IL_SORUMLUSU" && seciliBolge && (
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">
                  İl <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.ilId}
                  onChange={e => setForm(p => ({ ...p, ilId: e.target.value }))}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">İl seçiniz</option>
                  {seciliBolge.iller.map(il => <option key={il.id} value={il.id}>{il.ad}</option>)}
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl px-4 py-3">
                <p className="text-red-700 text-sm font-bold">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50 shadow-sm">
              {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
