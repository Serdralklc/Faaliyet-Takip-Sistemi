"use client";

import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "./DataTable";
import { Badge } from "./Badge";

/**
 * Sonuç tablolarını "Tüm Türkiye / Bölge Bazlı / İl Bazlı / Kullanıcı Bazlı" görünümlerinde
 * gösterir. Form ve Veri Tablosu sonuç ekranları ortak kullanır. Satırlarda konum + userName olmalı.
 */

export type GorunumTipi = "turkiye" | "bolge" | "il" | "kullanici";

export interface KonumlananSatir {
  konum: { bolgeNo: number | null; bolgeAd: string; ilAd: string };
  userName?: string;
}

export const GORUNUM_OPTS: { key: GorunumTipi; label: string }[] = [
  { key: "turkiye", label: "Tüm Türkiye" },
  { key: "bolge", label: "Bölge Bazlı" },
  { key: "il", label: "İl Bazlı" },
  { key: "kullanici", label: "Kullanıcı Bazlı" },
];

export const gorunumEtiket = (g: GorunumTipi) => GORUNUM_OPTS.find(o => o.key === g)?.label ?? "Tüm Türkiye";

/** Satırları görünüm boyutuna (bölge/il/kullanıcı) göre sıralı düz dizi olarak döner — dışa aktarım için. */
export function gorunumeGoreSirala<T extends KonumlananSatir>(rows: T[], gorunum: GorunumTipi): T[] {
  if (gorunum === "turkiye") return rows;
  return grupla(rows, gorunum).flatMap(g => g.satirlar);
}

interface Grup<T> { anahtar: string; baslik: string; sira: number; satirlar: T[] }

function grupla<T extends KonumlananSatir>(rows: T[], gorunum: GorunumTipi): Grup<T>[] {
  const m = new Map<string, Grup<T>>();
  for (const r of rows) {
    let anahtar: string, baslik: string, sira: number;
    if (gorunum === "bolge") {
      anahtar = String(r.konum.bolgeNo ?? "z");
      baslik = r.konum.bolgeNo ? `${r.konum.bolgeNo}. Bölge` : "Bölge Atanmamış";
      sira = r.konum.bolgeNo ?? 999;
    } else if (gorunum === "il") {
      anahtar = `${r.konum.bolgeNo ?? "z"}-${r.konum.ilAd}`;
      baslik = r.konum.ilAd !== "—" ? `${r.konum.ilAd}${r.konum.bolgeNo ? ` (${r.konum.bolgeNo}. Bölge)` : ""}` : "İl Atanmamış";
      sira = (r.konum.bolgeNo ?? 999) * 1000;
    } else {
      anahtar = r.userName ?? "—";
      baslik = r.userName ?? "—";
      sira = 0;
    }
    if (!m.has(anahtar)) m.set(anahtar, { anahtar, baslik, sira, satirlar: [] });
    m.get(anahtar)!.satirlar.push(r);
  }
  return [...m.values()].sort((a, b) => a.sira - b.sira || a.baslik.localeCompare(b.baslik, "tr"));
}

export function SonucGorunumlu<T extends KonumlananSatir>({
  rows, columns, rowKey, searchText, searchPlaceholder, emptyText, idBase, gorunum, onGorunum,
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (r: T) => string;
  searchText: (r: T) => string;
  searchPlaceholder?: string;
  emptyText?: string;
  idBase: string;
  gorunum: GorunumTipi;
  onGorunum: (g: GorunumTipi) => void;
}) {
  const gruplar = useMemo(() => (gorunum === "turkiye" ? [] : grupla(rows, gorunum)), [rows, gorunum]);

  return (
    <div className="space-y-4">
      {/* Görünüm seçici */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-wider mr-1" style={{ color: "var(--text-muted)" }}>Görünüm:</span>
        {GORUNUM_OPTS.map(o => {
          const aktif = gorunum === o.key;
          return (
            <button key={o.key} onClick={() => onGorunum(o.key)}
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold border transition"
              style={aktif
                ? { background: "var(--green-primary)", borderColor: "var(--green-primary)", color: "#fff" }
                : { background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
              {o.label}
            </button>
          );
        })}
      </div>

      {gorunum === "turkiye" ? (
        <DataTable id={idBase} data={rows} columns={columns} rowKey={rowKey} searchText={searchText} searchPlaceholder={searchPlaceholder} emptyText={emptyText} />
      ) : (
        <div className="space-y-3">
          {gruplar.map(g => (
            <div key={g.anahtar} className="sv-section p-0 overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
                <h3 className="font-bold text-[14px]" style={{ color: "var(--text-primary)" }}>{g.baslik}</h3>
                <Badge tone="neutral">{g.satirlar.length} kayıt</Badge>
              </div>
              <DataTable id={`${idBase}-${g.anahtar}`} data={g.satirlar} columns={columns} rowKey={rowKey} searchText={searchText} searchPlaceholder={searchPlaceholder} emptyText={emptyText} />
            </div>
          ))}
          {gruplar.length === 0 && (
            <div className="sv-section px-6 py-12 text-center"><p className="text-[13.5px] text-muted">{emptyText ?? "Kayıt yok."}</p></div>
          )}
        </div>
      )}
    </div>
  );
}
