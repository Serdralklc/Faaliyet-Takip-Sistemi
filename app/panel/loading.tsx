import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";

/**
 * Panel geneli yükleme iskeleti.
 * Alt route'lar kendi loading.tsx'i yoksa bunu miras alır.
 */
export default function PanelLoading() {
  return (
    <div className="p-6 sm:p-8">
      {/* sv-page-header iskeleti */}
      <div className="sv-page-header">
        <div className="sv-skeleton h-6 w-56 mb-2.5" aria-hidden="true" />
        <div className="sv-skeleton h-3.5 w-72" aria-hidden="true" />
      </div>

      <div className="space-y-6">
        <SkeletonStatCards />
        <SkeletonTable />
      </div>
    </div>
  );
}
