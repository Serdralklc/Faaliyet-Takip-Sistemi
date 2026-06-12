"use client";
import { useState } from "react";
import { BRAND } from "@/lib/theme";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

const DURUM_BURS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  BEKLEMEDE:   { label: "Beklemede",   bg: "#FEF3C7", color: "#92400E" },
  INCELENIYOR: { label: "İnceleniyor", bg: "#EFF6FF", color: "#1D4ED8" },
  ONAYLANDI:   { label: "Onaylandı",   bg: "#D1FAE5", color: "#065F46" },
  REDDEDILDI:  { label: "Reddedildi",  bg: "#FEE2E2", color: "#991B1B" },
};
const DURUM_FB_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  YENI:        { label: "Yeni",        bg: "#EFF6FF", color: "#1D4ED8" },
  INCELENIYOR: { label: "İnceleniyor", bg: "#FEF3C7", color: "#92400E" },
  COZULDU:     { label: "Çözüldü",     bg: "#D1FAE5", color: "#065F46" },
  KAPATILDI:   { label: "Kapatıldı",   bg: "#F3F4F6", color: "#374151" },
};
const KONU_LABEL: Record<string, string> = {
  ONERI: "Öneri", TALEP: "Talep", TEKNIK_SORUN: "Teknik Sorun", DIGER: "Diğer",
};
const OGRENIM_LABEL: Record<string, string> = {
  ILKOKUL: "İlkokul", ORTAOKUL: "Ortaokul", LISE: "Lise", UNIVERSITE: "Üniversite",
};

const bursDurum = (d: string) => DURUM_BURS_CONFIG[d] || { label: d, bg: "#F3F4F6", color: "#374151" };
const fbDurum   = (d: string) => DURUM_FB_CONFIG[d]   || { label: d, bg: "#F3F4F6", color: "#374151" };

