"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Alt aksiyon alanı (genelde butonlar) */
  footer?: React.ReactNode;
  /** max genişlik — varsayılan 480px */
  maxWidth?: number;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, footer, maxWidth = 480 }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Escape ile kapanma + basit focus trap
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  // Klavye dinleyicisi — onKeyDown değişince yeniden bağlanır (odağa dokunmaz)
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  // Açılışta YALNIZCA BİR KEZ: ilk öğeye odak + scroll kilidi (her render'da değil —
  // aksi halde input'a yazarken her tuşta odak başa zıplar).
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    });
    return () => {
      document.body.style.overflow = "";
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full rounded-2xl border border-border bg-card shadow-2xl outline-none"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id={titleId} className="text-[15.5px] font-bold text-heading">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Pencereyi kapat"
            className="p-1.5 rounded-lg text-muted hover:bg-subtle transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-subtle/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true → onay butonu kırmızı (silme gibi yıkıcı işlemler) */
  danger?: boolean;
  loading?: boolean;
}

/** Native confirm() yerine kullanılacak onay penceresi */
export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = "Onayla", cancelLabel = "Vazgeç",
  danger = false, loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[14px] leading-relaxed text-secondary">{message}</p>
    </Modal>
  );
}
