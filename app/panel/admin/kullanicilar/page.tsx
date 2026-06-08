"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

// ──────────────────────────────────────────────
// Tipler
// ──────────────────────────────────────────────
type SistemKey = "yetkili" | "egitimci" | "universite" | "lise" | "gonullu";
type SubTab    = "aktif" | "bekleyen";

interface Assignment {
  id: string; role: Role;
  il?: { id: string; ad: string };
  bolge?: { id: string; ad: string };
}

interface Kullanici {
  id: string; ad: string; soyad: string; email: string;
  telefon?: string; role: Role; status: string; sistem?: string;
  passwordHash?: string | null; createdAt: string;
  assignments: Assignment[];
  basvuruGorev?: string | null;
  basvuruBolgeId?: string | null;
  basvuruIlId?: string | null;
}

interface Gonullu {
  id: string; adSoyad: string; telefon: string; email?: string;
  ogrenim: string; ogrenimTuru?: string; okul?: string; bolum?: string; il?: string;
  createdAt: string; _count: { bursBasvurulari: number; geriBildirimler: number };
}

interface Il    { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

// ──────────────────────────────────────────────
// Sabitler
// ──────────────────────────────────────────────
const SISTEM_TABS: { key: SistemKey; label: string; color: string; enum?: string }[] = [
  { key: "yetkili",    label: "Yetkili Girişi",     color: "#92400E", enum: "YONETICI" },
  { key: "egitimci",   label: "Eğitimci",           color: "#0B6B3A", enum: "EGITIMCI" },
  { key: "universite", label: "Üniversite Gençlik",  color: "#1D4ED8", enum: "UNIVERSITE" },
  { key: "lise",       label: "Lise Gençlik",        color: "#7C3AED", enum: "LISE" },
  { key: "gonullu",    label: "Gönüllüler",           color: "#B45309" },
];

const OGRENIM_LABELS: Record<string, string> = {
  ILKOKUL: "İlkokul", ORTAOKUL: "Ortaokul", LISE: "Lise", UNIVERSITE: "Üniversite",
};

const inputCls = "w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

// ──────────────────────────────────────────────
// Yardımcı bileşenler
// ──────────────────────────────────────────────
// Yetkili sekmesinde rol+sistem'e göre özel etiket
function YetkiliRolBadge({ role, sistem }: { role: string; sistem?: string | null }) {
  const label =
    role === "SISTEM_ADMIN"                                         ? "Sistem Admini" :
    role === "GENEL_MERKEZ"                                         ? "Merkez Ekibi"  :
    role === "TURKIYE_SORUMLUSU" && sistem === "EGITIMCI"           ? "Türkiye Eğitim Sorumlusu"         :
    role === "TURKIYE_SORUMLUSU" && sistem === "UNIVERSITE"         ? "Türkiye Üniversite Gençlik Sorumlusu" :
    role === "TURKIYE_SORUMLUSU" && sistem === "LISE"               ? "Türkiye Lise Gençlik Sorumlusu"   :
    role === "TURKIYE_SORUMLUSU"                                    ? "Türkiye Sorumlusu" :
    ROLE_LABELS[role as Role] ?? role;

  const cls =
    role === "SISTEM_ADMIN"      ? "bg-red-100 text-red-700"       :
    role === "GENEL_MERKEZ"      ? "bg-purple-100 text-purple-700" :
    role === "TURKIYE_SORUMLUSU" ? "bg-amber-100 text-amber-700"   :
    "bg-gray-100 text-gray-600";

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function RolBadge({ role }: { role: string }) {
  const cls =
    role === "SISTEM_ADMIN"      ? "bg-red-100 text-red-700" :
    role === "GENEL_MERKEZ"      ? "bg-purple-100 text-purple-700" :
    role === "TURKIYE_SORUMLUSU" ? "bg-indigo-100 text-indigo-700" :
    role === "BOLGE_SORUMLUSU"   ? "bg-blue-100 text-blue-700" :
    role === "IL_SORUMLUSU"      ? "bg-green-100 text-green-700" :
    "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>
      {ROLE_LABELS[role as Role] ?? role}
    </span>
  );
}

// ──────────────────────────────────────────────
// Ana sayfa
// ──────────────────────────────────────────────
export default function KullanicilarPage() {
  const searchParams = useSearchParams();
  const sistemParam  = searchParams.get("sistem");

  // Aktif ana sekme (query param'dan başla)
  const initTab: SistemKey = (() => {
    if (sistemParam === "YONETICI")   return "yetkili";
    if (sistemParam === "UNIVERSITE") return "universite";
    if (sistemParam === "LISE")       return "lise";
    if (sistemParam === "GONULLU")    return "gonullu";
    return "yetkili";
  })();

  const [tab, setTab]         = useState<SistemKey>(initTab);
  const [subTab, setSubTab]   = useState<SubTab>("aktif");

  const [aktifList,   setAktifList]   = useState<Kullanici[]>([]);
  const [bekleyenList,setBekleyenList]= useState<Kullanici[]>([]);
  const [gonulluler,  setGonulluler]  = useState<Gonullu[]>([]);
  const [bolgeler,    setBolgeler]    = useState<Bolge[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState("");

  // Counts per tab
  const [counts, setCounts] = useState<Record<SistemKey, { aktif: number; bekleyen: number }>>({
    yetkili:    { aktif: 0, bekleyen: 0 },
    egitimci:   { aktif: 0, bekleyen: 0 },
    universite: { aktif: 0, bekleyen: 0 },
    lise:       { aktif: 0, bekleyen: 0 },
    gonullu:    { aktif: 0, bekleyen: 0 },
  });

  // Modals
  const [showDavetModal,    setShowDavetModal]    = useState(false);
  const [showOnayModal,     setShowOnayModal]     = useState<Kullanici | null>(null);
  const [showYetkiKalModal, setShowYetkiKalModal] = useState<Kullanici | null>(null);
  const [showSifreModal,    setShowSifreModal]    = useState<Kullanici | null>(null);
  const [showSilModal,      setShowSilModal]      = useState<Kullanici | null>(null);
  const [yeniSifre,         setYeniSifre]         = useState("");

  const [davetForm, setDavetForm] = useState({
    ad: "", soyad: "", email: "", telefon: "",
    userRole: "IL_SORUMLUSU" as Role,
    bolgeId: "", ilId: "",
    sistem: "EGITIMCI",
  });
  const [onayForm, setOnayForm] = useState({ ilId: "", bolgeId: "", role: "IL_SORUMLUSU" as Role });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Bölgeler
  useEffect(() => {
    fetch("/api/bolgeler").then(r => r.json()).then(setBolgeler);
  }, []);

  // Veri yükleme
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "gonullu") {
        const res  = await fetch("/api/admin/gonulluler");
        const data: Gonullu[] = await res.json();
        setGonulluler(data);
        setCounts(prev => ({ ...prev, gonullu: { aktif: data.length, bekleyen: 0 } }));
      } else {
        const enumVal = SISTEM_TABS.find(t => t.key === tab)!.enum!;
        const [aktifRes, bekleyenRes] = await Promise.all([
          fetch(`/api/kullanicilar?sistem=${enumVal}&status=AKTIF`),
          fetch(`/api/kullanicilar?sistem=${enumVal}&status=BEKLEMEDE`),
        ]);
        const aktif:    Kullanici[] = await aktifRes.json();
        const bekleyen: Kullanici[] = await bekleyenRes.json();
        setAktifList(aktif);
        setBekleyenList(bekleyen);
        setCounts(prev => ({ ...prev, [tab]: { aktif: aktif.length, bekleyen: bekleyen.length } }));
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);


  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Handlers ────────────────────────────────
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
      setDavetForm({ ad: "", soyad: "", email: "", telefon: "", userRole: "IL_SORUMLUSU", bolgeId: "", ilId: "", sistem: "EGITIMCI" });
      showToast("Kullanıcı davet edildi");
      fetchData();
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
    showToast(action === "onayla" ? "Kullanıcı onaylandı" : "Başvuru reddedildi");
    fetchData();
  }