function DurumBadge({ config }: { config: { label: string; bg: string; color: string } }) {
  return (
    <span style={{ background: config.bg, color: config.color, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>
      {config.label}
    </span>
  );
}

type Tab = "gonulluler" | "burslar" | "feedbackler";

interface Stats {
  toplamGonullu: number; toplamBurs: number; bekleyenBurs: number;
  onaylananBurs: number; toplamFeedback: number; buAyFeedback: number;
}

type Gonullu = {
  id: string; adSoyad: string; telefon: string; email?: string; ogrenim: string;
  ogrenimTuru?: string; okul?: string; bolum?: string; il?: string; createdAt: string;
  _count: { bursBasvurulari: number; geriBildirimler: number };
};
type Burs = {
  id: string; adSoyad: string; telefon: string; email?: string; universite: string;
  fakulteBolum: string; sinif: string; il: string; madiDurum: string; aciklama: string;
  durum: string; yoneticiNotu?: string; createdAt: string;
  volunteer: { adSoyad: string; telefon: string };
};
type Feedback = {
  id: string; konu: string; mesaj: string; durum: string; createdAt: string;
  volunteer: { adSoyad: string; telefon: string };
};

const GONULLU_COLUMNS: DataTableColumn<Gonullu>[] = [
  {
    key: "adSoyad", header: "Ad Soyad", mobile: true,
    render: g => <span className="font-semibold text-heading">{g.adSoyad}</span>,
  },
  { key: "telefon", header: "Telefon", mobile: true },
  { key: "email", header: "E-posta", render: g => g.email || "—" },
  {
    key: "ogrenim", header: "Öğrenim",
    render: g => OGRENIM_LABEL[g.ogrenim] || g.ogrenim,
    sortValue: g => OGRENIM_LABEL[g.ogrenim] || g.ogrenim,
  },
  { key: "okul", header: "Okul", render: g => g.okul || "—" },
  { key: "bolum", header: "Bölüm", render: g => g.bolum || "—" },
  { key: "il", header: "İl", mobile: true, render: g => g.il || "—" },
  {
    key: "createdAt", header: "Kayıt Tarihi",
    sortValue: g => new Date(g.createdAt),
    render: g => new Date(g.createdAt).toLocaleDateString("tr-TR"),
  },
  {
    key: "basvuru", header: "Başv.",
    sortValue: g => g._count.bursBasvurulari + g._count.geriBildirimler,
    render: g => (
      <span style={{ background: BRAND.green + "18", color: BRAND.green, fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", whiteSpace: "nowrap" }}>
        {g._count.bursBasvurulari}B / {g._count.geriBildirimler}G
      </span>
    ),
  },
];

const BURS_COLUMNS: DataTableColumn<Burs>[] = [
  {
    key: "adSoyad", header: "Ad Soyad", mobile: true,
    render: b => <span className="font-semibold text-heading">{b.adSoyad}</span>,
  },
  { key: "universite", header: "Üniversite", mobile: true },
  { key: "sinif", header: "Sınıf" },
  { key: "il", header: "İl" },
  {
    key: "durum", header: "Durum", mobile: true,
    sortValue: b => bursDurum(b.durum).label,
    render: b => <DurumBadge config={bursDurum(b.durum)} />,
  },
  {
    key: "createdAt", header: "Tarih",
    sortValue: b => new Date(b.createdAt),
    render: b => new Date(b.createdAt).toLocaleDateString("tr-TR"),
  },
];

const FB_COLUMNS: DataTableColumn<Feedback>[] = [
  {
    key: "gonullu", header: "Gönüllü", mobile: true,
    sortValue: f => f.volunteer.adSoyad,
    render: f => <span className="font-semibold text-heading">{f.volunteer.adSoyad}</span>,
  },
  {
    key: "telefon", header: "Telefon",
    sortValue: f => f.volunteer.telefon,
    render: f => f.volunteer.telefon,
  },
  {
    key: "konu", header: "Konu", mobile: true,
    sortValue: f => KONU_LABEL[f.konu] || f.konu,
    render: f => (
      <span style={{ background: BRAND.green + "18", color: BRAND.green, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>
        {KONU_LABEL[f.konu] || f.konu}
      </span>
    ),
  },
  {
    key: "mesaj", header: "Mesaj", sortable: false, mobile: true,
    render: f => (
      <span
        title={f.mesaj}
        style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", maxWidth: "420px" }}
      >
        {f.mesaj}
      </span>
    ),
  },
  {
    key: "durum", header: "Durum", mobile: true,
    sortValue: f => fbDurum(f.durum).label,
    render: f => <DurumBadge config={fbDurum(f.durum)} />,
  },
  {
    key: "createdAt", header: "Tarih",
    sortValue: f => new Date(f.createdAt),
    render: f => new Date(f.createdAt).toLocaleDateString("tr-TR"),
  },
];

export default function AdminGonullulerClient({
  initialGonulluler, initialBurslar, initialFeedbackler, stats,
}: {
  initialGonulluler: Gonullu[];
  initialBurslar: Burs[];
  initialFeedbackler: Feedback[];
  stats: Stats;
}) {
  const [tab,       setTab]       = useState<Tab>("gonulluler");
  const [burslar,   setBurslar]   = useState(initialBurslar);
  const [feedbacks, setFeedbacks] = useState(initialFeedbackler);
  const [selectedBurs, setSelectedBurs] = useState<Burs | null>(null);

  async function updateBursDurum(id: string, durum: string, yoneticiNotu?: string) {
    const res = await fetch("/api/admin/burs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, durum, yoneticiNotu }),
    });
    if (res.ok) {
      setBurslar(prev => prev.map(b => b.id === id ? { ...b, durum, yoneticiNotu: yoneticiNotu ?? b.yoneticiNotu } : b));
      setSelectedBurs(prev => prev && prev.id === id ? { ...prev, durum, yoneticiNotu: yoneticiNotu ?? prev.yoneticiNotu } : prev);
    }
  }

  async function updateFbDurum(id: string, durum: string) {
    const res = await fetch("/api/admin/geri-bildirim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, durum }),
    });
    if (res.ok) setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, durum } : f));
  }

  const statCards = [
    { label: "Toplam Gönüllü",       val: stats.toplamGonullu,  renk: BRAND.green },
    { label: "Toplam Burs Başvurusu", val: stats.toplamBurs,     renk: "#7C3AED"   },
    { label: "Bekleyen Başvuru",      val: stats.bekleyenBurs,   renk: "#D97706"   },
    { label: "Onaylanan Başvuru",     val: stats.onaylananBurs,  renk: "#059669"   },
    { label: "Toplam Geri Bildirim",  val: stats.toplamFeedback, renk: "#1D4ED8"   },
    { label: "Bu Ay Geri Bildirim",   val: stats.buAyFeedback,   renk: "#7C3AED"   },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Yönetim</p>
        <h1 style={{ color: "#0F172A", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.025em" }}>Gönüllü Yönetimi</h1>
      </div>

      {/* İstatistik kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "1rem", padding: "18px 20px" }}>
            <p style={{ color: s.renk, fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.val}</p>
            <p style={{ color: "#64748B", fontSize: "12.5px", marginTop: "6px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#F1F5F9", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {([
          { key: "gonulluler", label: `Gönüllüler (${stats.toplamGonullu})` },
          { key: "burslar",    label: `Burs Başvuruları (${stats.toplamBurs})` },
          { key: "feedbackler",label: `Geri Bildirimler (${stats.toplamFeedback})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "8px 16px", borderRadius: "9px", fontWeight: 600, fontSize: "13px", border: "none", cursor: "pointer", background: tab === t.key ? "#FFFFFF" : "transparent", color: tab === t.key ? "#0F172A" : "#64748B", boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Gönüllüler Tab ── */}
      {tab === "gonulluler" && (
        <DataTable
          id="admin-gonulluler"
          data={initialGonulluler}
          columns={GONULLU_COLUMNS}
          rowKey={g => g.id}
          searchText={g => [g.adSoyad, g.telefon, g.email, g.okul, g.il].filter(Boolean).join(" ")}
          searchPlaceholder="Ad, telefon, e-posta, okul veya il ara..."
          emptyText="Kayıtlı gönüllü yok."
        />
      )}

      {/* ── Burs Başvuruları Tab ── */}
      {tab === "burslar" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedBurs ? "1fr 400px" : "1fr", gap: "16px", alignItems: "start" }}>
          <DataTable
            id="admin-gonulluler-burs"
            data={burslar}
            columns={BURS_COLUMNS}
            rowKey={b => b.id}
            searchText={b => [b.adSoyad, b.telefon, b.universite, b.fakulteBolum, b.il, bursDurum(b.durum).label].filter(Boolean).join(" ")}
            searchPlaceholder="Başvuru ara (ad, üniversite, il...)"
            emptyText="Başvuru yok."
            onRowClick={b => setSelectedBurs(b)}
          />

          {/* Detay paneli */}
          {selectedBurs && (
            <BursDetayPanel
              b={selectedBurs}
              onClose={() => setSelectedBurs(null)}
              onUpdate={updateBursDurum}
            />
          )}
        </div>
      )}

      {/* ── Geri Bildirimler Tab ── */}
      {tab === "feedbackler" && (
        <DataTable
          id="admin-gonulluler-gb"
          data={feedbacks}
          columns={FB_COLUMNS}
          rowKey={f => f.id}
          searchText={f => [f.volunteer.adSoyad, f.volunteer.telefon, f.mesaj, KONU_LABEL[f.konu] || f.konu, fbDurum(f.durum).label].join(" ")}
          searchPlaceholder="Geri bildirim ara (gönüllü, mesaj...)"
          emptyText="Geri bildirim yok."
          rowActions={f => (
            <select
              value={f.durum}
              onChange={e => updateFbDurum(f.id, e.target.value)}
              aria-label="Geri bildirim durumu"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
            >
              <option value="YENI">Yeni</option>
              <option value="INCELENIYOR">İnceleniyor</option>
              <option value="COZULDU">Çözüldü</option>
              <option value="KAPATILDI">Kapatıldı</option>
            </select>
          )}
        />
      )}
    </div>
  );
}

