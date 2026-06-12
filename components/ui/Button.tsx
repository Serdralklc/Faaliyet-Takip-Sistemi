"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** true iken spinner gösterir ve butonu kilitler */
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-[var(--accent-solid)] text-white hover:bg-[var(--accent-hover)] shadow-sm",
  secondary: "bg-card text-secondary border border-border hover:bg-[var(--bg-hover)]",
  danger:    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost:     "text-secondary hover:bg-[var(--bg-hover)]",
  outline:   "border border-[var(--accent-solid)] text-[var(--accent)] hover:bg-[var(--bg-active)]",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[12.5px] rounded-lg gap-1.5",
  md: "px-4 py-2 text-[13.5px] rounded-xl gap-2",
  lg: "px-6 py-3 text-[15px] rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin shrink-0"
          width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
