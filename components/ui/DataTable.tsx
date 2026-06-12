"use client";

/**
 * Genel amaçlı veri tablosu.
 *
 * Özellikler: sütun bazlı sıralama (TR locale), debounce'lu global arama,
 * istemci taraflı sayfalama, satır seçimi + toplu işlem, sütun görünürlüğü
 * (localStorage'da kalıcı), mobilde kart görünümü, skeleton + boş durum.
 *
 * Veri istemcide tutulur (≤500 kayıt — API'lerin legacy tavanı).
 * Daha büyük setler için sunucu sayfalamasına geçilecek ekranlarda
 * loglar sayfasındaki searchParams deseni kullanılır.
 */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronUp, ChevronDown, ChevronsUpDown, Search, Columns3,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { Button } from "./Button";
import { SkeletonTable } from "./Skeleton";

export interface DataTableColumn<T> {
  /** Benzersiz anahtar; sortValue verilmemişse row[key] kullanılır */
  key: string;
  header: React.ReactNode;
  /** Hücre içeriği — verilmezse String(row[key]) */
  render?: (row: T) => React.ReactNode;
  /** Sıralama değeri — verilmezse row[key] */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Varsayılan true */
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  /** Başlangıçta gizli */
  defaultHidden?: boolean;
  /** Görünürlük menüsünden gizlenebilir mi (varsayılan true) */
  hideable?: boolean;
  /** Mobil kartta göster (varsayılan: ilk 4 sütun) */
  mobile?: boolean;
}

export interface BulkAction<T> {
  label: string;
  tone?: "primary" | "secondary" | "danger";
  onClick: (rows: T[]) => void | Promise<void>;
}

interface DataTableProps<T> {
  /** Sütun görünürlüğünün localStorage anahtarı — verilirse tercih kalıcı olur */
  id?: string;
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Global arama için satır metni — verilmezse sütun değerlerinden türetilir */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  /** Arama kutusunun yanına özel filtre kontrolleri */
  toolbar?: React.ReactNode;
  /** Satır sonu aksiyonları (sabit sağ sütun) */
  rowActions?: (row: T) => React.ReactNode;
  /** Satır seçimini açar */
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
  pageSize?: number;
  emptyText?: string;
  /** Mobil kart içeriği — verilmezse görünür sütunlardan üretilir */
  mobileCard?: (row: T) => React.ReactNode;
  /** Satıra tıklanınca (seçim checkbox'ı hariç) */
  onRowClick?: (row: T) => void;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

const collator = new Intl.Collator("tr", { sensitivity: "base", numeric: true });

function defaultCellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function toSortable(v: unknown): string | number {
  if (v == null) return "";
  if (typeof v === "number" || typeof v === "bigint") return Number(v);
  if (v instanceof Date) return v.getTime();
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v);
}