function BursDetayPanel({
  b, onClose, onUpdate
}: {
  b: Burs;
  onClose: () => void;
  onUpdate: (id: string, durum: string, not?: string) => void;
}) {
  const [durum, setDurum]   = useState(b.durum);
  const [not,   setNot]     = useState(b.yoneticiNotu || "");
  const [saving, setSaving] = useState(false);

  const d = bursDurum(durum);

  async function save() {
    setSaving(true);
    await onUpdate(b.id, durum, not);
    setSaving(false);
  }

  return (
    <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "1rem", padding: "22px", alignSelf: "start" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px" }}>
        <h3 style={{ color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>Başvuru Detayı</h3>
        <button onClick={onClose} style={{ color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>×</button>
      </div>

      {[
        { l: "Ad Soyad",       v: b.adSoyad },
        { l: "Telefon",        v: b.telefon },
        { l: "E-posta",        v: b.email || "—" },
        { l: "Üniversite",     v: b.universite },
        { l: "Fakülte/Bölüm",  v: b.fakulteBolum },
        { l: "Sınıf",          v: b.sinif },
        { l: "İl",             v: b.il },
      ].map(row => (
        <div key={row.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "#64748B", fontSize: "12.5px" }}>{row.l}</span>
          <span style={{ color: "#0F172A", fontSize: "13px", fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{row.v}</span>
        </div>
      ))}

      <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px", marginTop: "12px" }}>
        <p style={{ color: "#64748B", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Maddi Durum</p>
        <p style={{ color: "#475569", fontSize: "13.5px" }}>{b.madiDurum}</p>
      </div>
      <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px" }}>
        <p style={{ color: "#64748B", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Başvuru Açıklaması</p>
        <p style={{ color: "#475569", fontSize: "13.5px" }}>{b.aciklama}</p>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ color: "#64748B", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Durum</label>
        <select value={durum} onChange={e => setDurum(e.target.value)}
          style={{ background: d.bg, color: d.color, border: `1px solid ${d.color}40`, borderRadius: "8px", padding: "8px 12px", width: "100%", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
          <option value="BEKLEMEDE">Beklemede</option>
          <option value="INCELENIYOR">İnceleniyor</option>
          <option value="ONAYLANDI">Onaylandı</option>
          <option value="REDDEDILDI">Reddedildi</option>
        </select>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={{ color: "#64748B", fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Yönetici Notu</label>
        <textarea rows={3} value={not} onChange={e => setNot(e.target.value)}
          placeholder="Opsiyonel not..."
          style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", width: "100%", fontSize: "13px", resize: "none", outline: "none" }} />
      </div>

      <button onClick={save} disabled={saving}
        style={{ background: BRAND.green, color: BRAND.gold, width: "100%", padding: "10px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: saving ? "wait" : "pointer", border: "none" }}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </div>
  );
}
