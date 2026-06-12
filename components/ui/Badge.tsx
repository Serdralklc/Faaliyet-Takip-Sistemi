"use client";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const TONES: Record<Tone, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  danger:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  info:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  neutral: "bg-subtle text-secondary",
  brand:   "bg-[var(--bg-active)] text-[var(--accent)]",
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