  async function handleYetkiKal() {
    if (!showYetkiKalModal) return;
    setLoading(true);
    await fetch(`/api/kullanicilar/${showYetkiKalModal.id}/yetkikal`, { method: "POST" });
    setLoading(false);
    setShowYetkiKalModal(null);
    showToast("Yetki alındı");
    fetchData();
  }

  async function handleSil() {
    if (!showSilModal) return;
    setLoading(true);
    const res = await fetch(`/api/kullanicilar/${showSilModal.id}/sil`, { method: "DELETE" });
    setLoading(false);
    setShowSilModal(null);
    if (res.ok) {
      showToast("Kullanıcı silindi");
      fetchData();
    } else {
      const d = await res.json();
      showToast("Hata: " + d.error);
    }
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
      setShowSifreModal(null); setYeniSifre(""); showToast("Şifre atandı"); fetchData();
    } else {
      const d = await res.json(); showToast("Hata: " + d.error);
    }
  }

  // ─── Table head ──────────────────────────────
  const tableHead = (isBekleyen: boolean) => (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kullanıcı</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {isBekleyen ? "Başvurulan Görev" : "Rol / Konum"}
        </th>
        {!isBekleyen && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Şifre</th>}
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem</th>
      </tr>
    </thead>
  );

  // ─── Rows ────────────────────────────────────
  function AktifRow({ k }: { k: Kullanici }) {
    const atama = k.assignments[0];
    const konum = atama?.il?.ad || atama?.bolge?.ad || "—";
    return (
      <tr className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-900 text-sm">{k.ad} {k.soyad}</div>
          <div className="text-xs text-gray-500">{k.email}</div>
          {k.telefon && <div className="text-xs text-gray-400">{k.telefon}</div>}
        </td>
        <td className="px-4 py-3">
          <RolBadge role={k.role} />
          {konum !== "—" && <div className="text-xs text-gray-400 mt-1">{konum}</div>}
        </td>
        <td className="px-4 py-3">
          {k.passwordHash
            ? <span className="text-xs text-green-600 font-medium">Şifreli</span>
            : <span className="text-xs text-red-500 font-medium">Şifresiz</span>}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(k.createdAt).toLocaleDateString("tr-TR")}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setShowSifreModal(k); setYeniSifre(""); }}
              className="text-xs text-blue-600 hover:underline font-medium">Şifre Ata</button>
            {k.role !== "SISTEM_ADMIN" && (
              <button onClick={() => setShowYetkiKalModal(k)}
                className="text-xs text-orange-500 hover:underline font-medium">Yetkiyi Al</button>
            )}
            {k.role !== "SISTEM_ADMIN" && (
              <button onClick={() => setShowSilModal(k)}
                className="text-xs text-red-600 hover:underline font-medium">Sil</button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  function BekleyenRow({ k }: { k: Kullanici }) {
    const basvuruBolge = bolgeler.find(b => b.id === k.basvuruBolgeId);
    const basvuruIl    = bolgeler.flatMap(b => b.iller).find(il => il.id === k.basvuruIlId);
    return (
      <tr className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
        <td className="px-4 py-3">
          <div className="font-semibold text-gray-900 text-sm">{k.ad} {k.soyad}</div>
          <div className="text-xs text-gray-500">{k.email}</div>
          {k.telefon && <div className="text-xs text-gray-400">{k.telefon}</div>}
        </td>
        <td className="px-4 py-3">
          {k.basvuruGorev ? (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                {ROLE_LABELS[k.basvuruGorev as Role] ?? k.basvuruGorev}
              </span>
              {basvuruBolge && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700">
                  {basvuruBolge.ad}
                </span>
              )}
              {basvuruIl && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-50 text-green-700">
                  {basvuruIl.ad}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Belirtilmedi</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(k.createdAt).toLocaleDateString("tr-TR")}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => {
              setShowOnayModal(k);
              setOnayForm({
                role:    (k.basvuruGorev as Role) || "IL_SORUMLUSU",
                bolgeId: k.basvuruBolgeId || "",
                ilId:    k.basvuruIlId    || "",
              });
            }}
            className="text-blue-600 hover:underline text-xs font-semibold"
          >
            İncele
          </button>
        </td>
      </tr>
    );
  }

  // ─── Grouped aktif users ─────────────────────
  const grouped = bolgeler.map(b => ({
    bolge: b,
    ks: aktifList.filter(k =>
      k.assignments.some(a => a.bolge?.id === b.id || b.iller.some(il => il.id === a.il?.id))
    ),
  })).filter(g => g.ks.length > 0);

  const bolgesiz = aktifList.filter(k =>
    k.assignments.length === 0 || !k.assignments.some(a => a.bolge || a.il)
  );

  const tabInfo = SISTEM_TABS.find(t => t.key === tab)!;
  const isNoSub = tab === "gonullu"; // alt sekme gösterme
  const seciliBolge = bolgeler.find(b => b.id === davetForm.bolgeId);
  const onayBolge   = bolgeler.find(b => b.id === onayForm.bolgeId);

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-500 text-sm mt-1">Sistemlere göre kullanıcıları yönetin</p>
        </div>
        {tab !== "gonullu" && tab !== "yetkili" && (
          <button
            onClick={() => { setShowDavetModal(true); setDavetForm(f => ({ ...f, sistem: tabInfo.enum! })); }}
            className="text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm"
            style={{ background: tabInfo.color }}
          >
            + Kullanıcı Davet Et
          </button>
        )}
      </div>

      {/* Ana sekmeler (4 sistem) */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-0">
        {SISTEM_TABS.map(t => {
          const total = t.key === "gonullu"
            ? counts[t.key].aktif
            : counts[t.key].aktif + counts[t.key].bekleyen;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSubTab("aktif"); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition border-b-2"
              style={{
                background:   tab === t.key ? "#fff" : "#F1F5F9",
                color:        tab === t.key ? t.color : "#64748B",
                borderColor:  tab === t.key ? t.color : "transparent",
                borderBottomWidth: 2,
              }}
            >
              {t.label}
              {total > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: tab === t.key ? t.color + "20" : "#E2E8F0",
                    color: tab === t.key ? t.color : "#64748B",
                  }}>
                  {total}
                </span>
              )}
              {/* Bekleyen uyarı noktası */}
              {t.key !== "gonullu" && counts[t.key].bekleyen > 0 && tab !== t.key && (
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200 p-0 overflow-hidden">

        {/* Alt sekmeler (Aktif / Bekleyenler) — gonullu hariç */}
        {!isNoSub && (
          <div className="flex border-b border-gray-200 px-5 pt-3 gap-4">
            <button
              onClick={() => setSubTab("aktif")}
              className="pb-3 text-sm font-semibold border-b-2 transition"
              style={{
                color:       subTab === "aktif" ? tabInfo.color : "#64748B",
                borderColor: subTab === "aktif" ? tabInfo.color : "transparent",
              }}
            >
              {tab === "yetkili" ? "Yetkili Kullanıcılar" : tabInfo.label + " Sistemi"}
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: subTab === "aktif" ? tabInfo.color + "15" : "#F1F5F9",
                  color: subTab === "aktif" ? tabInfo.color : "#94A3B8",
                }}>
                {counts[tab].aktif}
              </span>
            </button>
            <button
              onClick={() => setSubTab("bekleyen")}
              className="pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2"
              style={{
                color:       subTab === "bekleyen" ? "#DC2626" : "#64748B",
                borderColor: subTab === "bekleyen" ? "#DC2626" : "transparent",
              }}
            >
              Bekleyenler
              {counts[tab].bekleyen > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                  {counts[tab].bekleyen}
                </span>
              )}
            </button>
          </div>
        )}

        {/* İçerik */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
        ) : isNoSub ? (
          /* Gönüllüler listesi */
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ad Soyad</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Öğrenim</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Okul</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">İl</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Burs</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {gonulluler.map(g => (
                <tr key={g.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 text-sm">{g.adSoyad}</div>
                    {g.email && <div className="text-xs text-gray-500">{g.email}</div>}
                    <div className="text-xs text-gray-400">{g.telefon}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{OGRENIM_LABELS[g.ogrenim] ?? g.ogrenim}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{g.okul ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{g.il ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{g._count.bursBasvurulari}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(g.createdAt).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
              {gonulluler.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Gönüllü bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        ) : tab === "yetkili" && subTab === "aktif" ? (
          /* Yetkili aktif kullanıcılar — düz liste */
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">Kullanıcı</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">Sistem</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">Şifre</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">Kayıt</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-amber-800 uppercase tracking-wide">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {aktifList.map(k => (
                <tr key={k.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 text-sm">{k.ad} {k.soyad}</div>
                    <div className="text-xs text-gray-500">{k.email}</div>
                    {k.telefon && <div className="text-xs text-gray-400">{k.telefon}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <YetkiliRolBadge role={k.role} sistem={k.sistem} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">
                      {k.sistem === "EGITIMCI" ? "Eğitim" : k.sistem === "UNIVERSITE" ? "Üniversite" : k.sistem === "LISE" ? "Lise" : k.sistem ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {k.passwordHash
                      ? <span className="text-xs text-green-600 font-medium">Şifreli</span>
                      : <span className="text-xs text-red-500 font-medium">Şifresiz</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(k.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => { setShowSifreModal(k); setYeniSifre(""); }}
                        className="text-xs text-blue-600 hover:underline font-medium">Şifre Ata</button>
                      {k.role !== "SISTEM_ADMIN" && (
                        <button onClick={() => setShowYetkiKalModal(k)}
                          className="text-xs text-orange-500 hover:underline font-medium">Yetkiyi Al</button>
                      )}
                      {k.role !== "SISTEM_ADMIN" && (
                        <button onClick={() => setShowSilModal(k)}
                          className="text-xs text-red-600 hover:underline font-medium">Sil</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {aktifList.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Yetkili kullanıcı bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        ) : subTab === "bekleyen" ? (
          /* Bekleyenler alt sekmesi */
          <table className="w-full text-sm">
            {tableHead(true)}
            <tbody>
              {bekleyenList.map(k => <BekleyenRow key={k.id} k={k} />)}
              {bekleyenList.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Bekleyen başvuru yok</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          /* Aktif kullanıcılar — bölge gruplu */
          <div className="divide-y divide-gray-100">
            {grouped.map(({ bolge, ks }) => (
              <div key={bolge.id}>
                <div className="px-5 py-2.5 flex items-center justify-between"
                  style={{ background: tabInfo.color + "08" }}>
                  <h3 className="font-bold text-sm" style={{ color: tabInfo.color }}>{bolge.ad}</h3>
                  <span className="text-xs font-medium" style={{ color: tabInfo.color + "99" }}>{ks.length} kullanıcı</span>
                </div>
                <table className="w-full text-sm">
                  {tableHead(false)}
                  <tbody>{ks.map(k => <AktifRow key={k.id} k={k} />)}</tbody>
                </table>
              </div>
            ))}

            {bolgesiz.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-gray-50">
                  <h3 className="font-bold text-sm text-gray-500">Genel / Atanmamış</h3>
                </div>
                <table className="w-full text-sm">
                  {tableHead(false)}
                  <tbody>{bolgesiz.map(k => <AktifRow key={k.id} k={k} />)}</tbody>
                </table>
              </div>
            )}

            {aktifList.length === 0 && (
              <div className="px-4 py-10 text-center text-gray-400">Bu sistemde aktif kullanıcı bulunamadı</div>
            )}
          </div>
        )}
      </div>

      {/* ── DAVET MODAL ── */}
      {showDavetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Kullanıcı Davet Et</h2>
            <form onSubmit={handleDavet} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Ad" value={davetForm.ad}
                  onChange={e => setDavetForm({ ...davetForm, ad: e.target.value })} className={inputCls} />
                <input required placeholder="Soyad" value={davetForm.soyad}
                  onChange={e => setDavetForm({ ...davetForm, soyad: e.target.value })} className={inputCls} />
              </div>
              <input required type="email" placeholder="E-posta" value={davetForm.email}
                onChange={e => setDavetForm({ ...davetForm, email: e.target.value })} className={inputCls} />
              <input placeholder="Telefon" value={davetForm.telefon}
                onChange={e => setDavetForm({ ...davetForm, telefon: e.target.value })} className={inputCls} />
              <select value={davetForm.sistem}
                onChange={e => setDavetForm({ ...davetForm, sistem: e.target.value })} className={inputCls}>
                <option value="EGITIMCI">Eğitim Sistemi</option>
                <option value="UNIVERSITE">Üniversite Gençliği</option>
                <option value="LISE">Lise Gençliği</option>
              </select>
              <select value={davetForm.userRole}
                onChange={e => setDavetForm({ ...davetForm, userRole: e.target.value as Role })} className={inputCls}>
                <option value="IL_SORUMLUSU">İl Eğitimcisi</option>
                <option value="BOLGE_SORUMLUSU">Bölge Eğitimcisi</option>
                <option value="TURKIYE_SORUMLUSU">Türkiye Sorumlusu</option>
                <option value="GENEL_MERKEZ">Genel Merkez</option>
              </select>
              <select value={davetForm.bolgeId}
                onChange={e => setDavetForm({ ...davetForm, bolgeId: e.target.value, ilId: "" })} className={inputCls}>
                <option value="">Bölge Seç</option>
                {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
              </select>
              {seciliBolge && davetForm.userRole === "IL_SORUMLUSU" && (
                <select value={davetForm.ilId}
                  onChange={e => setDavetForm({ ...davetForm, ilId: e.target.value })} className={inputCls}>
                  <option value="">İl Seç</option>
                  {seciliBolge.iller.map(il => <option key={il.id} value={il.id}>{il.ad}</option>)}
                </select>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDavetModal(false)}
                  className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  İptal
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 text-white rounded-lg py-2.5 text-sm font-bold disabled:opacity-50"
                  style={{ background: tabInfo.color }}>
                  {loading ? "Gönderiliyor..." : "Davet Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ONAY MODAL ── */}
      {showOnayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Başvuruyu İncele</h2>
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
              <p className="font-semibold text-gray-800">{showOnayModal.ad} {showOnayModal.soyad}</p>
              <p className="text-gray-500">{showOnayModal.email}</p>
              {showOnayModal.telefon && <p className="text-gray-500">{showOnayModal.telefon}</p>}
              {showOnayModal.sistem && (
                <p className="text-xs text-gray-400 mt-1">
                  Sistem: <span className="font-medium text-gray-600">
                    {showOnayModal.sistem === "EGITIMCI" ? "Eğitim Sistemi" :
                     showOnayModal.sistem === "UNIVERSITE" ? "Üniversite Gençliği" :
                     showOnayModal.sistem === "LISE" ? "Lise Gençliği" : showOnayModal.sistem}
                  </span>
                </p>
              )}
            </div>

            {showOnayModal.basvuruGorev && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5">Başvurulan Görev</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                    {ROLE_LABELS[showOnayModal.basvuruGorev as Role] ?? showOnayModal.basvuruGorev}
                  </span>
                  {showOnayModal.basvuruBolgeId && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {bolgeler.find(b => b.id === showOnayModal.basvuruBolgeId)?.ad ?? "Bölge"}
                    </span>
                  )}
                  {showOnayModal.basvuruIlId && (
                    <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {bolgeler.flatMap(b => b.iller).find(il => il.id === showOnayModal.basvuruIlId)?.ad ?? "İl"}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Atanacak Rol</label>
                <select value={onayForm.role}
                  onChange={e => setOnayForm({ ...onayForm, role: e.target.value as Role })} className={inputCls}>
                  <option value="IL_SORUMLUSU">İl Eğitimcisi</option>
                  <option value="BOLGE_SORUMLUSU">Bölge Eğitimcisi</option>
                  <option value="TURKIYE_SORUMLUSU">Türkiye Sorumlusu</option>
                  <option value="GENEL_MERKEZ">Genel Merkez</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Bölge</label>
                <select value={onayForm.bolgeId}
                  onChange={e => setOnayForm({ ...onayForm, bolgeId: e.target.value, ilId: "" })} className={inputCls}>
                  <option value="">Seçiniz</option>
                  {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                </select>
              </div>
              {onayBolge && onayForm.role === "IL_SORUMLUSU" && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">İl</label>
                  <select value={onayForm.ilId}
                    onChange={e => setOnayForm({ ...onayForm, ilId: e.target.value })} className={inputCls}>
                    <option value="">Seçiniz</option>
                    {onayBolge.iller.map(il => <option key={il.id} value={il.id}>{il.ad}</option>)}
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
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
              <button onClick={() => handleOnay("onayla")} disabled={loading}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                {loading ? "..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── YETKİ AL MODAL ── */}
      {showYetkiKalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Yetkiyi Al</h2>
            <p className="text-gray-500 text-sm mb-5">
              <span className="font-semibold text-gray-800">{showYetkiKalModal.ad} {showYetkiKalModal.soyad}</span>{" "}
              kullanıcısının yetkisi alınacak ve hesabı beklemeye alınacak. Emin misiniz?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowYetkiKalModal(null)}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
              <button onClick={handleYetkiKal} disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                {loading ? "..." : "Evet, Al"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SİL MODAL ── */}
      {showSilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Hesabı Sil</h2>
            <p className="text-gray-500 text-sm mb-1">
              <span className="font-semibold text-gray-800">{showSilModal.ad} {showSilModal.soyad}</span>
            </p>
            <p className="text-gray-400 text-xs mb-5">
              Bu işlem geri alınamaz. Kullanıcının tüm atamaları ve hesap bilgileri kalıcı olarak silinecek.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSilModal(null)}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
              <button onClick={handleSil} disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                {loading ? "..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ŞİFRE ATA MODAL ── */}
      {showSifreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Şifre Ata</h2>
            <p className="text-gray-500 text-sm mb-4">{showSifreModal.ad} {showSifreModal.soyad} için yeni şifre</p>
            <input type="text" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)}
              placeholder="Yeni şifre (min 6 karakter)" className={inputCls + " mb-4"} />
            <div className="flex gap-2">
              <button onClick={() => setShowSifreModal(null)}
                className="flex-1 border-2 border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                İptal
              </button>
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
