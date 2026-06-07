"use client";
import { useState } from "react";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

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

type Tab = "gonulluler" | "burslar" | "feedbackler";

interface Stats {
  toplamGonullu: number; toplamBurs: number; bekleyenBurs: number;
  onaylananBurs: number; toplamFeedback: number; buAyFeedback: number;
}

export default function AdminGonullulerClient({
  initialGonulluler, initialBurslar, initialFeedbackler, stats,
}: {
  initialGonulluler: {id:string;adSoyad:string;telefon:string;email?:string;ogrenim:string;ogrenimTuru?:string;okul?:string;bolum?:string;il?:string;createdAt:string;_count:{bursBasvurulari:number;geriBildirimler:number}}[];
  initialBurslar:    {id:string;adSoyad:string;telefon:string;email?:string;universite:string;fakulteBolum:string;sinif:string;il:string;madiDurum:string;aciklama:string;durum:string;yoneticiNotu?:string;createdAt:string;volunteer:{adSoyad:string;telefon:string}}[];
  initialFeedbackler:{id:string;konu:string;mesaj:string;durum:string;createdAt:string;volunteer:{adSoyad:string;telefon:string}}[];
  stats: Stats;
}) {
  const [tab,        setTab]        = useState<Tab>("gonulluler");
  const [burslar,    setBurslar]    = useState(initialBurslar);
  const [feedbacks,  setFeedbacks]  = useState(initialFeedbackler);
  const [ilFiltre,   setIlFiltre]   = useState("");
  const [okulFiltre, setOkulFiltre] = useState("");
  const [selectedBurs, setSelectedBurs] = useState<typeof initialBurslar[0] | null>(null);

  const gonulluler = initialGonulluler.filter(g =>
    (!ilFiltre   || (g.il   || "").toLowerCase().includes(ilFiltre.toLowerCase())) &&
    (!okulFiltre || (g.okul || "").toLowerCase().includes(okulFiltre.toLowerCase()))
  );

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
        <div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <input placeholder="İl filtrele..." style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "0.75rem", padding: "8px 14px", fontSize: "13.5px", outline: "none", width: 180 }}
              value={ilFiltre} onChange={e => setIlFiltre(e.target.value)} />
            <input placeholder="Okul filtrele..." style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "0.75rem", padding: "8px 14px", fontSize: "13.5px", outline: "none", width: 200 }}
              value={okulFiltre} onChange={e => setOkulFiltre(e.target.value)} />
          </div>
          <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "1rem", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Ad Soyad","Telefon","E-posta","Öğrenim","Okul","İl","Kayıt Tarihi","Başv."].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gonulluler.map((g, i) => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 1 ? "#FAFAFA" : "#FFF" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0F172A" }}>{g.adSoyad}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{g.telefon}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{g.email || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{OGRENIM_LABEL[g.ogrenim] || g.ogrenim}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{g.okul || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{g.il || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#64748B" }}>{new Date(g.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: BRAND.green + "18", color: BRAND.green, fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px" }}>
                        {g._count.bursBasvurulari}B / {g._count.geriBildirimler}G
                      </span>
                    </td>
                  </tr>
                ))}
                {gonulluler.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>Kayıtlı gönüllü yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Burs Başvuruları Tab ── */}
      {tab === "burslar" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedBurs ? "1fr 400px" : "1fr", gap: "16px" }}>
          <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "1rem", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Ad Soyad","Üniversite","Sınıf","İl","Durum","Tarih"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontWeight: 600, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {burslar.map((b, i) => {
                  const d = DURUM_BURS_CONFIG[b.durum] || { label: b.durum, bg: "#F3F4F6", color: "#374151" };
                  return (
                    <tr key={b.id}
                      onClick={() => setSelectedBurs(b)}
                      style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", background: selectedBurs?.id === b.id ? BRAND.green + "0A" : i % 2 === 1 ? "#FAFAFA" : "#FFF" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0F172A" }}>{b.adSoyad}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{b.universite}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{b.sinif}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{b.il}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: d.bg, color: d.color, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>{d.label}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>{new Date(b.createdAt).toLocaleDateString("tr-TR")}</td>
                    </tr>
                  );
                })}
                {burslar.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>Başvuru yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>

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
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {feedbacks.map(f => {
            const d = DURUM_FB_CONFIG[f.durum] || { label: f.durum, bg: "#F3F4F6", color: "#374151" };
            return (
              <div key={f.id} style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "1rem", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>{f.volunteer.adSoyad}</span>
                    <span style={{ color: "#64748B", fontSize: "13px" }}>{f.volunteer.telefon}</span>
                    <span style={{ background: BRAND.green + "18", color: BRAND.green, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>
                      {KONU_LABEL[f.konu] || f.konu}
                    </span>
                    <span style={{ background: d.bg, color: d.color, fontSize: "12px", fontWeight: 700, padding: "2px 10px", borderRadius: "99px" }}>{d.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#94A3B8", fontSize: "12px" }}>{new Date(f.createdAt).toLocaleDateString("tr-TR")}</span>
                    <select
                      value={f.durum}
                      onChange={e => updateFbDurum(f.id, e.target.value)}
                      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
                    >
                      <option value="YENI">Yeni</option>
                      <option value="INCELENIYOR">İnceleniyor</option>
                      <option value="COZULDU">Çözüldü</option>
                      <option value="KAPATILDI">Kapatıldı</option>
                    </select>
                  </div>
                </div>
                <p style={{ color: "#475569", fontSize: "13.5px" }}>{f.mesaj}</p>
              </div>
            );
          })}
          {feedbacks.length === 0 && (
            <div style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: "1rem", padding: "48px", textAlign: "center" }}>
              <p style={{ color: "#94A3B8" }}>Geri bildirim yok.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BursDetayPanel({
  b, onClose, onUpdate
}: {
  b: { id:string;adSoyad:string;telefon:string;email?:string;universite:string;fakulteBolum:string;sinif:string;il:string;madiDurum:string;aciklama:string;durum:string;yoneticiNotu?:string;createdAt:string };
  onClose: () => void;
  onUpdate: (id: string, durum: string, not?: string) => void;
}) {
  const [durum, setDurum]   = useState(b.durum);
  const [not,   setNot]     = useState(b.yoneticiNotu || "");
  const [saving, setSaving] = useState(false);

  const d = DURUM_BURS_CONFIG[durum] || { label: durum, bg: "#F3F4F6", color: "#374151" };

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
