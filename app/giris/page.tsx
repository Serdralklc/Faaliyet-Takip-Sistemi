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

          {/* Ayraç */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold">veya</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google ile Giriş */}
          <button type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg transition text-sm shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google ile Giriş Yap / Kayıt Ol
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
