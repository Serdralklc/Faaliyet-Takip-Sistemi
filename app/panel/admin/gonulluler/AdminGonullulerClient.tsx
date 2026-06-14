"use client";
import { useState } from "react";
import { BRAND } from "@/lib/theme";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

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
const SERGENC_ROL_LABEL: Record<string, string> = { UNIVERSITE: "Üniversite", LISE: "Lise" };

const fbDurum = (d: string) => DURUM_FB_CONFIG[d] || { label: d, bg: "#F3F4F6", color: "#374151" };

function DurumBadge({ config }: { config: { label: string; bg: string; color: string } }) {
  return (
    <span style={{ background: config.bg, color: config.color, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>
      {config.label}
    </span>
  );
}

type Tab = "uyeler" | "feedbackler";

interface Stats {
  toplamGonullu: number; toplamFeedback: number; buAyFeedback: number;
}

type Gonullu = {
  id: string; adSoyad: string; telefon: string; email?: string; ogrenim: string;
  ogrenimTuru?: string; okul?: string; bolum?: string; il?: string; createdAt: string;
  serGencRol?: string | null; barinma?: boolean;
  _count: { bursBasvurulari: number; geriBildirimler: number };
};
type Feedback = {
  id: string; konu: string; mesaj: string; durum: string; createdAt: string;
  volunteer: { adSoyad: string; telefon: string };
};

const FB_COLUMNS: DataTableColumn<Feedback>[] = [
  {
    key: "gonullu", header: "Üye", mobile: true,
    sortValue: f => f.volunteer.adSoyad,
    render: f => <span className="font-semibold text-heading">{f.volunteer.adSoyad}</span>,
  },
  { key: "telefon", header: "Telefon", sortValue: f => f.volunteer.telefon, render: f => f.volunteer.telefon },
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
      <span title={f.mesaj} style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", maxWidth: "420px" }}>{f.mesaj}</span>
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
  initialGonulluler, initialFeedbackler, stats,
}: {
  initialGonulluler: Gonullu[];
  initialFeedbackler: Feedback[];
  stats: Stats;
}) {
  const [tab, setTab] = useState<Tab>("uyeler");
  const [gonulluler, setGonulluler] = useState(initialGonulluler);
  const [feedbacks, setFeedbacks] = useState(initialFeedbackler);

  async function updateRol(id: string, patch: { serGencRol?: string | null; barinma?: boolean }) {
    const res = await fetch(`/api/admin/gonulluler/${id}/rol`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) setGonulluler(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }

  async function updateFbDurum(id: string, durum: string) {
    const res = await fetch("/api/admin/geri-bildirim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, durum }),
    });
    if (res.ok) setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, durum } : f));
  }

  const GONULLU_COLUMNS: DataTableColumn<Gonullu>[] = [
    { key: "adSoyad", header: "Ad Soyad", mobile: true, render: g => <span className="font-semibold text-heading">{g.adSoyad}</span> },
    { key: "telefon", header: "Telefon", mobile: true },
    { key: "email", header: "E-posta", render: g => g.email || "—" },
    { key: "ogrenim", header: "Öğrenim", render: g => OGRENIM_LABEL[g.ogrenim] || g.ogrenim, sortValue: g => OGRENIM_LABEL[g.ogrenim] || g.ogrenim },
    { key: "okul", header: "Okul", render: g => g.okul || "—" },
    { key: "il", header: "İl", mobile: true, render: g => g.il || "—" },
    {
      key: "rol", header: "SerGenç Rolü", mobile: true, sortable: false,
      render: g => (
        <div className="flex flex-wrap items-center gap-1.5">
          {g.serGencRol && (
            <span style={{ background: g.serGencRol === "UNIVERSITE" ? "#1D4ED815" : "#7C3AED15", color: g.serGencRol === "UNIVERSITE" ? "#1D4ED8" : "#7C3AED", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px" }}>
              {SERGENC_ROL_LABEL[g.serGencRol] ?? g.serGencRol}
            </span>
          )}
          {g.barinma && (
            <span style={{ background: BRAND.green + "18", color: BRAND.green, fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px" }}>Barınma</span>
          )}
          {!g.serGencRol && !g.barinma && <span style={{ color: "#94A3B8", fontSize: "12px" }}>—</span>}
        </div>
      ),
    },
    {
      key: "createdAt", header: "Kayıt",
      sortValue: g => new Date(g.createdAt),
      render: g => <span style={{ fontSize: "12px", color: "#64748B" }}>{new Date(g.createdAt).toLocaleDateString("tr-TR")}</span>,
    },
  ];

  const statCards = [
    { label: "Toplam Üye",            val: stats.toplamGonullu,  renk: BRAND.green },
    { label: "Toplam Geri Bildirim",  val: stats.toplamFeedback, renk: "#1D4ED8"   },
    { label: "Bu Ay Geri Bildirim",   val: stats.buAyFeedback,   renk: "#7C3AED"   },
  ];

  const selCls = "rounded-lg border border-border bg-card text-heading text-xs px-2 py-1 cursor-pointer";

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Yönetim</p>
        <h1 style={{ color: "#0F172A", fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.025em" }}>SerGenç</h1>
        <p style={{ color: "#64748B", fontSize: "13px", marginTop: "4px" }}>Kayıtlı tüm üyeler — ana rol (Üniversite/Lise) ve Barınma yan rolü atayın.</p>
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
          { key: "uyeler", label: `Üyeler (${stats.toplamGonullu})` },
          { key: "feedbackler", label: `Geri Bildirimler (${stats.toplamFeedback})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "8px 16px", borderRadius: "9px", fontWeight: 600, fontSize: "13px", border: "none", cursor: "pointer", background: tab === t.key ? "#FFFFFF" : "transparent", color: tab === t.key ? "#0F172A" : "#64748B", boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Üyeler Tab ── */}
      {tab === "uyeler" && (
        <DataTable
          id="sergenc-uyeler"
          data={gonulluler}
          columns={GONULLU_COLUMNS}
          rowKey={g => g.id}
          searchText={g => [g.adSoyad, g.telefon, g.email, g.okul, g.il].filter(Boolean).join(" ")}
          searchPlaceholder="Ad, telefon, e-posta, okul veya il ara..."
          emptyText="Kayıtlı üye yok."
          rowActions={g => (
            <div className="flex items-center gap-2 justify-end">
              <select value={g.serGencRol ?? ""} onChange={e => updateRol(g.id, { serGencRol: e.target.value || null })} aria-label="Ana rol" className={selCls}>
                <option value="">Ana rol yok</option>
                <option value="UNIVERSITE">Üniversite</option>
                <option value="LISE">Lise</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={!!g.barinma} onChange={e => updateRol(g.id, { barinma: e.target.checked })} />
                Barınma
              </label>
            </div>
          )}
        />
      )}

      {/* ── Geri Bildirimler Tab ── */}
      {tab === "feedbackler" && (
        <DataTable
          id="sergenc-gb"
          data={feedbacks}
          columns={FB_COLUMNS}
          rowKey={f => f.id}
          searchText={f => [f.volunteer.adSoyad, f.volunteer.telefon, f.mesaj, KONU_LABEL[f.konu] || f.konu, fbDurum(f.durum).label].join(" ")}
          searchPlaceholder="Geri bildirim ara (üye, mesaj...)"
          emptyText="Geri bildirim yok."
          rowActions={f => (
            <select value={f.durum} onChange={e => updateFbDurum(f.id, e.target.value)} aria-label="Geri bildirim durumu" className={selCls}>
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
