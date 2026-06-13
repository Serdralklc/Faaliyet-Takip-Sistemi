"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ROLE_LABELS, rolEtiket, gorevEtiket } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";

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
  icerikYoneticisi?: boolean;
  merkezGorev?: string | null;
  passwordHash?: string | null; createdAt: string; sonAktif?: string | null;
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
const TURKIYE_ROLLERI = [
  "TURKIYE_EGITIM_SORUMLUSU",
  "TURKIYE_UNIVERSITE_SORUMLUSU",
  "TURKIYE_LISE_SORUMLUSU",
];
// Yalnızca kendi sistemini yöneten roller
const SISTEM_KISITLI_ROLLER = [
  "TURKIYE_UNIVERSITE_SORUMLUSU",
  "TURKIYE_LISE_SORUMLUSU",
];

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

const inputCls = "w-full border-2 border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card";

// ── DataTable sütunları (state'e bağımlı olmayanlar modül seviyesinde) ──
const GONULLU_COLS: DataTableColumn<Gonullu>[] = [
  {
    key: "adSoyad", header: "Ad Soyad", mobile: true,
    render: g => (
      <div>
        <div className="font-semibold text-heading text-sm">{g.adSoyad}</div>
        {g.email && <div className="text-xs text-muted">{g.email}</div>}
        <div className="text-xs text-muted">{g.telefon}</div>
      </div>
    ),
  },
  { key: "ogrenim", header: "Öğrenim", render: g => <span className="text-sm text-secondary">{OGRENIM_LABELS[g.ogrenim] ?? g.ogrenim}</span> },
  { key: "okul", header: "Okul", render: g => <span className="text-sm text-secondary">{g.okul ?? "—"}</span> },
  { key: "il", header: "İl", mobile: true, render: g => <span className="text-sm text-secondary">{g.il ?? "—"}</span> },
  {
    key: "burs", header: "Burs", align: "center", mobile: true,
    sortValue: g => g._count.bursBasvurulari,
    render: g => <span className="text-sm font-semibold text-secondary">{g._count.bursBasvurulari}</span>,
  },
  {
    key: "createdAt", header: "Kayıt",
    sortValue: g => new Date(g.createdAt).getTime(),
    render: g => <span className="text-xs text-muted">{new Date(g.createdAt).toLocaleDateString("tr-TR")}</span>,
  },
];

