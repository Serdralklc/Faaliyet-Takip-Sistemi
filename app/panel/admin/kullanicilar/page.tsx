"use client";

import { useState, useEffect } from "react";
import { ROLE_LABELS } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/client";

interface Kullanici {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  role: Role;
  status: string;
  createdAt: string;
  assignments: { il?: { ad: string }; bolge?: { ad: string } }[];
}

interface Bolge { id: string; no: number; ad: string; iller: { id: string; ad: string }[] }

export default function KullanicilarPage() {
  const [tab, setTab] = useState<"aktif" | "bekleyen">("aktif");
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [showDavetModal, setShowDavetModal] = useState(false);
  const [showOnayModal, setShowOnayModal] = useState<Kullanici | null>(null);
  const [loading, setLoading] = useState(false);

  const [davetForm, setDavetForm] = useState({
    ad: "", soyad: "", email: "", telefon: "",
    userRole: "IL_SORUMLUSU" as Role, bolgeId: "", ilId: "",
  });
  const [onayForm, setOnayForm] = useState({ ilId: "", bolgeId: "", role: "IL_SORUMLUSU" as Role });

  useEffect(() => {
    fetch("/api/bolgeler").then((r) => r.json()).then(setBolgeler);
  }, []);

  useEffect(() => {
    const status = tab === "aktif" ? "AKTIF" : "BEKLEMEDE";
    fetch(`/api/kullanicilar?status=${status}`)
      .then((r) => r.json())
      .then(setKullanicilar);
  }, [tab]);

  async function handleDavet(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/kullanicilar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(davetForm),
    });
    setLoading(false);
    setShowDavetModal(false);
    setDavetForm({ ad: "", soyad: "", email: "", telefon: "", userRole: "IL_SORUMLUSU", bolgeId: "", ilId: "" });
    const status = tab === "aktif" ? "AKTIF" : "BEKLEMEDE";
    fetch(`/api/kullanicilar?status=${status}`).then((r) => r.json()).then(setKullanicilar);
  }

  async function handleOnay(action: "onayla" | "reddet") {
    if (!showOnayModal) return;
    setLoading(true);
    await fetch(`/api/kullanicilar/${showOnayModal.id}/onayla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...onayForm }),
    });
    setLoading(false);
    setShowOnayModal(null);
    fetch("/api/kullanicilar?status=BEKLEMEDE").then((r) => r.json()).then(setKullanicilar);
  }

  const seciliBolge = bolgeler.find((b) => b.id === davetForm.bolgeId);
  const onayBolge = bolgeler.find((b) => b.id === onayForm.bolgeId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>
        <button onClick={() => setShowDavetModal(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 text-sm font-medium">
          + Kullanıcı Davet Et
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {(["aktif", "bekleyen"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "aktif" ? "Aktif Kullanıcılar" : "Bekleyenler"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ad Soyad</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">E-posta</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Konum</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kayıt</th>
              {tab === "bekleyen" && <th className="text-left px-4 py-3 font-medium text-gray-600">İşlem</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {kullanicilar.map((k) => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{k.ad} {k.soyad}</td>
                <td className="px-4 py-3 text-gray-500">{k.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[k.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {k.assignments[0]?.il?.ad || k.assignments[0]?.bolge?.ad || "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(k.createdAt).toLocaleDateString("tr-TR")}
                </td>
                {tab === "bekleyen" && (
                  <td className="px-4 py-3">
                    <button onClick={() => { setShowOnayModal(k); setOnayForm({ ilId: "", bolgeId: "", role: "IL_SORUMLUSU" }); }}
                      className="text-blue-600 hover:underline text-xs font-medium">
                      İncele
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {kullanicilar.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Kayıt bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Davet Modal */}
      {showDavetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Kullanıcı Davet Et</h2>
            <form onSubmit={handleDavet} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Ad" value={davetForm.ad}
                  onChange={(e) => setDavetForm({ ...davetForm, ad: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input required placeholder="Soyad" value={davetForm.soyad}
                  onChange={(e) => setDavetForm({ ...davetForm, soyad: e.target.value })}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input required type="email" placeholder="E-posta" value={davetForm.email}
                onChange={(e) => setDavetForm({ ...davetForm, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Telefon" value={davetForm.telefon}
                onChange={(e) => setDavetForm({ ...davetForm, telefon: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={davetForm.userRole}
                onChange={(e) => setDavetForm({ ...davetForm, userRole: e.target.value as Role })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="IL_SORUMLUSU">İl Sorumlusu</option>
                <option value="BOLGE_SORUMLUSU">Bölge Sorumlusu</option>
                <option value="TURKIYE_SORUMLUSU">Türkiye Sorumlusu</option>
                <option value="GENEL_MERKEZ">Genel Merkez</option>
              </select>
              <select value={davetForm.bolgeId}
                onChange={(e) => setDavetForm({ ...davetForm, bolgeId: e.target.value, ilId: "" })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Bölge Seç</option>
                {bolgeler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
              </select>
              {seciliBolge && (
                <select value={davetForm.ilId}
                  onChange={(e) => setDavetForm({ ...davetForm, ilId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">İl Seç</option>
                  {seciliBolge.iller.map((il) => <option key={il.id} value={il.id}>{il.ad}</option>)}
                </select>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDavetModal(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm hover:bg-blue-800 disabled:opacity-50">
                  {loading ? "Gönderiliyor..." : "Davet Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onay Modal */}
      {showOnayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Başvuruyu İncele</h2>
            <p className="text-gray-500 text-sm mb-4">{showOnayModal.ad} {showOnayModal.soyad} — {showOnayModal.email}</p>
            <div className="space-y-3">
              <select value={onayForm.role}
                onChange={(e) => setOnayForm({ ...onayForm, role: e.target.value as Role })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="IL_SORUMLUSU">İl Sorumlusu</option>
                <option value="BOLGE_SORUMLUSU">Bölge Sorumlusu</option>
              </select>
              <select value={onayForm.bolgeId}
                onChange={(e) => setOnayForm({ ...onayForm, bolgeId: e.target.value, ilId: "" })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Bölge Seç</option>
                {bolgeler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
              </select>
              {onayBolge && (
                <select value={onayForm.ilId}
                  onChange={(e) => setOnayForm({ ...onayForm, ilId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">İl Seç</option>
                  {onayBolge.iller.map((il) => <option key={il.id} value={il.id}>{il.ad}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleOnay("reddet")} disabled={loading}
                className="flex-1 border border-red-300 text-red-600 rounded-lg py-2 text-sm hover:bg-red-50 disabled:opacity-50">
                Reddet
              </button>
              <button onClick={() => setShowOnayModal(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">İptal</button>
              <button onClick={() => handleOnay("onayla")} disabled={loading}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700 disabled:opacity-50">
                {loading ? "..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
