"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useColors() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const dark = m && resolvedTheme === "dark";
  return {
    bg:   dark ? "#081C15" : "#F6F8F5",
    card: dark ? "#142C22" : "#FFFFFF",
    br:   dark ? "#1F3D31" : "#E2E8F0",
    h:    dark ? "#F8FAFC" : "#0F172A",
    b:    dark ? "#CBD5E1" : "#475569",
    mu:   dark ? "#94A3B8" : "#64748B",
    su:   dark ? "#0F241C" : "#F8FAFC",
  };
}

type GBDurum = "YENI" | "INCELENIYOR" | "COZULDU" | "KAPATILDI";
type GBFilterType = "HEPSI" | GBDurum;
type GBKonu = "ONERI" | "TALEP" | "TEKNIK_SORUN" | "DIGER";

interface GeriBildirim {
  id: string;
  konu: GBKonu;
  mesaj: string;
  durum: GBDurum;
  createdAt: string;
  volunteer: { adSoyad: string; telefon: string };
}

const DURUM_CONFIG: Record<GBDurum, { label: string; color: string; bg: string; darkColor: string; darkBg: string }> = {
  YENI:        { label: "Yeni",        color: "#064E3B", bg: "#D1FAE5", darkColor: "#6EE7B7", darkBg: "#064E3B40" },
  INCELENIYOR: { label: "İnceleniyor", color: "#1E3A8A", bg: "#DBEAFE", darkColor: "#93C5FD", darkBg: "#1E3A8A40" },
  COZULDU:     { label: "Çözüldü",     color: "#581C87", bg: "#F3E8FF", darkColor: "#D8B4FE", darkBg: "#581C8740" },
  KAPATILDI:   { label: "Kapatıldı",   color: "#374151", bg: "#F3F4F6", darkColor: "#9CA3AF", darkBg: "#37415140" },
};

const KONU_LABEL: Record<GBKonu, string> = {
  ONERI:       "Öneri",
  TALEP:       "Talep",
  TEKNIK_SORUN: "Teknik Sorun",
  DIGER:       "Diğer",
};

const KONU_COLOR: Record<GBKonu, string> = {
  ONERI:        "#0B6B3A",
  TALEP:        "#1D4ED8",
  TEKNIK_SORUN: "#DC2626",
  DIGER:        "#7C3AED",
};

const FILTER_TABS: { key: GBFilterType; label: string }[] = [
  { key: "HEPSI",       label: "Hepsi" },
  { key: "YENI",        label: "Yeni" },
  { key: "INCELENIYOR", label: "İnceleniyor" },
  { key: "COZULDU",     label: "Çözüldü" },
  { key: "KAPATILDI",   label: "Kapatıldı" },
];

function DurumBadge({ durum, dark }: { durum: GBDurum; dark: boolean }) {
  const cfg = DURUM_CONFIG[durum];
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: "9999px",
      color: dark ? cfg.darkColor : cfg.color,
      background: dark ? cfg.darkBg : cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function KonuBadge({ konu }: { konu: GBKonu }) {
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: "6px",
      color: KONU_COLOR[konu],
      background: KONU_COLOR[konu] + "15",
      letterSpacing: "0.03em",
    }}>
      {KONU_LABEL[konu]}
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

export default function BildirimlerPage() {
  const c = useColors();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const [bildirimler, setBildirimler] = useState<GeriBildirim[]>([]);
  const [selected, setSelected] = useState<GeriBildirim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GBFilterType>("HEPSI");
  const [updating, setUpdating] = useState(false);
  const [durumInput, setDurumInput] = useState<GBDurum>("YENI");

  async function fetchBildirimler() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/geri-bildirim");
      if (!res.ok) throw new Error("Veriler alınamadı");
      const data: GeriBildirim[] = await res.json();
      setBildirimler(data);
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

  useEffect(() => { fetchBildirimler(); }, []);

  function handleSelect(b: GeriBildirim) {
    setSelected(b);
    setDurumInput(b.durum);
  }

  async function handleDurumUpdate() {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/geri-bildirim", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, durum: durumInput }),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      await fetchBildirimler();
    } catch {
      // silent fail
    } finally {
      setUpdating(false);
    }
  }

  const filtered = filter === "HEPSI" ? bildirimler : bildirimler.filter(b => b.durum === filter);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 64px)", background: c.bg }}>
      {/* Page title bar */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${c.br}`, background: c.card }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: c.h }}>Geri Bildirimler</h1>
        <p style={{ fontSize: "13px", color: c.mu, marginTop: "2px" }}>Gönüllülerden gelen bildirimler</p>
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
            <span style={{ color: c.h, fontWeight: 700, fontSize: "14px" }}>Bildirimler</span>
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

          {/* List */}
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
                <p style={{ color: c.mu, fontSize: "13px" }}>Bildirim bulunamadı.</p>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                  <KonuBadge konu={b.konu} />
                  <DurumBadge durum={b.durum} dark={dark} />
                </div>
                <p style={{ color: c.h, fontWeight: 600, fontSize: "13px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.volunteer.adSoyad}
                </p>
                <p style={{ color: c.mu, fontSize: "11px" }}>{formatDate(b.createdAt)}</p>
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
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p style={{ color: c.mu, fontSize: "14px", fontWeight: 500 }}>Bir bildirim seçin</p>
              <p style={{ color: c.mu, fontSize: "12px" }}>Detayları görüntülemek için listeden bir bildirim seçin</p>
            </div>
          ) : (
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "10px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ marginBottom: "6px" }}>
                    <KonuBadge konu={selected.konu} />
                  </div>
                  <h2 style={{ color: c.h, fontWeight: 800, fontSize: "1.15rem", marginBottom: "4px" }}>
                    {selected.volunteer.adSoyad}
                  </h2>
                  <p style={{ color: c.mu, fontSize: "12px" }}>
                    {selected.volunteer.telefon} &nbsp;·&nbsp; {formatDate(selected.createdAt)}
                  </p>
                </div>
                <DurumBadge durum={selected.durum} dark={dark} />
              </div>

              {/* Message card */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px", marginBottom: "16px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mesaj</h3>
                <p style={{ color: c.b, fontSize: "14px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selected.mesaj}</p>
              </div>

              {/* Durum güncelle */}
              <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", padding: "20px" }}>
                <h3 style={{ color: c.h, fontWeight: 700, fontSize: "13px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Durum Güncelle</h3>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <select
                    value={durumInput}
                    onChange={e => setDurumInput(e.target.value as GBDurum)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="YENI">Yeni</option>
                    <option value="INCELENIYOR">İnceleniyor</option>
                    <option value="COZULDU">Çözüldü</option>
                    <option value="KAPATILDI">Kapatıldı</option>
                  </select>
                  <button
                    onClick={handleDurumUpdate}
                    disabled={updating}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: BRAND.green,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "13px",
                      border: "none",
                      cursor: updating ? "not-allowed" : "pointer",
                      opacity: updating ? 0.7 : 1,
                    }}
                  >
                    Güncelle
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
