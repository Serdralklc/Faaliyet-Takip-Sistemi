"use client";

/**
 * Form sonuçları — verilen formun tüm yanıtlarını tabloda gösterir.
 * Her soru ayrı sütun olur; dosya cevapları indirme bağlantısına dönüşür.
 * PDF / Excel / Word dışa aktarımı aynı sütun düzenini kullanır.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import type { ExportSpec } from "@/lib/export/corporate";

type CevapDeger = string | number | string[] | { dosyaId: string; ad: string; url: string } | null | undefined;

interface Soru {
  id: string;
  sira: number;
  etiket: string;
  tip: string;
  zorunlu: boolean;
  secenekler: string[];
}

interface Yanit {
  id: string;
  userName: string;
  createdAt: string;
  cevaplar: Record<string, CevapDeger>;
}

interface SonucData {
  id: string;
  baslik: string;
  sorular: Soru[];
  yanitlar: Yanit[];
}

const dosyaMi = (c: CevapDeger): c is { dosyaId: string; ad: string; url: string } =>
  typeof c === "object" && c !== null && !Array.isArray(c);

/** Cevabı düz metne çevirir — arama, sıralama ve dışa aktarma için */
function cevapToText(c: CevapDeger): string {
  if (c === null || c === undefined || c === "") return "";
  if (Array.isArray(c)) return c.join(", ");
  if (dosyaMi(c)) return c.ad;
  return String(c);
}

function tarihTR(value: string): string {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function SonuclarClient({ formId }: { formId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["form-sonuclar", formId],
    queryFn: async (): Promise<SonucData> => {
      const res = await fetch(`/api/formlar/${formId}/yanitlar`);
      if (!res.ok) throw new Error("Yanıtlar yüklenemedi.");
      return res.json();
    },
  });

  const sorular = useMemo(() => data?.sorular ?? [], [data]);
  const yanitlar = useMemo(() => data?.yanitlar ?? [], [data]);

  const columns = useMemo<DataTableColumn<Yanit>[]>(() => [
    {
      key: "userName",
      header: "Yanıtlayan",
      mobile: true,
      render: y => <span className="font-semibold text-heading text-sm">{y.userName}</span>,
    },
    {
      key: "createdAt",
      header: "Tarih",
      mobile: true,
      sortValue: y => new Date(y.createdAt).getTime(),
      render: y => <span className="text-xs text-muted whitespace-nowrap">{tarihTR(y.createdAt)}</span>,
    },
    ...sorular.map<DataTableColumn<Yanit>>(s => ({
      key: s.id,
      header: s.etiket,
      sortValue: y => cevapToText(y.cevaplar?.[s.id]),
      render: y => {
        const c = y.cevaplar?.[s.id];
        if (c === null || c === undefined || c === "" || (Array.isArray(c) && c.length === 0)) {
          return <span className="text-muted">—</span>;
        }
        if (Array.isArray(c)) return <span className="text-sm">{c.join(", ")}</span>;
        if (dosyaMi(c)) {
          return (
            <a
              href={c.url}
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
              download
            >
              {c.ad}
            </a>
          );
        }
        return <span className="text-sm">{String(c)}</span>;
      },
    })),
  ], [sorular]);

  function getSpec(): ExportSpec {
    return {
      title: `Form Sonuçları — ${data?.baslik ?? ""}`,
      subtitle: `${yanitlar.length} yanıt`,
      fileName: `form-sonuclari-${formId}`,
      columns: [
        { header: "Yanıtlayan", key: "userName" },
        { header: "Tarih", key: "createdAt" },
        ...sorular.map(s => ({ header: s.etiket, key: s.id })),
      ],
      rows: yanitlar.map(y => {
        const row: Record<string, string | number | null | undefined> = {
          userName: y.userName,
          createdAt: tarihTR(y.createdAt),
        };
        for (const s of sorular) row[s.id] = cevapToText(y.cevaplar?.[s.id]);
        return row;
      }),
    };
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-72" />
        <SkeletonTable rows={6} cols={4} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 lg:p-8">
        <div className="sv-section px-6 py-14 text-center">
          <p className="text-[14.5px] font-semibold text-heading">Sonuçlar yüklenemedi</p>
          <p className="text-[13px] text-muted mt-1 mb-4">Form silinmiş veya erişim yetkiniz olmayabilir.</p>
          <Link href="/panel/admin/form-yonetimi" className="text-[13px] font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            ← Form Yönetimi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <Link
        href="/panel/admin/form-yonetimi"
        className="inline-block text-[13px] font-semibold hover:underline"
        style={{ color: "var(--accent)" }}
      >
        ← Form Yönetimi
      </Link>

      <div className="sv-page-header flex flex-wrap items-start justify-between gap-3" style={{ marginBottom: 0 }}>
        <div>
          <h1>{data.baslik}</h1>
          <p>Toplam {yanitlar.length} yanıt</p>
        </div>
        <ExportButtons getSpec={getSpec} />
      </div>

      <DataTable
        id={`form-sonuc-${formId}`}
        data={yanitlar}
        columns={columns}
        rowKey={y => y.id}
        searchText={y => `${y.userName} ${sorular.map(s => cevapToText(y.cevaplar?.[s.id])).join(" ")}`}
        searchPlaceholder="Yanıtlayan veya cevap ara..."
        emptyText="Bu forma henüz yanıt verilmemiş."
      />
    </div>
  );
}
