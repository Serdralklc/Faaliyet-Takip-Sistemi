"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BRAND, useColors } from "@/lib/theme";

type Durum = "BEKLEMEDE" | "INCELENIYOR" | "ONAYLANDI" | "REDDEDILDI";
type FilterType = "HEPSI" | Durum;

interface BursBasvuru {
  id: string;
  adSoyad: string;
  telefon: string;
  email: string;
  universite: string;
  fakulteBolum: string;
  sinif: string;
  il: string;
  madiDurum: string;
  aciklama: string;
  durum: Durum;
  yoneticiNotu: string | null;
  createdAt: string;
  volunteer: { adSoyad: string; telefon: string };
}

const DURUM_CONFIG: Record<Durum, { label: string; color: string; bg: string }> = {
  BEKLEMEDE:    { label: "Beklemede",   color: "#92400E", bg: "#FEF3C7" },
  INCELENIYOR:  { label: "İnceleniyor", color: "#1E3A8A", bg: "#DBEAFE" },
  ONAYLANDI:    { label: "Onaylandı",   color: "#064E3B", bg: "#D1FAE5" },
  REDDEDILDI:   { label: "Reddedildi",  color: "#7F1D1D", bg: "#FEE2E2" },
};

const DURUM_DARK: Record<Durum, { color: string; bg: string }> = {
  BEKLEMEDE:    { color: "#FCD34D", bg: "#78350F40" },
  INCELENIYOR:  { color: "#93C5FD", bg: "#1E3A8A40" },
  ONAYLANDI:    { color: "#6EE7B7", bg: "#064E3B40" },
  REDDEDILDI:   { color: "#FCA5A5", bg: "#7F1D1D40" },
};

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: "HEPSI",       label: "Hepsi" },
  { key: "BEKLEMEDE",   label: "Beklemede" },
  { key: "INCELENIYOR", label: "İnceleniyor" },
  { key: "ONAYLANDI",   label: "Onaylandı" },
  { key: "REDDEDILDI",  label: "Reddedildi" },
];

