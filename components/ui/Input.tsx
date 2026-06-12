"use client";

import { useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

/** Ortak alan sarmalayıcı — label/htmlFor bağı, hata ve ipucu metni */
function Field({
  id, label, required, error, hint, children,
}: {
  id: string; label?: string; required?: boolean; error?: string; hint?: string; children: ReactNode;
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">
          {label}
          {required && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const baseCls =
  "w-full rounded-xl border bg-input text-heading text-[14px] px-3.5 py-2.5 transition placeholder:text-[var(--text-placeholder)] focus:border-[var(--accent)] disabled:opacity-60";

function fieldCls(error?: string) {
  return `${baseCls} ${error ? "border-red-400" : "border-[var(--border-input)]"}`;
}

function ariaProps(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, required, id: idProp, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <input id={id} required={required} className={`${fieldCls(error)} ${className}`} {...ariaProps(id, error, hint)} {...rest} />
    </Field>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, required, id: idProp, className = "", rows = 4, ...rest }: TextareaProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <textarea id={id} required={required} rows={rows} className={`${fieldCls(error)} resize-y ${className}`} {...ariaProps(id, error, hint)} {...rest} />
    </Field>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, required, id: idProp, className = "", children, ...rest }: SelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <Field id={id} label={label} required={required} error={error} hint={hint}>
      <select id={id} required={required} className={`${fieldCls(error)} ${className}`} {...ariaProps(id, error, hint)} {...rest}>
        {children}
      </select>
    </Field>
  );
}
