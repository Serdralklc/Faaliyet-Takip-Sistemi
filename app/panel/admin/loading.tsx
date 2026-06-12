import { SkeletonStatCards, SkeletonText } from "@/components/ui/Skeleton";

/** Admin paneli yükleme iskeleti. */
export default function AdminLoading() {
  return (
    <div className="p-6 sm:p-8">
      <div className="sv-page-header">
        <div className="sv-skeleton h-6 w-48 mb-2.5" aria-hidden="true" />
        <div className="sv-skeleton h-3.5 w-64" aria-hidden="true" />
      </div>

      <div className="space-y-6">
        <SkeletonStatCards />
        <div className="sv-section p-6">
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  );
}