function DurumBadge({ durum, dark }: { durum: Durum; dark: boolean }) {
  const cfg = DURUM_CONFIG[durum];
  const darkCfg = DURUM_DARK[durum];
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: "9999px",
      color: dark ? darkCfg.color : cfg.color,
      background: dark ? darkCfg.bg : cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function BursPaneliPage() {
  const c = useColors();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const [basvurular, setBasvurular] = useState<BursBasvuru[]>([]);
  const [selected, setSelected] = useState<BursBasvuru | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("HEPSI");
  const [updating, setUpdating] = useState(false);
  const [notInput, setNotInput] = useState("");
  const [durumInput, setDurumInput] = useState<Durum>("BEKLEMEDE");

  async function fetchBasvurular() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/burs");
      if (!res.ok) throw new Error("Veriler alınamadı");
      const data: BursBasvuru[] = await res.json();
      setBasvurular(data);
      if (selected) {
        const updated = data.find(b => b.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBasvurular(); }, []);

  function handleSelect(b: BursBasvuru) {
    setSelected(b);
    setNotInput(b.yoneticiNotu ?? "");
    setDurumInput(b.durum);
  }

  async function handleUpdate(field: "durum" | "not") {
    if (!selected) return;
    setUpdating(true);
    try {
      const body: { id: string; durum?: string; yoneticiNotu?: string } = { id: selected.id };
      if (field === "durum") body.durum = durumInput;
      if (field === "not") body.yoneticiNotu = notInput;
      const res = await fetch("/api/admin/burs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      await fetchBasvurular();
    } catch {
      // silent fail — could show toast here
    } finally {
      setUpdating(false);
    }
  }

  const filtered = filter === "HEPSI" ? basvurular : basvurular.filter(b => b.durum === filter);

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1px solid ${c.br}`,
    background: c.su,
    color: c.h,
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const btnStyle = (color: string) => ({
    padding: "8px 18px",
    borderRadius: "8px",
    background: color,
    color: "#fff",
    fontWeight: 600,
    fontSize: "13px",
    border: "none",
    cursor: updating ? "not-allowed" : "pointer",
    opacity: updating ? 0.7 : 1,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 64px)", background: c.bg }}>
      {/* Page title bar */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${c.br}`, background: c.card }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: c.h }}>Burs Başvuruları</h1>
        <p style={{ fontSize: "13px", color: c.mu, marginTop: "2px" }}>Başvuruları inceleyin ve durum güncelleyin</p>
      </div>

      {/* Main two-panel layout */}
      <div className="flex flex-col lg:flex-row" style={{ flex: 1, overflow: "hidden" }}>

        {/* LEFT PANEL */}
        <div style={{
          width: "100%",
          maxWidth: "380px",
          borderRight: `1px solid ${c.br}`,
          display: "flex",
          flexDirection: "column",
          background: c.card,
          flexShrink: 0,
        }} className="lg:max-w-[380px]">
          {/* List header */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${c.br}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: c.h, fontWeight: 700, fontSize: "14px" }}>Başvurular</span>
            <span style={{
              background: BRAND.green + "20",
              color: BRAND.green,
              fontWeight: 700,
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "9999px",
            }}>{filtered.length}</span>
          </div>

          {/* Filter pills */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${c.br}`, overflowX: "auto", display: "flex", gap: "6px" }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  background: filter === tab.key ? BRAND.green : c.su,
                  color: filter === tab.key ? "#fff" : c.b,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Application list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <p style={{ color: c.mu, fontSize: "13px" }}>Yükleniyor...</p>
              </div>
            )}
            {error && (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <p style={{ color: "#EF4444", fontSize: "13px" }}>{error}</p>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <p style={{ color: c.mu, fontSize: "13px" }}>Başvuru bulunamadı.</p>
              </div>
            )}
            {filtered.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelect(b)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: selected?.id === b.id ? (dark ? "#1A3828" : "#F0FDF4") : "transparent",
                  borderLeft: selected?.id === b.id ? `3px solid ${BRAND.green}` : "3px solid transparent",
                  border: "none",
                  borderBottom: `1px solid ${c.br}`,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: c.h, fontWeight: 600, fontSize: "13.5px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.adSoyad}
                    </p>
                    <p style={{ color: c.mu, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.universite}
                    </p>
                    <p style={{ color: c.mu, fontSize: "11px", marginTop: "4px" }}>{formatDate(b.createdAt)}</p>
                  </div>
                  <DurumBadge durum={b.durum} dark={dark} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, overflowY: "auto", background: c.bg, padding: "24px" }}>
          {!selected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px", gap: "12px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "14px", background: BRAND.green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p style={{ color: c.mu, fontSize: "14px", fontWeight: 500 }}>Bir başvuru seçin</p>
              <p style={{ color: c.mu, fontSize: "12px" }}>Detayları görüntülemek için listeden bir başvuru seçin</p>
            </div>
          ) : (
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ color: c.h, fontWeight: 800, fontSize: "1.2rem", marginBottom: "4px" }}>{selected.adSoyad}</h2>
                  <p style={{ color: c.mu, fontSize: "12px" }}>{formatDate(selected.createdAt)}</p>
                </div>
                <DurumBadge durum={selected.durum} dark={dark} />
              </div>

              {/* Info card */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px", marginBottom: "16px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Kişisel Bilgiler</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  {[
                    { l: "Ad Soyad",      v: selected.adSoyad },
                    { l: "Telefon",       v: selected.telefon },
                    { l: "E-posta",       v: selected.email || "—" },
                    { l: "Üniversite",    v: selected.universite },
                    { l: "Fakülte/Bölüm", v: selected.fakulteBolum },
                    { l: "Sınıf",         v: selected.sinif },
                    { l: "İl",            v: selected.il },
                  ].map(row => (
                    <div key={row.l}>
                      <p style={{ color: c.mu, fontSize: "11px", fontWeight: 600, marginBottom: "2px" }}>{row.l}</p>
                      <p style={{ color: c.h, fontSize: "13px" }}>{row.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mali Durum */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px", marginBottom: "16px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mali Durum</h3>
                <p style={{ color: c.b, fontSize: "13.5px", lineHeight: 1.6 }}>{selected.madiDurum || "—"}</p>
              </div>

              {/* Açıklama */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px", marginBottom: "16px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Açıklama</h3>
                <p style={{ color: c.b, fontSize: "13.5px", lineHeight: 1.6 }}>{selected.aciklama || "—"}</p>
              </div>

              {/* Durum güncelle */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px", marginBottom: "16px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Durum Güncelle</h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <select
                    value={durumInput}
                    onChange={e => setDurumInput(e.target.value as Durum)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="BEKLEMEDE">Beklemede</option>
                    <option value="INCELENIYOR">İnceleniyor</option>
                    <option value="ONAYLANDI">Onaylandı</option>
                    <option value="REDDEDILDI">Reddedildi</option>
                  </select>
                  <button
                    onClick={() => handleUpdate("durum")}
                    disabled={updating}
                    style={btnStyle(BRAND.green)}
                  >
                    Güncelle
                  </button>
                </div>
              </div>

              {/* Yönetici notu */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Yönetici Notu</h3>
                <textarea
                  value={notInput}
                  onChange={e => setNotInput(e.target.value)}
                  rows={4}
                  placeholder="Başvuru hakkında not ekleyin..."
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    onClick={() => handleUpdate("not")}
                    disabled={updating}
                    style={btnStyle(BRAND.green)}
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
