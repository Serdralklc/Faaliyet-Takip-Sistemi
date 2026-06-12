"use client";

/**
 * Formlarım — bölge/il sorumlusuna yayınlanan dinamik formların listesi.
 * Yanıtlanmış formlar salt-okunur görüntülenir, bekleyenler doldurulur.
 */

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTR } from "@/lib/format";
import { ClipboardList, FileText } from "lucide-react";

interface FormOzet {
  id: string;
  baslik: string;
  aciklama?: string | null;
  soruSayisi: number;
  createdAt: string;
  yanitlandi: boolean;
  yanitTarihi?: string | null;
}

function FormKartIskeleti() {
  return (
    <div className="sv-section p-5" aria-hidden="true">
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

export function FormlarimClient() {
  const router = useRouter();

  const { data: formlar = [], isLoading } = useQuery({
    queryKey: ["formlarim"],
    queryFn: async (): Promise<FormOzet[]> => {
      const res = await fetch("/api/formlarim");
      if (!res.ok) throw new Error("Formlar yüklenemedi.");
      return res.json();
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="sv-page-header">
        <h1>Formlarım</h1>
        <p>Size yayınlanan formları görüntüleyin ve yanıtlayın</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <FormKartIskeleti key={i} />)}
        </div>
      ) : formlar.length === 0 ? (
        <div className="sv-section p-10 flex flex-col items-center text-center">
          <ClipboardList size={36} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <p className="mt-3 text-sm font-medium text-muted">Size yayınlanmış form bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {formlar.map(form => (
            <div key={form.id} className="sv-section p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-bold text-heading leading-snug">{form.baslik}</h2>
                {form.yanitlandi && (
                  <Badge tone="success" className="flex-shrink-0">
                    ✓ Yanıtlandı{form.yanitTarihi ? ` (${formatDateTR(form.yanitTarihi)})` : ""}
                  </Badge>
                )}
              </div>

              {form.aciklama && (
                <p className="mt-1.5 text-[13px] text-secondary leading-relaxed line-clamp-3">{form.aciklama}</p>
              )}

              <div className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                <FileText size={13} strokeWidth={2} />
                <span>{form.soruSayisi} soru</span>
                <span aria-hidden="true">•</span>
                <span>Yayın: {formatDateTR(form.createdAt)}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex-1 flex items-end">
                {form.yanitlandi ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/panel/formlarim/${form.id}`)}
                  >
                    Yanıtımı Gör
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/panel/formlarim/${form.id}`)}
                  >
                    Doldur
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
