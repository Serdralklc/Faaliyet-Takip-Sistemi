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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f4ff" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>Faaliyet Takip Sistemi</h1>
          <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>Serhendi Gençlik</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "#374151" }}>
              E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-600"
              placeholder="ornek@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "#374151" }}>
              Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-600"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg transition text-sm disabled:opacity-60"
            style={{ backgroundColor: loading ? "#93c5fd" : "#1d4ed8" }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "#6b7280" }}>
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="font-semibold" style={{ color: "#1d4ed8" }}>
            Başvuru Oluştur
          </Link>
        </p>
      </div>
    </div>
  );
}
