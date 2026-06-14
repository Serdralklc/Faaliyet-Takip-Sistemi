"use client";

/**
 * Öğr. Evi / Apart / Yurt başvuru yönetim paneli.
 * Admin, bölge eğitimcisi ve il eğitimcisi aynı bileşeni kullanır —
 * görünürlük kapsamı API tarafında role göre daraltılır.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { formatDateTR } from "@/lib/format";
import type { ExportSpec } from "@/lib/export/corporate";

type Durum = "BEKLEMEDE" | "INCELENIYOR" | "GORUSULDU" | "ONAYLANDI" | "REDDEDILDI";

interface Basvuru {
  id: string;
  ogrenciAd: string;
  ogrenciSoyad: string;
  telefon: string;
  geldigiUlke?: string | null;
  geldigiIl?: string | null;
  geldigiIlce?: string | null;
  gidecegiBolge?: string | null;
  gidecegiIl?: string | null;
  gidecegiIlce?: string | null;
  universite: string;
  fakulte: string;
  bolum: string;
  kayitTipi: string;
  veliAdSoyad?: string | null;
  veliTelefon?: string | null;
  referansAdSoyad?: string | null;
  referansTelefon?: string | null;
  referansGorev?: string | null;
  durum: Durum;
  yoneticiNotu?: string | null;
  createdAt: string;
  volunteer?: { adSoyad: string; telefon: string; email?: string | null } | null;
}

const DURUMLAR: { key: Durum; label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }[] = [
  { key: "BEKLEMEDE",   label: "Beklemede",   tone: "neutral" },
  { key: "INCELENIYOR", label: "İnceleniyor", tone: "info" },
  { key: "GORUSULDU",   label: "Görüşüldü",   tone: "warning" },
  { key: "ONAYLANDI",   label: "Onaylandı",   tone: "success" },
  { key: "REDDEDILDI",  label: "Reddedildi",  tone: "danger" },
];

const durumInfo = (d: Durum) => DURUMLAR.find(x => x.key === d) ?? DURUMLAR[0];

/** Filtrelenmiş başvurulardan PDF/Excel/Word dışa aktarma spesifikasyonu üretir (görünen sayfa değil, tüm filtreli küme). */
function ekKayitSpec(rows: Basvuru[], baslik: string): ExportSpec {
  return {
    title: baslik,
    subtitle: `${rows.length} başvuru`,
    columns: [
      { header: "Öğrenci", key: "ogrenci" },
      { header: "Telefon", key: "telefon" },
      { header: "Gideceği Bölge", key: "bolge" },
      { header: "Gideceği İl", key: "il" },
      { header: "Üniversite", key: "universite" },
      { header: "Fakülte / Bölüm", key: "fakulteBolum" },
      { header: "Kayıt Tipi", key: "kayitTipi" },
      { header: "Durum", key: "durum" },
      { header: "Başvuru Tarihi", key: "tarih" },
      { header: "Yönetici Notu", key: "not" },
    ],
    rows: rows.map(b => ({
      ogrenci: `${b.ogrenciAd} ${b.ogrenciSoyad}`,
      telefon: b.telefon,
      bolge: b.gidecegiBolge ?? "",
      il: b.gidecegiIl ?? "",
      universite: b.universite,
      fakulteBolum: `${b.fakulte} / ${b.bolum}`,
      kayitTipi: b.kayitTipi,
      durum: durumInfo(b.durum).label,
      tarih: formatDateTR(b.createdAt),
      not: b.yoneticiNotu ?? "",
    })),
  };
}

const COLUMNS: DataTableColumn<Basvuru>[] = [
  {
    key: "ogrenci", header: "Öğrenci", mobile: true,
    sortValue: b => `${b.ogrenciAd} ${b.ogrenciSoyad}`,
    render: b => (
      <div>
        <div className="font-semibold text-heading text-sm">{b.ogrenciAd} {b.ogrenciSoyad}</div>
        <div className="text-xs text-muted">{b.telefon}</div>
      </div>
    ),
  },
  {
    key: "gidecegi", header: "Gideceği Yer", mobile: true,
    sortValue: b => b.gidecegiIl ?? "",
    render: b => (
      <div>
        <div className="text-sm text-secondary">{b.gidecegiIl ?? "—"}</div>
        {b.gidecegiBolge && <div className="text-xs text-muted">{b.gidecegiBolge}</div>}
      </div>
    ),
  },
  { key: "universite", header: "Üniversite", render: b => <span className="text-sm text-secondary">{b.universite}</span> },
  { key: "kayitTipi", header: "Kayıt Tipi", mobile: true, render: b => <Badge tone="brand">{b.kayitTipi}</Badge> },
  {
    key: "durum", header: "Durum", mobile: true,
    sortValue: b => b.durum,
    render: b => <Badge tone={durumInfo(b.durum).tone}>{durumInfo(b.durum).label}</Badge>,
  },
  {
    key: "createdAt", header: "Başvuru",
    sortValue: b => new Date(b.createdAt).getTime(),
    render: b => <span className="text-xs text-muted">{formatDateTR(b.createdAt)}</span>,
  },
];

