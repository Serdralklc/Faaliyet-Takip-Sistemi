"use client";

/**
 * Toast bildirim sistemi.
 * Kullanım: const { toast } = useToast();
 *          toast({ type: "success", title: "Kaydedildi" });
 * ToastProvider, app/providers.tsx'te global olarak bağlıdır.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  leaving?: boolean;
}

interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  /** ms — varsayılan 4000 */
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast, ToastProvider içinde kullanılmalıdır.");
  return ctx;
}

const TYPE_STYLES: Record<ToastType, { bar: string; icon: string }> = {
  success: { bar: "#16A34A", icon: "M20 6L9 17l-5-5" },
  error:   { bar: "#DC2626", icon: "M18 6L6 18M6 6l12 12" },
  warning: { bar: "#D97706", icon: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" },
  info:    { bar: "#2563EB", icon: "M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 200);
  }, []);

  const toast = useCallback(
    ({ type = "info", title, message, duration = 4000 }: ToastOptions) => {
      const id = ++counter.current;
      setItems(prev => [...prev.slice(-4), { id, type, title, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
      >
        {items.map(t => {
          const s = TYPE_STYLES[t.type];
          return (
            <div
              key={t.id}
              role={t.type === "error" || t.type === "warning" ? "alert" : "status"}
              className="flex items-start gap-3 rounded-xl border border-border bg-card shadow-lg px-4 py-3 transition-all duration-200"
              style={{
                borderLeft: `4px solid ${s.bar}`,
                opacity: t.leaving ? 0 : 1,
                transform: t.leaving ? "translateX(12px)" : "translateX(0)",
              }}
            >
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={s.bar} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <path d={s.icon} />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-heading">{t.title}</p>
                {t.message && <p className="text-[12.5px] mt-0.5 text-secondary">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Bildirimi kapat"
                className="shrink-0 p-1 rounded-md text-muted hover:bg-subtle transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