export function DataTable<T>({
  id,
  data,
  columns,
  rowKey,
  loading = false,
  searchText,
  searchPlaceholder = "Ara...",
  toolbar,
  rowActions,
  selectable = false,
  bulkActions = [],
  pageSize: initialPageSize = 25,
  emptyText = "Kayıt bulunamadı.",
  mobileCard,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    const initial = new Set(columns.filter(c => c.defaultHidden).map(c => c.key));
    if (id && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`dt-cols-${id}`);
        if (saved) return new Set(JSON.parse(saved) as string[]);
      } catch { /* yok say */ }
    }
    return initial;
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const headerCbRef = useRef<HTMLInputElement>(null);

  // Sütun görünürlüğünü kalıcılaştır
  useEffect(() => {
    if (id) {
      try { localStorage.setItem(`dt-cols-${id}`, JSON.stringify([...hiddenCols])); } catch { /* yok say */ }
    }
  }, [id, hiddenCols]);

  // Sütun menüsü dış tıklama/Escape
  useEffect(() => {
    if (!colMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setColMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [colMenuOpen]);

  const visibleColumns = useMemo(
    () => columns.filter(c => !hiddenCols.has(c.key)),
    [columns, hiddenCols]
  );

  // Arama
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLocaleLowerCase("tr");
    if (!q) return data;
    return data.filter(row => {
      const hay = searchText
        ? searchText(row)
        : columns.map(c => {
            const v = c.sortValue ? c.sortValue(row) : defaultCellValue(row, c.key);
            return v == null ? "" : String(v);
          }).join(" ");
      return hay.toLocaleLowerCase("tr").includes(q);
    });
  }, [data, deferredSearch, searchText, columns]);

  // Sıralama
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return filtered;
    const get = (row: T) => toSortable(col.sortValue ? col.sortValue(row) : defaultCellValue(row, col.key));
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return collator.compare(String(va), String(vb)) * dir;
    });
  }, [filtered, sort, columns]);

  // Arama/veri değişince ilk sayfaya dön
  useEffect(() => { setPage(1); }, [deferredSearch, data.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Seçim
  const pageKeys = pageRows.map(rowKey);
  const allPageSelected = pageKeys.length > 0 && pageKeys.every(k => selected.has(k));
  const somePageSelected = pageKeys.some(k => selected.has(k));

  useEffect(() => {
    if (headerCbRef.current) headerCbRef.current.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageKeys.forEach(k => next.delete(k));
      else pageKeys.forEach(k => next.add(k));
      return next;
    });
  }

  function toggleRow(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedRows = useMemo(
    () => data.filter(row => selected.has(rowKey(row))),
    [data, selected, rowKey]
  );

  function cycleSort(key: string) {
    setSort(prev => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const mobileCols = columns.filter(c => c.mobile ?? false);
  const cardCols = mobileCols.length > 0 ? mobileCols : visibleColumns.slice(0, 4);

  const showSkeleton = loading && data.length === 0;

  return (
    <div className="sv-section">
      {/* ── Araç çubuğu ── */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 border-b border-border">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] pl-9 pr-3 py-2 placeholder:text-[var(--text-placeholder)] focus:border-[var(--accent)] transition"
          />
        </div>
        {toolbar}
        <div className="flex-1" />
        <div className="relative" ref={colMenuRef}>
          <button
            onClick={() => setColMenuOpen(v => !v)}
            aria-expanded={colMenuOpen}
            aria-label="Sütunları göster/gizle"
            title="Sütunlar"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[12.5px] font-semibold text-secondary hover:bg-[var(--bg-hover)] transition"
          >
            <Columns3 size={14} />
            <span className="hidden sm:inline">Sütunlar</span>
          </button>
          {colMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-56 rounded-xl border border-border bg-card shadow-xl py-2 max-h-72 overflow-y-auto">
              {columns.filter(c => c.hideable !== false).map(c => (
                <label key={c.key} className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-secondary hover:bg-[var(--bg-hover)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(c.key)}
                    onChange={() =>
                      setHiddenCols(prev => {
                        const next = new Set(prev);
                        if (next.has(c.key)) next.delete(c.key);
                        else next.add(c.key);
                        return next;
                      })
                    }
                    className="accent-[var(--accent-solid)]"
                  />
                  {typeof c.header === "string" ? c.header : c.key}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Toplu işlem çubuğu ── */}
      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 border-b border-border" style={{ background: "var(--bg-active)" }}>
          <span className="text-[13px] font-bold text-[var(--accent)]">{selected.size} kayıt seçili</span>
          {bulkActions.map(a => (
            <Button key={a.label} size="sm" variant={a.tone ?? "secondary"} onClick={() => a.onClick(selectedRows)}>
              {a.label}
            </Button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            aria-label="Seçimi temizle"
            className="ml-auto p-1.5 rounded-lg text-muted hover:bg-[var(--bg-hover)] transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showSkeleton ? (
        <div className="p-4"><SkeletonTable rows={6} cols={Math.min(visibleColumns.length, 5)} /></div>
      ) : (
        <>
          {/* ── Masaüstü tablo ── */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-border" style={{ background: "var(--bg-th)" }}>
                  {selectable && (
                    <th scope="col" className="w-10 px-4 py-3">
                      <input
                        ref={headerCbRef}
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAll}
                        aria-label="Sayfadaki tümünü seç"
                        className="accent-[var(--accent-solid)]"
                      />
                    </th>
                  )}
                  {visibleColumns.map(c => {
                    const sortable = c.sortable !== false;
                    const active = sort?.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                        className={`px-4 py-3 font-bold text-[11.5px] uppercase tracking-wider text-muted whitespace-nowrap text-${c.align ?? "left"}`}
                        style={c.width ? { width: c.width } : undefined}
                      >
                        {sortable ? (
                          <button
                            onClick={() => cycleSort(c.key)}
                            className="inline-flex items-center gap-1 hover:text-heading transition group"
                          >
                            {c.header}
                            {active
                              ? (sort!.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
                              : <ChevronsUpDown size={12} className="opacity-40 group-hover:opacity-80" />}
                          </button>
                        ) : c.header}
                      </th>
                    );
                  })}
                  {rowActions && <th scope="col" className="px-4 py-3 text-right font-bold text-[11.5px] uppercase tracking-wider text-muted">İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-12 text-center text-muted text-[13.5px]">
                      {deferredSearch ? `"${deferredSearch}" için sonuç bulunamadı.` : emptyText}
                    </td>
                  </tr>
                ) : (
                  pageRows.map(row => {
                    const key = rowKey(row);
                    return (
                      <tr
                        key={key}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={onRowClick ? "cursor-pointer" : undefined}
                        style={selected.has(key) ? { background: "var(--bg-active)" } : undefined}
                      >
                        {selectable && (
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(key)}
                              onChange={() => toggleRow(key)}
                              aria-label="Satırı seç"
                              className="accent-[var(--accent-solid)]"
                            />
                          </td>
                        )}
                        {visibleColumns.map(c => (
                          <td key={c.key} className={`px-4 py-3 text-${c.align ?? "left"} text-secondary`}>
                            {c.render ? c.render(row) : String(defaultCellValue(row, c.key) ?? "—")}
                          </td>
                        ))}
                        {rowActions && (
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                            {rowActions(row)}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobil kart görünümü ── */}
          <div className="lg:hidden divide-y divide-border">
            {pageRows.length === 0 ? (
              <p className="px-4 py-12 text-center text-muted text-[13.5px]">
                {deferredSearch ? `"${deferredSearch}" için sonuç bulunamadı.` : emptyText}
              </p>
            ) : (
              pageRows.map(row => {
                const key = rowKey(row);
                return (
                  <div key={key} className="px-4 py-3.5 flex gap-3">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleRow(key)}
                        aria-label="Satırı seç"
                        className="accent-[var(--accent-solid)] mt-1 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1" onClick={onRowClick ? () => onRowClick(row) : undefined}>
                      {mobileCard ? (
                        mobileCard(row)
                      ) : (
                        <dl className="space-y-1">
                          {cardCols.map(c => (
                            <div key={c.key} className="flex items-baseline gap-2">
                              <dt className="text-[10.5px] font-bold uppercase tracking-wider text-muted w-24 shrink-0">
                                {typeof c.header === "string" ? c.header : c.key}
                              </dt>
                              <dd className="text-[13px] text-secondary min-w-0">
                                {c.render ? c.render(row) : String(defaultCellValue(row, c.key) ?? "—")}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {rowActions && <div className="mt-2.5 flex justify-end gap-1.5">{rowActions(row)}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Sayfalama ── */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-border text-[12.5px] text-muted">
            <span>
              {sorted.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`}
              {" / "}{sorted.length} kayıt
            </span>
            <label className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Sayfa boyutu:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                aria-label="Sayfa boyutu"
                className="rounded-lg border border-border bg-input text-heading px-2 py-1 text-[12.5px]"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Önceki sayfa"
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-[var(--bg-hover)] transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-semibold text-secondary">{safePage} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="Sonraki sayfa"
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-[var(--bg-hover)] transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
