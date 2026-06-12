"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { Badge } from "@/components/ui/Badge";
import type { ExportSpec } from "@/lib/export/corporate";

/* ── Types ── */
export interface IlRow {
  id: string;
  ad: string;
  sorumluAd: string | null;
  hasData: boolean;
  metrikler: {
    ik_elifBaOgrenci: number;
    ik_kuranOgrenci: number;
    ls_toplamFaaliyet: number;
    ls_yeniIntisap: number;
    uni_toplamFaaliyet: number;
    uni_yeniIntisap: number;
    uni_kykBulusmaSayisi: number;
    eay_toplamZiyaret: number;
  };
}

interface Props {
  bolgeAd: string;
  iller: IlRow[];
  yil: number;
  donem: string;
  yillar: number[];
}

/* ── Constants ── */
const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem",
  DONEM_2: "2. Dönem",
  YAZ_DONEMI: "Yaz Dönemi",
};

const DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];

type MetrikKey = keyof IlRow["metrikler"];

// FaaliyetForm FIELDS label'larından kısaltılmış sütun başlıkları
const METRIK_COLS: { key: MetrikKey; label: string }[] = [
  { key: "ik_elifBaOgrenci", label: "Elif-Ba Öğr." },
  { key: "ik_kuranOgrenci", label: "Kuran Öğr." },
  { key: "ls_toplamFaaliyet", label: "Lise Faaliyet" },
  { key: "ls_yeniIntisap", label: "Lise İntisap" },
  { key: "uni_toplamFaaliyet", label: "Üni. Faaliyet" },
  { key: "uni_yeniIntisap", label: "Üni. İntisap" },
  { key: "uni_kykBulusmaSayisi", label: "KYK Buluşma" },
  { key: "eay_toplamZiyaret", label: "Toplam Ziyaret" },
];

const fmt = (v: number) => (v === 0 ? "—" : v.toLocaleString("tr-TR"));

export function BolgeRaporlarClient({ bolgeAd, iller, yil, donem, yillar }: Props) {
  const router = useRouter();

  function pushFilter(nextYil: number, nextDonem: string) {
    router.push(`?yil=${nextYil}&donem=${nextDonem}`);
  }

  /* ── DataTable sütunları ── */
  const columns: DataTableColumn<IlRow>[] = [
    {
      key: "ad",
      header: "İl",
      mobile: true,
      sortValue: (r) => r.ad,
      render: (r) => (
        <div>
          <div className="font-bold text-heading">{r.ad}</div>
          <div className="text-[11.5px] text-muted">
            {r.sorumluAd ?? "Sorumlu atanmamış"}
          </div>
        </div>
      ),
    },
    ...METRIK_COLS.map<DataTableColumn<IlRow>>((c) => ({
      key: c.key,
      header: c.label,
      align: "center",
      sortValue: (r) => r.metrikler[c.key],
      render: (r) => fmt(r.metrikler[c.key]),
    })),
    {
      key: "durum",
      header: "Veri Durumu",
      align: "center",
      mobile: true,
      sortValue: (r) => (r.hasData ? 1 : 0),
      render: (r) =>
        r.hasData ? (
          <Badge tone="success">✓ Girildi</Badge>
        ) : (
          <Badge tone="danger">✗ Eksik</Badge>
        ),
    },
  ];

  /* ── Kurumsal dışa aktarma ── */
  function exportSpec(): ExportSpec {
    return {
      title: `${bolgeAd} Bölge Raporu`,
      subtitle: `${yil} / ${DONEM_LABEL[donem] ?? donem}`,
      fileName: `bolge-raporu-${yil}-${donem}`,
      columns: [
        { header: "İl", key: "il" },
        { header: "Sorumlu", key: "sorumlu" },
        ...METRIK_COLS.map((c) => ({ header: c.label, key: c.key as string })),
        { header: "Veri Durumu", key: "durum" },
      ],
      rows: iller.map((r) => ({
        il: r.ad,
        sorumlu: r.sorumluAd ?? "—",
        ...r.metrikler,
        durum: r.hasData ? "Girildi" : "Eksik",
      })),
    };
  }

  const selectCls =
    "border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none cursor-pointer";
  const selectStyle = {
    borderColor: "var(--border-input)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="sv-page-header">
        <h1>{bolgeAd} — Bölge Raporları</h1>
        <p>İl bazlı faaliyet verileri (salt görüntüleme)</p>
      </div>

      {iller.length === 0 ? (
        <div
          className="sv-section p-10 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Bölgenize henüz il atanmamış.
        </div>
      ) : (
        <>
          {/* Yıl + dönem seçici + dışa aktarma */}
          <div className="sv-section p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Yıl
                </span>
                <select
                  value={String(yil)}
                  onChange={(e) => pushFilter(Number(e.target.value), donem)}
                  className={selectCls}
                  style={selectStyle}
                >
                  {yillar.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Dönem
                </span>
                <div className="flex gap-1">
                  {DONEMLER.map((d) => (
                    <button
                      key={d}
                      onClick={() => pushFilter(yil, d)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition"
                      style={
                        donem === d
                          ? {
                              background: "var(--accent-solid)",
                              color: "#fff",
                              borderColor: "var(--accent-solid)",
                            }
                          : {
                              background: "var(--bg-card)",
                              color: "var(--text-muted)",
                              borderColor: "var(--border)",
                            }
                      }
                    >
                      {DONEM_LABEL[d]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <ExportButtons getSpec={exportSpec} />
          </div>

          {/* İl bazlı rapor tablosu */}
          <DataTable
            id="bolge-raporlar"
            data={iller}
            columns={columns}
            rowKey={(r) => r.id}
            searchText={(r) => `${r.ad} ${r.sorumluAd ?? ""}`}
            searchPlaceholder="İl ara..."
            emptyText="Bu dönem için veri bulunamadı."
          />
        </>
      )}
    </div>
  );
}
