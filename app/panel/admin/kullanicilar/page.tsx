"use client";

import { useState, useEffect, useCallback } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

interface Assignment {
  id: string;
  role: Role;
  il?: { id: string; ad: string };
  bolge?: { id: string; ad: string };
}

interface Kullanici {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  role: Role;
  status: string;
  passwordHash?: string | null;
  createdAt: string;
  assignments: Assignment[];
}

interface Il { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

const inputCls = "w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function KullanicilarPage() {
  const [tab, setTab] = useState<"aktif" | "bekleyen">("aktif");
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Modals
  const [showDavetModal, setShowDavetModal] = useState(false);
  const [showOnayModal, setShowOnayModal] = useState<Kullanici | null>(null);
  const [showYetkiKalModal, setShowYetkiKalModal] = useState<Kullanici | null>(null);
  const [showSifreModal, setShowSifreModal] = useState<Kullanici | null>(null);
  const [yeniSifre, setYeniSifre] = useState("");

  const [davetForm, setDavetForm] = useState({
    ad: "", soyad: "", email: "", telefon: "",
    userRole: "IL_SORUMLUSU" as Role, bolgeId: "", ilId: "",
  });
  const [onayForm, setOnayForm] = useState({ ilId: "", bolgeId: "", role: "IL_SORUMLUSU" as Role });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchKullanicilar = useCallback(() => {
    const status = tab === "aktif" ? "AKTIF" : "BEKLEMEDE";
    fetch(`/api/kullanicilar?status=${status}`)
      .then((r) => r.json())
      .then(setKullanicilar);
  }, [tab]);

  useEffect(() => { fetch("/api/bolgeler").then((r) => r.json()).then(setBolgeler); }, []);
  useEffect(() => { fetchKullanicilar(); }, [fetchKullanicilar]);

  // Bölge bazlı gruplama
  const grouped = bolgeler.map((b) => ({
    bolge: b,
    kullanicilar: kullanicilar.filter((k) =>
      k.assignments.some((a) => a.bolge?.id === b.id || a.il && b.iller.some((il) => il.id === a.il?.id))
    ),
  })).filter((g) => g.kullanicilar.length > 0);

  const bolgesiz = kullanicilar.filter((k) =>
    k.assignments.length === 0 || !k.assignments.some((a) => a.bolge || a.il)
  );

  const seciliBolge = bolgeler.find((b) => b.id === davetForm.bolgeId);
  const onayBolge = bolgeler.find((b) => b.id === onayForm.bolgeId);

