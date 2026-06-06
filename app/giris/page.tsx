"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error || !res?.ok) {
        setError("E-posta veya şifre hatalı.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-8 py-7 text-center">
          <h1 className="text-2xl font-bold text-white">Faaliyet Takip Sistemi</h1>
          <p className="text-blue-200 text-sm mt-1 font-medium">Serhendi Gençlik</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-bold mb-1.5 text-gray-800">
              E-posta Adresi
            </label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition bg-white"
              placeholder="ornek@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-gray-800">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-20 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition bg-white"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 text-xs font-bold px-1">
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg px-4 py-3">
              <p className="text-red-700 text-sm font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-3 rounded-lg transition text-sm disabled:opacity-50 shadow-sm"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <p className="text-center text-sm text-gray-600 font-medium">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="text-blue-700 font-bold hover:underline">
              Başvuru Oluştur
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
