/**
 * Skeleton yükleme göstergeleri — .sv-skeleton animasyonu globals.css'te.
 * Server component'lerde de kullanılabilir ("use client" gerekmez).
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`sv-skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Çok satırlı metin iskeleti */
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sv-skeleton h-3.5" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

/** Tablo iskeleti — başlık + n satır */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="sv-section p-0 overflow-hidden" aria-hidden="true">
      <div className="flex gap-4 px-5 py-3.5" style={{ background: "var(--bg-th)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="sv-skeleton h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-4 border-t border-border">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="sv-skeleton h-3.5 flex-1" style={{ opacity: 1 - r * 0.12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Stat kart iskeleti */
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sv-stat-card">
          <div className="sv-skeleton h-3 w-24 mb-3" />
          <div className="sv-skeleton h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
