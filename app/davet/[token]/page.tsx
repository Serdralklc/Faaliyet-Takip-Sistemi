"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DavetPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<{ email: string } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/davet/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d ? setInfo(d) : setInvalid(true)));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Şifreler eşleşmiyor"); return; }
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalıdır"); return; }
    setLoading(true);
    setError("");

    const res = await fetch(`/api/davet/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (res.ok) setSuccess(true);
    else { const d = await res.json(); setError(d.error || "Hata oluştu"); }
  }

  if (invalid) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-card rounded-2xl shadow-lg p-8 text-center max-w-md">
        <p className="text-red-600 font-medium">Bu bağlantı geçersiz veya süresi dolmuş.</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-card rounded-2xl shadow-lg p-8 text-center max-w-md">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold mb-2">Şifreniz Oluşturuldu</h2>
        <p className="text-muted text-sm mb-4">Artık sisteme giriş yapabilirsiniz.</p>
        <button onClick={() => router.push("/giris")}
          className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800">
          Giriş Yap
        </button>
      </div>
    </div>
  );

  if (!info) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted">Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Şifre Oluştur</h1>
        <p className="text-muted text-sm mb-6">{info.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Şifre</label>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="En az 8 karakter" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Şifre Tekrar</label>
            <input type="password" required value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50">
            {loading ? "Kaydediliyor..." : "Şifremi Belirle"}
          </button>
        </form>
      </div>
    </div>
  );
}