const YETKILI_COLS: DataTableColumn<Kullanici>[] = [
  {
    key: "ad", header: "Kullanıcı", mobile: true,
    sortValue: k => `${k.ad} ${k.soyad}`,
    render: k => (
      <div>
        <div className="font-semibold text-heading text-sm">{k.ad} {k.soyad}</div>
        <div className="text-xs text-muted">{k.email}</div>
        {k.telefon && <div className="text-xs text-muted">{k.telefon}</div>}
      </div>
    ),
  },
  {
    key: "role", header: "Rol", mobile: true,
    sortValue: k => ROLE_LABELS[k.role] ?? k.role,
    render: k => (
      <div className="flex flex-wrap items-center gap-1.5">
        <YetkiliRolBadge role={k.role} sistem={k.sistem} merkezGorev={k.merkezGorev} />
        {k.icerikYoneticisi && (
          <span className="text-xs px-2 py-1 rounded-full font-semibold bg-cyan-100 text-cyan-700">
            İçerik Yöneticisi
          </span>
        )}
      </div>
    ),
  },
  {
    key: "sistem", header: "Sistem",
    render: k => (
      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">
        {k.sistem === "EGITIMCI" ? "Eğitim" : k.sistem === "UNIVERSITE" ? "Üniversite" : k.sistem === "LISE" ? "Lise" : k.sistem ?? "—"}
      </span>
    ),
  },
  {
    key: "passwordHash", header: "Şifre",
    sortValue: k => (k.passwordHash ? 1 : 0),
    render: k =>
      k.passwordHash
        ? <span className="text-xs text-green-600 font-medium">Şifreli</span>
        : <span className="text-xs text-red-500 font-medium">Şifresiz</span>,
  },
  {
    key: "createdAt", header: "Kayıt", defaultHidden: true,
    sortValue: k => new Date(k.createdAt).getTime(),
    render: k => <span className="text-xs text-muted">{new Date(k.createdAt).toLocaleDateString("tr-TR")}</span>,
  },
  {
    key: "sonAktif", header: "Son Aktif", mobile: true,
    sortValue: k => (k.sonAktif ? new Date(k.sonAktif).getTime() : 0),
    render: k => k.sonAktif
      ? <span className="text-xs text-secondary">{new Date(k.sonAktif).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</span>
      : <span className="text-xs text-muted italic">hiç giriş yok</span>,
  },
];

// ──────────────────────────────────────────────
// Yardımcı bileşenler
// ──────────────────────────────────────────────
// Yetkili sekmesinde rol+sistem'e göre özel etiket
function YetkiliRolBadge({ role, sistem, merkezGorev }: { role: string; sistem?: string | null; merkezGorev?: string | null }) {
  const label = gorevEtiket(role, sistem, merkezGorev);

  const cls =
    role === "SISTEM_ADMIN"      ? "bg-red-100 text-red-700"       :
    role === "TEKNIK"            ? "bg-slate-200 text-slate-700"   :
    role === "GENEL_MERKEZ"      ? "bg-purple-100 text-purple-700" :
    TURKIYE_ROLLERI.includes(role) ? "bg-amber-100 text-amber-700"   :
    "bg-subtle text-secondary";

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function RolBadge({ role, sistem }: { role: string; sistem?: string | null }) {
  const cls =
    role === "SISTEM_ADMIN"      ? "bg-red-100 text-red-700" :
    role === "GENEL_MERKEZ"      ? "bg-purple-100 text-purple-700" :
    TURKIYE_ROLLERI.includes(role) ? "bg-indigo-100 text-indigo-700" :
    role === "BOLGE_SORUMLUSU"   ? "bg-blue-100 text-blue-700" :
    role === "IL_SORUMLUSU"      ? "bg-green-100 text-green-700" :
    "bg-subtle text-secondary";
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cls}`}>
      {rolEtiket(role, sistem)}
    </span>
  );
}

// ──────────────────────────────────────────────
// Ana sayfa
// ──────────────────────────────────────────────
export default function KullanicilarPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const sistemParam  = searchParams.get("sistem");

  const sessionRole   = session?.user?.role ?? "";
  const sessionSistem = session?.user?.sistem ?? "";
  // Sistem kısıtlı roller yalnızca kendi sistemini yönetir
  const isTuriyeSorumlusu = SISTEM_KISITLI_ROLLER.includes(sessionRole);

  // TURKIYE_SORUMLUSU kendi sisteminde başlar
  const initTab: SistemKey = (() => {
    if (isTuriyeSorumlusu) {
      if (sessionSistem === "UNIVERSITE") return "universite";
      if (sessionSistem === "LISE")       return "lise";
      return "egitimci";
    }
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
  const [aktifAra,    setAktifAra]    = useState(""); // bölge gruplu görünüm araması

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
  const [onayForm, setOnayForm] = useState({ ilId: "", bolgeId: "", role: "IL_SORUMLUSU" as Role, sistem: "" });
  // yetkili sekmesi için atanacak rol
  const [yetkiliRol, setYetkiliRol] = useState<Role>("TURKIYE_EGITIM_SORUMLUSU");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Tüm tab verileri cache
  const [allData, setAllData] = useState<Record<string, { aktif: Kullanici[]; bekleyen: Kullanici[] }>>({});

  // Tek bir tab için veri çek ve cache'e yaz
  const fetchTab = useCallback(async (key: SistemKey) => {
    const t = SISTEM_TABS.find(x => x.key === key);
    if (!t) return;
    if (key === "gonullu") {
      const data: Gonullu[] = await fetch("/api/admin/gonulluler").then(r => r.json());
      setGonulluler(data);
      setCounts(prev => ({ ...prev, gonullu: { aktif: data.length, bekleyen: 0 } }));
      return;
    }
    const [aktif, bekleyen]: [Kullanici[], Kullanici[]] = await Promise.all([
      fetch(`/api/kullanicilar?sistem=${t.enum}&status=AKTIF`).then(r => r.json()),
      fetch(`/api/kullanicilar?sistem=${t.enum}&status=BEKLEMEDE`).then(r => r.json()),
    ]);
    setAllData(prev => ({ ...prev, [key]: { aktif, bekleyen } }));
    setCounts(prev => ({ ...prev, [key]: { aktif: aktif.length, bekleyen: bekleyen.length } }));
  }, []);

  // Mount: bölgeler + tüm tabları paralel yükle
  useEffect(() => {
    setLoading(true);
    fetch("/api/bolgeler").then(r => r.json()).then(setBolgeler);
    const keys: SistemKey[] = ["yetkili", "egitimci", "universite", "lise", "gonullu"];
    Promise.allSettled(keys.map(k => fetchTab(k))).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // allData değişince aktif tab listelerini güncelle
  useEffect(() => {
    const d = allData[tab];
    if (d) { setAktifList(d.aktif); setBekleyenList(d.bekleyen); }
  }, [tab, allData]);

  // Veri yenileme (işlem sonrası)
  const fetchData = useCallback(async () => {
    setLoading(true);
    const keys: SistemKey[] = ["yetkili", "egitimci", "universite", "lise", "gonullu"];
    await Promise.allSettled(keys.map(k => fetchTab(k)));
    setLoading(false);
  }, [fetchTab]);

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
    // Yetkili sekmesindeyse direkt rolü gönder (sistem rol içinde zaten belli)
    const SISTEM_MAP: Record<string, string> = {
      TURKIYE_EGITIM_SORUMLUSU:     "EGITIMCI",
      TURKIYE_UNIVERSITE_SORUMLUSU: "UNIVERSITE",
      TURKIYE_LISE_SORUMLUSU:       "LISE",
      GENEL_MERKEZ:                 "EGITIMCI",
    };
    let body: Record<string, unknown> = { action, ...onayForm };
    if (tab === "yetkili" && action === "onayla") {
      body = { action, role: yetkiliRol, sistem: SISTEM_MAP[yetkiliRol] ?? "EGITIMCI", ilId: "", bolgeId: "" };
    }
    await fetch(`/api/kullanicilar/${showOnayModal.id}/onayla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  // İçerik Yöneticisi ek rolünü ver / al (yalnızca Merkez Ekip)
  async function handleIcerikToggle(k: Kullanici) {
    setLoading(true);
    const res = await fetch(`/api/kullanicilar/${k.id}/icerik-yoneticisi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deger: !k.icerikYoneticisi }),
    });
    setLoading(false);
    if (res.ok) {
      showToast(k.icerikYoneticisi ? "İçerik Yöneticisi yetkisi alındı" : "İçerik Yöneticisi yetkisi verildi");
      fetchData();
    } else {
      const d = await res.json();
      showToast("Hata: " + d.error);
    }
  }

  // Merkez görevi ata/değiştir (Merkez Ekip / Teknik kullanıcıları)
  async function handleGorev(k: Kullanici, gorev: string) {
    setLoading(true);
    const res = await fetch(`/api/kullanicilar/${k.id}/gorev`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gorev }),
    });
    setLoading(false);
    if (res.ok) { showToast("Görev güncellendi"); fetchData(); }
    else { const d = await res.json(); showToast("Hata: " + d.error); }
  }

  // ─── Table head ──────────────────────────────
  const tableHead = (isBekleyen: boolean) => (
    <thead className="bg-th border-b border-border">
      <tr>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Kullanıcı</th>
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">
          {isBekleyen ? "Başvurulan Görev" : "Rol / Konum"}
        </th>
        {!isBekleyen && <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Şifre</th>}
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Kayıt</th>
        {!isBekleyen && <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">Son Aktif</th>}
        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wide">İşlem</th>
      </tr>
    </thead>
  );

  // ─── Rows ────────────────────────────────────
  function AktifRow({ k }: { k: Kullanici }) {
    const atama = k.assignments[0];
    const konum = atama?.il?.ad || atama?.bolge?.ad || "—";
    return (
      <tr className="hover:bg-th border-b border-border last:border-0">
        <td className="px-4 py-3">
          <div className="font-semibold text-heading text-sm">{k.ad} {k.soyad}</div>
          <div className="text-xs text-muted">{k.email}</div>
          {k.telefon && <div className="text-xs text-muted">{k.telefon}</div>}
        </td>
        <td className="px-4 py-3">
          <RolBadge role={k.role} sistem={k.sistem} />
          {konum !== "—" && <div className="text-xs text-muted mt-1">{konum}</div>}
        </td>
        <td className="px-4 py-3">
          {k.passwordHash
            ? <span className="text-xs text-green-600 font-medium">Şifreli</span>
            : <span className="text-xs text-red-500 font-medium">Şifresiz</span>}
        </td>
        <td className="px-4 py-3 text-xs text-muted">
          {new Date(k.createdAt).toLocaleDateString("tr-TR")}
        </td>
        <td className="px-4 py-3 text-xs">
          {k.sonAktif
            ? <span className="text-secondary">{new Date(k.sonAktif).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</span>
            : <span className="text-muted italic">hiç giriş yok</span>}
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

  // Bekleyen tablosu sütunları (bölge/il adları için bolgeler state'ine bağlı)
  const bekleyenCols: DataTableColumn<Kullanici>[] = [
    {
      key: "ad", header: "Kullanıcı", mobile: true,
      sortValue: k => `${k.ad} ${k.soyad}`,
      render: k => (
        <div>
          <div className="font-semibold text-heading text-sm">{k.ad} {k.soyad}</div>
          <div className="text-xs text-muted">{k.email}</div>
          {k.telefon && <div className="text-xs text-muted">{k.telefon}</div>}
        </div>
      ),
    },
    {
      key: "gorev", header: "Başvurulan Görev", mobile: true, sortable: false,
      render: k => {
        const basvuruBolge = bolgeler.find(b => b.id === k.basvuruBolgeId);
        const basvuruIl    = bolgeler.flatMap(b => b.iller).find(il => il.id === k.basvuruIlId);
        return k.basvuruGorev ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
              {rolEtiket(k.basvuruGorev as Role, k.sistem)}
            </span>
            {basvuruBolge && (
              <span className="text-xs px-2 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700">{basvuruBolge.ad}</span>
            )}
            {basvuruIl && (
              <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-50 text-green-700">{basvuruIl.ad}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted">Belirtilmedi</span>
        );
      },
    },
    {
      key: "createdAt", header: "Başvuru",
      sortValue: k => new Date(k.createdAt).getTime(),
      render: k => <span className="text-xs text-muted">{new Date(k.createdAt).toLocaleDateString("tr-TR")}</span>,
    },
  ];

  /** Seçili bekleyen başvuruları, başvurdukları görev/bölge/il değerleriyle topluca onaylar */
  async function handleTopluOnay(rows: Kullanici[]) {
    setLoading(true);
    const results = await Promise.allSettled(
      rows.map(k =>
        fetch(`/api/kullanicilar/${k.id}/onayla`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:  "onayla",
            role:    (k.basvuruGorev as Role) || "IL_SORUMLUSU",
            bolgeId: k.basvuruBolgeId || "",
            ilId:    k.basvuruIlId    || "",
            sistem:  k.sistem || "",
          }),
        }).then(r => { if (!r.ok) throw new Error("onay başarısız"); })
      )
    );
    setLoading(false);
    const ok = results.filter(r => r.status === "fulfilled").length;
    const fail = results.length - ok;
    showToast(fail ? `${ok} başvuru onaylandı, ${fail} başarısız` : `${ok} başvuru onaylandı`);
    fetchData();
  }

  // ─── Grouped aktif users (bölge gruplu görünümde arama) ─────────
  const aktifFiltreli = aktifAra.trim()
    ? aktifList.filter(k =>
        `${k.ad} ${k.soyad} ${k.email} ${k.telefon ?? ""}`
          .toLocaleLowerCase("tr")
          .includes(aktifAra.trim().toLocaleLowerCase("tr"))
      )
    : aktifList;

  const grouped = bolgeler.map(b => ({
    bolge: b,
    ks: aktifFiltreli.filter(k =>
      k.assignments.some(a => a.bolge?.id === b.id || b.iller.some(il => il.id === a.il?.id))
    ),
  })).filter(g => g.ks.length > 0);

  const bolgesiz = aktifFiltreli.filter(k =>
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
          <h1 className="text-2xl font-bold text-heading">Kullanıcı Yönetimi</h1>
          <p className="text-muted text-sm mt-1">Sistemlere göre kullanıcıları yönetin</p>
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
        {SISTEM_TABS.filter(t => {
          if (!isTuriyeSorumlusu) return true;
          // TURKIYE_SORUMLUSU yalnızca kendi sistem sekmesini görür
          if (sessionSistem === "UNIVERSITE") return t.key === "universite";
          if (sessionSistem === "LISE")       return t.key === "lise";
          return t.key === "egitimci";
        }).map(t => {
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
      <div className="bg-card rounded-b-xl rounded-tr-xl border border-border p-0 overflow-hidden">

        {/* Alt sekmeler (Aktif / Bekleyenler) — gonullu hariç */}
        {!isNoSub && (
          <div className="flex border-b border-border px-5 pt-3 gap-4">
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
          <div className="p-12 text-center text-muted">Yükleniyor...</div>
        ) : isNoSub ? (
          /* Gönüllüler listesi */
          <DataTable
            id="kullanicilar-gonullu"
            data={gonulluler}
            columns={GONULLU_COLS}
            rowKey={g => g.id}
            searchText={g => `${g.adSoyad} ${g.telefon} ${g.email ?? ""} ${g.okul ?? ""} ${g.il ?? ""}`}
            searchPlaceholder="Ad, telefon, okul veya il ara..."
            emptyText="Gönüllü bulunamadı"
          />
        ) : tab === "yetkili" && subTab === "aktif" ? (
          /* Yetkili aktif kullanıcılar */
          <DataTable
            id="kullanicilar-yetkili"
            data={aktifList}
            columns={YETKILI_COLS}
            rowKey={k => k.id}
            searchText={k => `${k.ad} ${k.soyad} ${k.email} ${k.telefon ?? ""}`}
            searchPlaceholder="Ad veya e-posta ara..."
            emptyText="Yetkili kullanıcı bulunamadı"
            rowActions={k => (
              <div className="flex gap-1.5 justify-end flex-wrap items-center">
                {(k.role === "GENEL_MERKEZ" || k.role === "TEKNIK") && (
                  <select
                    value={k.role === "TEKNIK" ? "TEKNIK" : (k.merkezGorev ?? "MERKEZ_EKIP")}
                    onChange={e => handleGorev(k, e.target.value)}
                    title="Merkez görevi ata"
                    className="text-xs border-2 border-border rounded-lg px-2 py-1.5 bg-card text-heading focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="MERKEZ_EKIP">Merkez Ekibi</option>
                    <option value="ILKOGRETIM">Merkez İlköğretim Sor.</option>
                    <option value="LISE">Merkez Lise Sor.</option>
                    <option value="UNIVERSITE">Merkez Üniversite Sor.</option>
                    <option value="SEKRETERYA">Merkez Sekreterya</option>
                    <option value="TEKNIK">Teknik</option>
                  </select>
                )}
                <Button size="sm" variant="secondary" onClick={() => { setShowSifreModal(k); setYeniSifre(""); }}>Şifre Ata</Button>
                {k.role === "GENEL_MERKEZ" && (
                  <Button size="sm" variant={k.icerikYoneticisi ? "ghost" : "primary"} onClick={() => handleIcerikToggle(k)}>
                    {k.icerikYoneticisi ? "İçerik Yön. Al" : "İçerik Yön. Ver"}
                  </Button>
                )}
                {k.role !== "SISTEM_ADMIN" && (
                  <Button size="sm" variant="ghost" onClick={() => setShowYetkiKalModal(k)}>Yetkiyi Al</Button>
                )}
                {k.role !== "SISTEM_ADMIN" && (
                  <Button size="sm" variant="danger" onClick={() => setShowSilModal(k)}>Sil</Button>
                )}
              </div>
            )}
          />
        ) : subTab === "bekleyen" ? (
          /* Bekleyenler alt sekmesi — toplu onay destekli */
          <DataTable
            id={`kullanicilar-${tab}-bekleyen`}
            data={bekleyenList}
            columns={bekleyenCols}
            rowKey={k => k.id}
            searchText={k => `${k.ad} ${k.soyad} ${k.email}`}
            searchPlaceholder="Ad veya e-posta ara..."
            emptyText="Bekleyen başvuru yok"
            selectable
            bulkActions={[{ label: "Seçilenleri Onayla", tone: "primary", onClick: handleTopluOnay }]}
            rowActions={k => (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowOnayModal(k);
                  setOnayForm({
                    role:    (k.basvuruGorev as Role) || "IL_SORUMLUSU",
                    bolgeId: k.basvuruBolgeId || "",
                    ilId:    k.basvuruIlId    || "",
                    sistem:  k.sistem || "",
                  });
                }}
              >
                İncele
              </Button>
            )}
          />
        ) : (
          /* Aktif kullanıcılar — bölge gruplu */
          <div>
            <div className="px-4 py-3 border-b border-border">
              <input
                type="search"
                value={aktifAra}
                onChange={e => setAktifAra(e.target.value)}
                placeholder="Ad, e-posta veya telefon ara..."
                aria-label="Aktif kullanıcılarda ara"
                className="w-full max-w-sm rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3.5 py-2 placeholder:text-[var(--text-placeholder)] focus:border-[var(--accent)] transition"
              />
            </div>
          <div className="divide-y divide-border">
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
                <div className="px-5 py-2.5 bg-th">
                  <h3 className="font-bold text-sm text-muted">Genel / Atanmamış</h3>
                </div>
                <table className="w-full text-sm">
                  {tableHead(false)}
                  <tbody>{bolgesiz.map(k => <AktifRow key={k.id} k={k} />)}</tbody>
                </table>
              </div>
            )}

            {aktifFiltreli.length === 0 && (
              <div className="px-4 py-10 text-center text-muted">
                {aktifAra ? `"${aktifAra}" için sonuç bulunamadı` : "Bu sistemde aktif kullanıcı bulunamadı"}
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* ── DAVET MODAL ── */}
      {showDavetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-heading mb-4">Kullanıcı Davet Et</h2>
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
                  className="flex-1 border-2 border-border rounded-lg py-2.5 text-sm font-semibold text-secondary hover:bg-th">
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
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-heading mb-1">Başvuruyu İncele</h2>
            <div className="bg-th rounded-lg p-3 mb-3 text-sm">
              <p className="font-semibold text-heading">{showOnayModal.ad} {showOnayModal.soyad}</p>
              <p className="text-muted">{showOnayModal.email}</p>
              {showOnayModal.telefon && <p className="text-muted">{showOnayModal.telefon}</p>}
              {showOnayModal.sistem && (
                <p className="text-xs text-muted mt-1">
                  Sistem: <span className="font-medium text-secondary">
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
                    {rolEtiket(showOnayModal.basvuruGorev as Role, showOnayModal.sistem)}
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
              {tab === "yetkili" ? (
                /* Yetkili sekmesi: sadece 4 özel rol, bölge/il yok */
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Atanacak Rol</label>
                  <select value={yetkiliRol}
                    onChange={e => setYetkiliRol(e.target.value as Role)} className={inputCls}>
                    <option value="TURKIYE_EGITIM_SORUMLUSU">Türkiye Eğitim Sorumlusu</option>
                    <option value="GENEL_MERKEZ">Merkez Ekibi</option>
                    <option value="TURKIYE_UNIVERSITE_SORUMLUSU">Merkez Üniversite Gençlik Sorumlusu</option>
                    <option value="TURKIYE_LISE_SORUMLUSU">Merkez Lise Gençlik Sorumlusu</option>
                  </select>
                </div>
              ) : (
                /* Normal sistemler: il/bölge eğitimcisi rolleri */
                <>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Atanacak Rol</label>
                    <select value={onayForm.role}
                      onChange={e => setOnayForm({ ...onayForm, role: e.target.value as Role })} className={inputCls}>
                      <option value="IL_SORUMLUSU">İl Eğitimcisi</option>
                      <option value="BOLGE_SORUMLUSU">Bölge Eğitimcisi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary mb-1">Bölge</label>
                    <select value={onayForm.bolgeId}
                      onChange={e => setOnayForm({ ...onayForm, bolgeId: e.target.value, ilId: "" })} className={inputCls}>
                      <option value="">Seçiniz</option>
                      {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                    </select>
                  </div>
                  {onayBolge && onayForm.role === "IL_SORUMLUSU" && (
                    <div>
                      <label className="block text-xs font-bold text-secondary mb-1">İl</label>
                      <select value={onayForm.ilId}
                        onChange={e => setOnayForm({ ...onayForm, ilId: e.target.value })} className={inputCls}>
                        <option value="">Seçiniz</option>
                        {onayBolge.iller.map(il => <option key={il.id} value={il.id}>{il.ad}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => handleOnay("reddet")} disabled={loading}
                className="flex-1 border-2 border-red-300 text-red-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
                Reddet
              </button>
              <button onClick={() => setShowOnayModal(null)}
                className="flex-1 border-2 border-border rounded-lg py-2.5 text-sm font-semibold text-secondary hover:bg-th">
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
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-heading mb-2">Yetkiyi Al</h2>
            <p className="text-muted text-sm mb-5">
              <span className="font-semibold text-heading">{showYetkiKalModal.ad} {showYetkiKalModal.soyad}</span>{" "}
              kullanıcısının yetkisi alınacak ve hesabı beklemeye alınacak. Emin misiniz?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowYetkiKalModal(null)}
                className="flex-1 border-2 border-border rounded-lg py-2.5 text-sm font-semibold text-secondary hover:bg-th">
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
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-heading mb-2">Hesabı Sil</h2>
            <p className="text-muted text-sm mb-1">
              <span className="font-semibold text-heading">{showSilModal.ad} {showSilModal.soyad}</span>
            </p>
            <p className="text-muted text-xs mb-5">
              Bu işlem geri alınamaz. Kullanıcının tüm atamaları ve hesap bilgileri kalıcı olarak silinecek.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowSilModal(null)}
                className="flex-1 border-2 border-border rounded-lg py-2.5 text-sm font-semibold text-secondary hover:bg-th">
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
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-heading mb-1">Şifre Ata</h2>
            <p className="text-muted text-sm mb-4">{showSifreModal.ad} {showSifreModal.soyad} için yeni şifre</p>
            <input type="text" value={yeniSifre} onChange={e => setYeniSifre(e.target.value)}
              placeholder="Yeni şifre (min 8 karakter)" className={inputCls + " mb-4"} />
            <div className="flex gap-2">
              <button onClick={() => setShowSifreModal(null)}
                className="flex-1 border-2 border-border rounded-lg py-2.5 text-sm font-semibold text-secondary hover:bg-th">
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