function DetayAlan({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-[13.5px] text-heading mt-0.5">{value || "—"}</p>
    </div>
  );
}

export function EkKayitPanel({ baslik = "Ev / Apart / Yurt Başvuruları", canApprove = false }: { baslik?: string; canApprove?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"TUMU" | Durum>("TUMU");
  const [bolgeFilter, setBolgeFilter] = useState<string>("TUMU");
  const [ilFilter, setIlFilter] = useState<string>("TUMU");
  const [secili, setSecili] = useState<Basvuru | null>(null);
  const [durumForm, setDurumForm] = useState<Durum>("BEKLEMEDE");
  const [notForm, setNotForm] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: basvurular = [], isLoading } = useQuery({
    queryKey: ["ek-kayit-basvurulari"],
    queryFn: async (): Promise<Basvuru[]> => {
      const res = await fetch("/api/ek-kayit-basvurulari");
      if (!res.ok) throw new Error("Başvurular yüklenemedi.");
      return res.json();
    },
  });

  const bolgeSecenek = Array.from(new Set(basvurular.map(b => b.gidecegiBolge).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "tr"));
  const ilSecenek = Array.from(
    new Set(
      basvurular
        .filter(b => bolgeFilter === "TUMU" || b.gidecegiBolge === bolgeFilter)
        .map(b => b.gidecegiIl)
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => a.localeCompare(b, "tr"));

  const filtered = basvurular.filter(b =>
    (filter === "TUMU" || b.durum === filter) &&
    (bolgeFilter === "TUMU" || b.gidecegiBolge === bolgeFilter) &&
    (ilFilter === "TUMU" || b.gidecegiIl === ilFilter)
  );

  function openDetay(b: Basvuru) {
    setSecili(b);
    setDurumForm(b.durum);
    setNotForm(b.yoneticiNotu ?? "");
  }

  async function handleSave() {
    if (!secili || !canApprove) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ek-kayit-basvurulari/${secili.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: durumForm, yoneticiNotu: notForm }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast({ type: "error", title: "Güncellenemedi", message: d?.error });
        return;
      }
      toast({ type: "success", title: "Başvuru güncellendi", message: `Durum: ${durumInfo(durumForm).label}` });
      setSecili(null);
      queryClient.invalidateQueries({ queryKey: ["ek-kayit-basvurulari"] });
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="sv-page-header">
        <h1>{baslik}</h1>
        <p>Öğrenci evi, apart ve yurt yerleştirme başvurularını yönetin</p>
      </div>

      {/* Durum sekmeleri */}
      <div className="flex gap-1 p-1 rounded-xl border border-border w-fit max-w-full overflow-x-auto" style={{ background: "var(--bg-th)" }}>
        {([{ key: "TUMU" as const, label: "Tümü" }, ...DURUMLAR]).map(t => {
          const cnt = t.key === "TUMU" ? basvurular.length : basvurular.filter(b => b.durum === t.key).length;
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as typeof filter)}
              className="px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
              style={active ? { background: "var(--accent-solid)", color: "#fff" } : { color: "var(--text-muted)" }}
            >
              {t.label}
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: active ? "rgba(255,255,255,0.2)" : "var(--bg-hover)",
                  color: active ? "#fff" : "var(--text-muted)",
                }}
              >
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bölge / İl filtresi + dışa aktarma */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Bölgeye göre filtrele"
            value={bolgeFilter}
            onChange={e => { setBolgeFilter(e.target.value); setIlFilter("TUMU"); }}
            className="rounded-lg border border-[var(--border-input)] bg-input text-heading text-[13px] px-2.5 py-1.5 focus:border-[var(--accent)] transition"
          >
            <option value="TUMU">Tüm Bölgeler</option>
            {bolgeSecenek.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            aria-label="İle göre filtrele"
            value={ilFilter}
            onChange={e => setIlFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-input)] bg-input text-heading text-[13px] px-2.5 py-1.5 focus:border-[var(--accent)] transition"
          >
            <option value="TUMU">Tüm İller</option>
            {ilSecenek.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <span className="text-xs text-muted">{filtered.length} başvuru</span>
        </div>
        <ExportButtons getSpec={() => ekKayitSpec(filtered, baslik)} />
      </div>

      <DataTable
        id="ek-kayit-basvurulari"
        data={filtered}
        columns={COLUMNS}
        rowKey={b => b.id}
        loading={isLoading}
        searchText={b => `${b.ogrenciAd} ${b.ogrenciSoyad} ${b.telefon} ${b.universite} ${b.gidecegiIl ?? ""} ${b.gidecegiBolge ?? ""}`}
        searchPlaceholder="Öğrenci, üniversite veya il ara..."
        emptyText="Bu kategoride başvuru bulunmuyor."
        onRowClick={openDetay}
        rowActions={b => (
          <Button size="sm" variant="secondary" onClick={() => openDetay(b)}>İncele</Button>
        )}
      />

      {/* Detay + durum güncelleme modalı */}
      <Modal
        open={!!secili}
        onClose={() => setSecili(null)}
        title={secili ? `${secili.ogrenciAd} ${secili.ogrenciSoyad}` : ""}
        maxWidth={560}
        footer={
          canApprove ? (
            <>
              <Button variant="secondary" onClick={() => setSecili(null)} disabled={saving}>Kapat</Button>
              <Button onClick={handleSave} loading={saving}>Kaydet</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setSecili(null)}>Kapat</Button>
          )
        }
      >
        {secili && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetayAlan label="Telefon" value={secili.telefon} />
              <DetayAlan label="Kayıt Tipi" value={secili.kayitTipi} />
              <DetayAlan label="Geldiği Yer" value={[secili.geldigiUlke, secili.geldigiIl, secili.geldigiIlce].filter(Boolean).join(" / ")} />
              <DetayAlan label="Gideceği Yer" value={[secili.gidecegiBolge, secili.gidecegiIl, secili.gidecegiIlce].filter(Boolean).join(" / ")} />
              <DetayAlan label="Üniversite" value={secili.universite} />
              <DetayAlan label="Fakülte / Bölüm" value={`${secili.fakulte} / ${secili.bolum}`} />
              <DetayAlan label="Veli" value={[secili.veliAdSoyad, secili.veliTelefon].filter(Boolean).join(" — ")} />
              <DetayAlan label="Referans" value={[secili.referansAdSoyad, secili.referansTelefon, secili.referansGorev].filter(Boolean).join(" — ")} />
              <DetayAlan label="Başvuran Gönüllü" value={secili.volunteer ? `${secili.volunteer.adSoyad} (${secili.volunteer.telefon})` : "—"} />
              <DetayAlan label="Başvuru Tarihi" value={formatDateTR(secili.createdAt)} />
            </div>

            {canApprove ? (
              <>
                {/* Tek aktif durum — radyo grubu */}
                <fieldset>
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Başvuru Durumu</legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup">
                    {DURUMLAR.map(d => {
                      const active = durumForm === d.key;
                      return (
                        <label
                          key={d.key}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-[13px] font-semibold transition"
                          style={active
                            ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
                            : { borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          <input
                            type="radio"
                            name="durum"
                            value={d.key}
                            checked={active}
                            onChange={() => setDurumForm(d.key)}
                            className="accent-[var(--accent-solid)]"
                          />
                          {d.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="yonetici-notu" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Yönetici Notu
                  </label>
                  <textarea
                    id="yonetici-notu"
                    value={notForm}
                    onChange={e => setNotForm(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Başvuruyla ilgili dahili not..."
                    className="w-full rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13.5px] px-3.5 py-2.5 placeholder:text-[var(--text-placeholder)] focus:border-[var(--accent)] transition resize-y"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">Başvuru Durumu</p>
                  <Badge tone={durumInfo(secili.durum).tone}>{durumInfo(secili.durum).label}</Badge>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">Yönetici Notu</p>
                  <p className="text-[13.5px] text-heading whitespace-pre-wrap">{secili.yoneticiNotu || "—"}</p>
                </div>
                <p className="text-xs text-muted">Bu başvuruyu yalnızca ilgili İl Eğitimcisi değerlendirip onaylayabilir.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
