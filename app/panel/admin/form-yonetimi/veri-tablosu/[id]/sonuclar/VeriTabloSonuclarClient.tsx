"use client";

/** Veri tablosu kayıtları (yönetici). Tüm il/bölgelerin girdiği satırları tek tabloda gösterir + dışa aktarır. */

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import type { ExportSpec } from "@/lib/export/corporate";

type Hucre = string | number | { dosyaId: string; ad: string; url: string } | null | undefined;

interface Sutun { id: string; sira: number; baslik: string; tip: string }
interface Konum { bolgeNo: number | null; bolgeAd: string; ilAd: string }
interface Kayit { id: string; userId: string; userName: string; degerler: Record<string, Hucre>; createdAt: string; konum: Konum }
interface SonucData { id: string; baslik: string; sutunlar: Sutun[]; kayitlar: Kayit[] }

const dosyaMi = (c: Hucre): c is { dosyaId: string; ad: string; url: string } =>
  typeof c === "object" && c !== null && "url" in c;

function hucreText(c: Hucre): string {
  if (c === null || c === undefined || c === "") return "";
  if (dosyaMi(c)) return c.ad;
  return String(c);
}

function tarihTR(value: string): string {
  return new Date(value).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function VeriTabloSonuclarClient({ tabloId }: { tabloId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["veri-tablo-kayitlar", tabloId],
    queryFn: async (): Promise<SonucData> => {
      const res = await fetch(`/api/veri-tablolari/${tabloId}/kayitlar`);
      if (!res.ok) throw new Error("Kayıtlar yüklenemedi.");
      return res.json();
    },
  });

  const sutunlar = useMemo(() => data?.sutunlar ?? [], [data]);
  const kayitlar = useMemo(() => data?.kayitlar ?? [], [data]);

  const columns = useMemo<DataTableColumn<Kayit>[]>(() => [
    { key: "userName", header: "Giren", mobile: true, render: k => <span className="font-semibold text-heading text-sm">{k.userName}</span> },
    { key: "konum", header: "Bölge / İl", mobile: true, sortValue: k => `${k.konum.bolgeNo ?? 99} ${k.konum.ilAd}`,
      render: k => <span className="text-xs text-muted whitespace-nowrap">{k.konum.bolgeNo ? `${k.konum.bolgeNo}. Bölge` : "—"}{k.konum.ilAd !== "—" ? ` · ${k.konum.ilAd}` : ""}</span> },
    ...sutunlar.map<DataTableColumn<Kayit>>(s => ({
      key: s.id,
      header: s.baslik,
      sortValue: k => hucreText(k.degerler?.[s.id]),
      render: k => {
        const c = k.degerler?.[s.id];
        if (c === null || c === undefined || c === "") return <span className="text-muted">—</span>;
        if (dosyaMi(c)) return <a href={c.url} className="text-sm font-semibold hover:underline" style={{ color: "var(--accent)" }} download>{c.ad}</a>;
        return <span className="text-sm">{String(c)}</span>;
      },
    })),
    { key: "createdAt", header: "Tarih", sortValue: k => new Date(k.createdAt).getTime(),
      render: k => <span className="text-xs text-muted whitespace-nowrap">{tarihTR(k.createdAt)}</span> },
  ], [sutunlar]);

  function getSpec(): ExportSpec {
    return {
      title: `Veri Tablosu — ${data?.baslik ?? ""}`,
      subtitle: `${kayitlar.length} kayıt`,
      fileName: `veri-tablosu-${tabloId}`,
      columns: [
        { header: "Giren", key: "userName" },
        { header: "Bölge", key: "bolge" },
        { header: "İl", key: "il" },
        ...sutunlar.map(s => ({ header: s.baslik, key: s.id })),
        { header: "Tarih", key: "createdAt" },
      ],
      rows: kayitlar.map(k => {
        const row: Record<string, string | number | null | undefined> = {
          userName: k.userName,
          bolge: k.konum.bolgeNo ? `${k.konum.bolgeNo}. Bölge` : "—",
          il: k.konum.ilAd,
          createdAt: tarihTR(k.createdAt),
        };
        for (const s of sutunlar) row[s.id] = hucreText(k.degerler?.[s.id]);
        return row;
      }),
    };
  }

  if (isLoading) return <div className="p-6 lg:p-8 space-y-5"><Skeleton className="h-7 w-72" /><SkeletonTable rows={6} cols={4} /></div>;
  if (isError || !data) return (
    <div className="p-6 lg:p-8"><div className="sv-section px-6 py-14 text-center">
      <p className="text-[14.5px] font-semibold text-heading">Kayıtlar yüklenemedi</p>
      <Link href="/panel/admin/form-yonetimi" className="text-[13px] font-semibold hover:underline mt-3 inline-block" style={{ color: "var(--accent)" }}>← Form Yönetimi</Link>
    </div></div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <Link href="/panel/admin/form-yonetimi" className="inline-block text-[13px] font-semibold hover:underline" style={{ color: "var(--accent)" }}>← Form Yönetimi</Link>
      <div className="sv-page-header flex flex-wrap items-start justify-between gap-3" style={{ marginBottom: 0 }}>
        <h1>{data.baslik}</h1>
        <ExportButtons getSpec={getSpec} />
      </div>
      <DataTable
        id={`veri-tablo-sonuc-${tabloId}`}
        data={kayitlar}
        columns={columns}
        rowKey={k => k.id}
        searchText={k => `${k.userName} ${k.konum.ilAd} ${sutunlar.map(s => hucreText(k.degerler?.[s.id])).join(" ")}`}
        searchPlaceholder="Giren, il veya hücre ara..."
        emptyText="Bu tabloya henüz kayıt girilmemiş."
      />
    </div>
  );
}