  async function handleDavet(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/kullanicilar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(davetForm),
    });
    setLoading(false);
    if (res.ok) {
      setShowDavetModal(false);
      setDavetForm({ ad: "", soyad: "", email: "", telefon: "", userRole: "IL_SORUMLUSU", bolgeId: "", ilId: "" });
      showToast("Kullanıcı davet edildi ✓");
      fetchKullanicilar();
    } else {
      const d = await res.json();
      showToast("Hata: " + d.error);
    }
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
    showToast(action === "onayla" ? "Kullanıcı onaylandı ✓" : "Başvuru reddedildi");
    fetchKullanicilar();
  }

  async function handleYetkiKal() {
    if (!showYetkiKalModal) return;
    setLoading(true);
    await fetch(`/api/kullanicilar/${showYetkiKalModal.id}/yetkikal`, { method: "POST" });
    setLoading(false);
    setShowYetkiKalModal(null);
    showToast("Yetki alındı");
    fetchKullanicilar();
  }

  async function handleSifreAta() {
    if (!showSifreModal || !yeniSifre) return;
    setLoading(true);
    const res = await fetch(`/api/kullanicilar/${showSifreModal.id}/sifre-ata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sifre: yeniSifre }),
    });
    setLoading(false);
    if (res.ok) {
      setShowSifreModal(null);
      setYeniSifre("");
      showToast("Şifre atandı ✓");
      fetchKullanicilar();
    } else {
      const d = await res.json();
      showToast("Hata: " + d.error);
    }
  }

  function KullaniciSatir({ k }: { k: Kullanici }) {
    const atama = k.assignments[0];
    const konum = atama?.il?.ad || atama?.bolge?.ad || "—";
    const atamaRol = atama?.role ? ROLE_LABELS[atama.role] : ROLE_LABELS[k.role];
    const sifresiVar = !!k.passwordHash;

    return (
      <tr className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-900 text-sm">{k.ad} {k.soyad}</div>
          <div className="text-xs text-gray-500">{k.email}</div>
          {k.telefon && <div className="text-xs text-gray-400">{k.telefon}</div>}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            k.role === "SISTEM_ADMIN" ? "bg-red-100 text-red-700" :
            k.role === "GENEL_MERKEZ" ? "bg-purple-100 text-purple-700" :
            k.role === "TURKIYE_SORUMLUSU" ? "bg-indigo-100 text-indigo-700" :
            k.role === "BOLGE_SORUMLUSU" ? "bg-blue-100 text-blue-700" :
            k.role === "IL_SORUMLUSU" ? "bg-green-100 text-green-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {atamaRol}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{konum}</td>
        <td className="px-4 py-3">
          {sifresiVar
            ? <span className="text-xs text-green-600 font-medium">✓ Şifreli</span>
            : <span className="text-xs text-red-500 font-medium">⚠ Şifresiz</span>}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(k.createdAt).toLocaleDateString("tr-TR")}
        </td>
        <td className="px-4 py-3">
          {tab === "bekleyen" ? (
            <button onClick={() => { setShowOnayModal(k); setOnayForm({ ilId: "", bolgeId: "", role: "IL_SORUMLUSU" }); }}
              className="text-blue-600 hover:underline text-xs font-semibold">İncele</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setShowSifreModal(k); setYeniSifre(""); }}
                className="text-xs text-blue-600 hover:underline font-medium">Şifre Ata</button>
              {!["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_SORUMLUSU"].includes(k.role) && (
                <button onClick={() => setShowYetkiKalModal(k)}
                  className="text-xs text-red-500 hover:underline font-medium">Yetkiyi Al</button>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  }

  const tableHead = (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kullanıcı</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Konum</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Şifre</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem</th>
      </tr>
    </thead>
  );

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>
          <p className="text-gray-500 text-sm mt-1">Toplam {kullanicilar.length} kullanıcı</p>
        </div>
        <button onClick={() => setShowDavetModal(true)}
          className="bg-blue-700 text-white px-4 py-2.5 rounded-lg hover:bg-blue-800 text-sm font-semibold shadow-sm">
          + Kullanıcı Davet Et
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(["aktif", "bekleyen"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-800"
            }`}>
            {t === "aktif" ? "Aktif Kullanıcılar" : `Bekleyenler`}
          </button>
        ))}
      </div>

      {/* Aktif kullanıcılar — bölge gruplu */}
      {tab === "aktif" ? (
        <div className="space-y-6">
          {grouped.map(({ bolge, kullanicilar: ks }) => (
            <div key={bolge.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
                <h2 className="font-bold text-blue-800 text-sm">{bolge.ad}</h2>
                <span className="text-xs text-blue-500 font-medium">{ks.length} kullanıcı</span>
              </div>
              <table className="w-full text-sm">
                {tableHead}
                <tbody>{ks.map((k) => <KullaniciSatir key={k.id} k={k} />)}</tbody>
              </table>
            </div>
          ))}

          {/* Bölge/il ataması olmayanlar */}
          {bolgesiz.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                <h2 className="font-bold text-gray-600 text-sm">Genel / Atanmamış</h2>
              </div>
              <table className="w-full text-sm">
                {tableHead}
                <tbody>{bolgesiz.map((k) => <KullaniciSatir key={k.id} k={k} />)}</tbody>
              </table>
            </div>
          )}

          {kullanicilar.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              Aktif kullanıcı bulunamadı
            </div>
          )}
        </div>
      ) : (
        /* Bekleyenler — düz tablo */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            {tableHead}
            <tbody>
              {kullanicilar.map((k) => <KullaniciSatir key={k.id} k={k} />)}
              {kullanicilar.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Bekleyen başvuru yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── DAVET MODAL ─── */}
      {showDavetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Kullanıcı Davet Et</h2>
            <form onSubmit={handleDavet} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Ad" value={davetForm.ad}
                  onChange={(e) => setDavetForm({ ...davetForm, ad: e.target.value })}
                  className={inputCls} />
                <input required placeholder="Soyad" value={davetForm.soyad}
                  onChange={(e) => setDavetForm({ ...davetForm, soyad: e.target.value })}
                  className={inputCls} />
              </div>
              <input required type="email" placeholder="E-posta" value={davetForm.email}
                onChange={(e) => setDavetForm({ ...davetForm, email: e.target.value })}
                className={inputCls} />
              <input placeholder="Telefon" value={davetForm.telefon}
                onChange={(e) => setDavetForm({ ...davetForm, telefon: e.target.value })}
                className={inputCls} />
              <select value={davetForm.userRole}
                onChange={(e) => setDavetForm({ ...davetForm, userRole: e.target.value as Role })}
                className={inputCls}>
                <option value="IL_SORUMLUSU">İl Sorumlusu</option>
                <option value="BOLGE_SORUMLUSU">Bölge Sorumlusu</option>
                <option value="TURKIYE_SORUMLUSU">Türkiye Sorumlusu</option>
                <option value="GENEL_MERKEZ">Genel Merkez</option>
              </select>
              <select value={davetForm.bolgeId}
                onChange={(e) => setDavetForm({ ...davetForm, bolgeId: e.target.value, ilId: "" })}
                className={inputCls}>
                <option value="">Bölge Seç</option>
                {bolgeler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
              </select>
              {seciliBolge && ["IL_SORUMLUSU"].includes(davetForm.userRole) && (
                <select value={davetForm.ilId}
                  onChange={(e) => setDavetForm({ ...davetForm, ilId: e.target.value })}
                  className={inputCls}>
                  <option value="">İl Seç</option>
                  {seciliBolge.iller.map((il) => <option key={il.id} value={il.id}>{il.ad}</option>)}
                </select>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDavetModal(false)}
                  className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-700 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-blue-800 disabled:opacity-50">
                  {loading ? "Gönderiliyor..." : "Davet Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ONAY MODAL ─── */}
      {showOnayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Başvuruyu İncele</h2>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-semibold text-gray-800">{showOnayModal.ad} {showOnayModal.soyad}</p>
              <p className="text-gray-500">{showOnayModal.email}</p>
              {showOnayModal.telefon && <p className="text-gray-500">{showOnayModal.telefon}</p>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Atanacak Rol</label>
                <select value={onayForm.role}
                  onChange={(e) => setOnayForm({ ...onayForm, role: e.target.value as Role })}
                  className={inputCls}>
                  <option value="IL_SORUMLUSU">İl Sorumlusu</option>
                  <option value="BOLGE_SORUMLUSU">Bölge Sorumlusu</option>
                  <option value="TURKIYE_SORUMLUSU">Türkiye Sorumlusu</option>
                  <option value="GENEL_MERKEZ">Genel Merkez</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Bölge</label>
                <select value={onayForm.bolgeId}
                  onChange={(e) => setOnayForm({ ...onayForm, bolgeId: e.target.value, ilId: "" })}
                  className={inputCls}>
                  <option value="">Seçiniz</option>
                  {bolgeler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}
                </select>
              </div>
              {onayBolge && onayForm.role === "IL_SORUMLUSU" && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">İl</label>
                  <select value={onayForm.ilId}
                    onChange={(e) => setOnayForm({ ...onayForm, ilId: e.target.value })}
                    className={inputCls}>
                    <option value="">Seçiniz</option>
                    {onayBolge.iller.map((il) => <option key={il.id} value={il.id}>{il.ad}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => handleOnay("reddet")} disabled={loading}
                className="flex-1 border-2 border-red-300 text-red-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
                Reddet
              </button>
              <button onClick={() => setShowOnayModal(null)}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
              <button onClick={() => handleOnay("onayla")} disabled={loading}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                {loading ? "..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── YETKİ AL MODAL ─── */}
      {showYetkiKalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Yetkiyi Al</h2>
            <p className="text-gray-500 text-sm mb-5">
              <span className="font-semibold text-gray-800">{showYetkiKalModal.ad} {showYetkiKalModal.soyad}</span> kullanıcısının yetkisi alınacak ve hesabı beklemeye alınacak. Emin misiniz?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowYetkiKalModal(null)}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
              <button onClick={handleYetkiKal} disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                {loading ? "..." : "Evet, Al"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ŞİFRE ATA MODAL ─── */}
      {showSifreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Şifre Ata</h2>
            <p className="text-gray-500 text-sm mb-4">{showSifreModal.ad} {showSifreModal.soyad} için yeni şifre</p>
            <input
              type="text" value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="Yeni şifre (min 6 karakter)"
              className={inputCls + " mb-4"}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSifreModal(null)}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
              <button onClick={handleSifreAta} disabled={loading || yeniSifre.length < 6}
                className="flex-1 bg-blue-700 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-blue-800 disabled:opacity-50">
                {loading ? "..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
