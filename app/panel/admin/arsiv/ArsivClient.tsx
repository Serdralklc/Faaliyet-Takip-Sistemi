"use client";

/**
 * Arşiv Merkezi — yıl bazlı veri arşivi.
 * İlke: HİÇBİR VERİ SİLİNMEZ. Geçmiş dönemler "arşivlenir" → salt-okunur olur,
 * il sorumluları artık o dönemi değiştiremez; veri raporlarda ve burada kalır.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Lock, Unlock, FileBarChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { SkeletonStatCards } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface YilOzet {
  yil: number;
  toplam: number;
  arsivli: number;
}

export function ArsivClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [onay, setOnay] = useState<{ yil: number; arsivle: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["arsiv"],
    queryFn: async (): Promise<{ yillar: YilOzet[] }> => {
      const res = await fetch("/api/arsiv");
      if (!res.ok) throw new Error("Arşiv yüklenemedi.");
      return res.json();
    },
  });

  async function uygula() {
    if (!onay) return;
    setSaving(true);
    try {
      const res = await fetch("/api/arsiv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yil: onay.yil, arsivle: onay.arsivle }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ type: "error", title: "İşlem başarısız", message: d?.error });
        return;
      }
      toast({
        type: "success",
        title: onay.arsivle ? `${onay.yil} arşivlendi` : `${onay.yil} arşivden çıkarıldı`,
        message: `${d.etkilenen} kayıt güncellendi.`,
      });
      setOnay(null);
      queryClient.invalidateQueries({ queryKey: ["arsiv"] });
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setSaving(false);
    }
  }

  const yillar = data?.yillar ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="sv-page-header">
        <h1>Veri Arşivi</h1>
        <p>Yıl bazlı faaliyet verisi arşivi — geçmiş dönemleri salt-okunur hale getirin</p>
      </div>

      {/* Bilgi şeridi: veri silinmez ilkesi */}
      <div
        className="flex items-start gap-3 rounded-2xl border p-4"
        style={{ background: "var(--bg-active)", borderColor: "var(--green-muted)" }}
      >
        <ShieldCheck size={20} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
        <div>
          <p className="text-[13.5px] font-bold text-heading">Hiçbir veri silinmez</p>
          <p className="text-[12.5px] text-secondary mt-0.5 leading-relaxed">
            Bir yılı arşivlemek veriyi <strong>silmez</strong>; yalnızca o yılın faaliyet kayıtlarını salt-okunur yapar.
            İl sorumluları arşivlenmiş dönemi değiştiremez, ancak veri raporlarda ve dışa aktarımda kalmaya devam eder.
            Gerektiğinde "Arşivden Çıkar" ile düzenlemeyi tekrar açabilirsiniz.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonStatCards count={3} />
      ) : yillar.length === 0 ? (
        <div className="sv-section p-12 text-center">
          <Archive size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-[14px] font-semibold text-muted">Henüz faaliyet kaydı yok.</p>
          <p className="text-[13px] text-muted mt-1">Veri girildikçe yıllar burada arşivlenebilir olacak.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {yillar.map(y => {
            const tamArsiv = y.arsivli > 0 && y.arsivli === y.toplam;
            const kismi = y.arsivli > 0 && y.arsivli < y.toplam;
            return (
              <div key={y.yil} className="sv-section p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[28px] font-black text-heading leading-none">{y.yil}</p>
                    <p className="text-[12px] text-muted mt-1.5">{y.toplam.toLocaleString("tr-TR")} il-dönem kaydı</p>
                  </div>
                  {tamArsiv ? (
                    <Badge tone="warning"><Lock size={11} /> Arşivli</Badge>
                  ) : kismi ? (
                    <Badge tone="info">{y.arsivli}/{y.toplam} arşivli</Badge>
                  ) : (
                    <Badge tone="success"><Unlock size={11} /> Aktif</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  {tamArsiv ? (
                    <Button size="sm" variant="secondary" onClick={() => setOnay({ yil: y.yil, arsivle: false })}>
                      <Unlock size={13} /> Arşivden Çıkar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setOnay({ yil: y.yil, arsivle: true })}>
                      <Lock size={13} /> Arşivle
                    </Button>
                  )}
                  <Link href={`/panel/admin/raporlar?sistem=EGITIMCI`} className="ml-auto">
                    <Button size="sm" variant="ghost" title="Bu yılın raporlarını görüntüle">
                      <FileBarChart size={13} /> Rapor
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!onay}
        onClose={() => setOnay(null)}
        onConfirm={uygula}
        loading={saving}
        danger={false}
        title={onay?.arsivle ? `${onay.yil} Yılını Arşivle` : `${onay?.yil} Yılını Arşivden Çıkar`}
        confirmLabel={onay?.arsivle ? "Arşivle" : "Arşivden Çıkar"}
        message={
          onay?.arsivle
            ? `${onay.yil} yılının tüm faaliyet kayıtları salt-okunur olacak ve il sorumluları bu dönemi değiştiremeyecek. Veriler silinmez, istediğiniz zaman geri açabilirsiniz.`
            : `${onay?.yil} yılının faaliyet kayıtları yeniden düzenlenebilir hale gelecek.`
        }
      />
    </div>
  );
}
