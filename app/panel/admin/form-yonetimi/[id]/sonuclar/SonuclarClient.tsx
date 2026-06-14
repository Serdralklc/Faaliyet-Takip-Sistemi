"use client";

/**
 * Form sonuçları — verilen formun tüm yanıtlarını tabloda gösterir.
 * Her soru ayrı sütun olur; dosya cevapları indirme bağlantısına dönüşür.
 * PDF / Excel / Word dışa aktarımı aynı sütun düzenini kullanır.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { SonucGorunumlu } from "@/components/ui/SonucGorunumlu";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { Badge } from "@/components/ui/Badge";
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
  konum: { bolgeNo: number | null; bolgeAd: string; ilAd: string };
}

type Sistem = "EGITIMCI" | "UNIVERSITE" | "LISE";

interface Yanitlamayan {
  id: string;
  adSoyad: string;
  email: string;
  sistem: Sistem;
  konum: string;
}

interface SonucData {
  id: string;
  baslik: string;
  sorular: Soru[];
  yanitlar: Yanit[];
  yanitlamayanlar: Yanitlamayan[];
  hedefToplam: number;
}

const SISTEM_BADGE: Record<Sistem, { label: string; tone: "info" | "brand" | "warning" }> = {
  EGITIMCI:   { label: "Eğitim",     tone: "brand" },
  UNIVERSITE: { label: "Üniversite", tone: "info" },
  LISE:       { label: "Lise",       tone: "warning" },
};

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
  const [sekme, setSekme] = useState<"yanitlayan" | "yanitlamayan">("yanitlayan");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["form-sonuclar", formId],
    queryFn: async (): Promise<SonucData> => {
      const res = await fetch(`/api/formlar/${formId}/yanitlar`);
      if (!res.ok) throw new Error("Yanıtlar yüklenemedi.");
      return res.json();
    },
  });

  const sorular = useMemo(() => data?.sorular ?? [], [data]);
  // Bölüm başlıkları cevap toplamaz — sütun/dışa aktarımda gösterilmez
  const gosterilenSorular = useMemo(() => sorular.filter(s => s.tip !== "BOLUM"), [sorular]);
  const yanitlar = useMemo(() => data?.yanitlar ?? [], [data]);
  const yanitlamayanlar = useMemo(() => data?.yanitlamayanlar ?? [], [data]);
  const hedefToplam = data?.hedefToplam ?? 0;

  const columns = useMemo<DataTableColumn<Yanit>[]>(() => [
    {
      key: "userName",
      header: "Yanıtlayan",
      mobile: true,
      render: y => <span className="font-semibold text-heading text-sm">{y.userName}</span>,
    },
    {
      key: "konum",
      header: "Bölge / İl",
      mobile: true,
      sortValue: y => `${y.konum.bolgeNo ?? 99} ${y.konum.ilAd}`,
      render: y => (
        <span className="text-xs text-muted whitespace-nowrap">
          {y.konum.bolgeNo ? `${y.konum.bolgeNo}. Bölge` : "—"}{y.konum.ilAd !== "—" ? ` · ${y.konum.ilAd}` : ""}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Tarih",
      mobile: true,
      sortValue: y => new Date(y.createdAt).getTime(),
      render: y => <span className="text-xs text-muted whitespace-nowrap">{tarihTR(y.createdAt)}</span>,
    },
    ...gosterilenSorular.map<DataTableColumn<Yanit>>(s => ({
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
        { header: "Bölge", key: "bolge" },
        { header: "İl", key: "il" },
        { header: "Tarih", key: "createdAt" },
        ...gosterilenSorular.map(s => ({ header: s.etiket, key: s.id })),
      ],
      rows: yanitlar.map(y => {
        const row: Record<string, string | number | null | undefined> = {
          userName: y.userName,
          bolge: y.konum.bolgeNo ? `${y.konum.bolgeNo}. Bölge` : "—",
          il: y.konum.ilAd,
          createdAt: tarihTR(y.createdAt),
        };
        for (const s of gosterilenSorular) row[s.id] = cevapToText(y.cevaplar?.[s.id]);
        return row;
      }),
    };
  }

  const yanitlamayanColumns = useMemo<DataTableColumn<Yanitlamayan>[]>(() => [
    {
      key: "adSoyad",
      header: "Ad Soyad",
      mobile: true,
      render: u => <span className="font-semibold text-heading text-sm">{u.adSoyad}</span>,
    },
    {
      key: "email",
      header: "E-posta",
      mobile: true,
      render: u => <span className="text-xs text-muted">{u.email}</span>,
    },
    {
      key: "sistem",
      header: "Sistem",
      mobile: true,
      sortValue: u => SISTEM_BADGE[u.sistem].label,
      render: u => {
        const b = SISTEM_BADGE[u.sistem];
        return <Badge tone={b.tone}>{b.label}</Badge>;
      },
    },
    {
      key: "konum",
      header: "Konum",
      mobile: true,
      render: u => <span className="text-sm">{u.konum}</span>,
    },
  ], []);

  function getYanitlamayanSpec(): ExportSpec {
    return {
      title: `Yanıtlamayanlar — ${data?.baslik ?? ""}`,
      subtitle: `${yanitlamayanlar.length} kişi yanıtlamadı`,
      fileName: `form-yanitlamayanlar-${formId}`,
      columns: [
        { header: "Ad Soyad", key: "adSoyad" },
        { header: "E-posta", key: "email" },
        { header: "Sistem", key: "sistem" },
        { header: "Konum", key: "konum" },
      ],
      rows: yanitlamayanlar.map(u => ({
        adSoyad: u.adSoyad,
        email: u.email,
        sistem: SISTEM_BADGE[u.sistem].label,
        konum: u.konum,
      })),
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
        <div className="flex flex-wrap items-center gap-3">
          <h1>{data.baslik}</h1>
          {hedefToplam > 0 && yanitlamayanlar.length > 0 && (
            <Badge tone="warning">
              {yanitlamayanlar.length} / {hedefToplam} kişi henüz yanıtlamadı
            </Badge>
          )}
        </div>
        {sekme === "yanitlayan"
          ? <ExportButtons getSpec={getSpec} />
          : yanitlamayanlar.length > 0 && <ExportButtons getSpec={getYanitlamayanSpec} />}
      </div>

      {/* ── Sekmeler ── */}
      <div className="flex items-center gap-1 border-b border-border" role="tablist" aria-label="Sonuç görünümü">
        {([
          { key: "yanitlayan" as const, label: `Yanıtlayanlar (${yanitlar.length})` },
          { key: "yanitlamayan" as const, label: `Yanıtlamayanlar (${yanitlamayanlar.length})` },
        ]).map(t => {
          const aktif = sekme === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={aktif}
              onClick={() => setSekme(t.key)}
              className="px-4 py-2.5 text-[13.5px] font-semibold transition -mb-px border-b-2"
              style={{
                borderColor: aktif ? "var(--accent)" : "transparent",
                color: aktif ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {sekme === "yanitlayan" ? (
        <SonucGorunumlu
          idBase={`form-sonuc-${formId}`}
          rows={yanitlar}
          columns={columns}
          rowKey={y => y.id}
          searchText={y => `${y.userName} ${y.konum.ilAd} ${gosterilenSorular.map(s => cevapToText(y.cevaplar?.[s.id])).join(" ")}`}
          searchPlaceholder="Yanıtlayan, il veya cevap ara..."
          emptyText="Bu forma henüz yanıt verilmemiş."
        />
      ) : hedefToplam === 0 ? (
        <div className="sv-section px-6 py-14 text-center">
          <p className="text-[14.5px] font-semibold text-heading">Bu forma hedef kitle tanımlı değil.</p>
        </div>
      ) : (
        <DataTable
          id={`form-yanitlamayan-${formId}`}
          data={yanitlamayanlar}
          columns={yanitlamayanColumns}
          rowKey={u => u.id}
          searchText={u => `${u.adSoyad} ${u.email} ${SISTEM_BADGE[u.sistem].label} ${u.konum}`}
          searchPlaceholder="Ad, e-posta veya konum ara..."
          emptyText="Herkes yanıtladı 🎉"
        />
      )}
    </div>
  );
}
