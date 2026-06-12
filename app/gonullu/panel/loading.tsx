import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

/** Gönüllü paneli yükleme iskeleti — sade kart iskeletleri. */
export default function GonulluPanelLoading() {
  return (
    <div className="p-6 sm:p-8">
      <div className="sv-page-header">
        <div className="sv-skeleton h-6 w-52 mb-2.5" aria-hidden="true" />
        <div className="sv-skeleton h-3.5 w-72" aria-hidden="true" />
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="sv-section p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10" style={{ borderRadius: 12 }} />
              <div className="sv-skeleton h-4 w-32" aria-hidden="true" />
            </div>
            <SkeletonText lines={3} />
          </div>
        ))}
      </div>
    </div>
  );
}
