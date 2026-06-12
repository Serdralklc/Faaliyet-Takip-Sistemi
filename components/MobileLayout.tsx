"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import type { Role } from "@/lib/constants";

interface User {
  id: string; ad: string; soyad: string; role: Role;
  sistem?: string | null;
  activeIlAd?: string | null;
  activeBolgeAd?: string | null;
}

export function MobileLayout({ user, children }: { user: User; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince sidebar'ı kapat
  useEffect(() => { setOpen(false); }, [pathname]);

  // Body scroll kilit (sidebar açıkken)
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape ile çekmeceyi kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="panel-layout flex h-screen overflow-hidden" style={{ background: "var(--bg-page)" }}>

      {/* ── Desktop sidebar (her zaman görünür, lg ve üstü) ── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer — kapalıyken inert: klavye/ekran okuyucuya kapalı ── */}
      <div
        inert={!open}
        className={`
          fixed top-0 left-0 h-full z-50 lg:hidden
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ width: 272 }}
      >
        <Sidebar user={user} onClose={() => setOpen(false)} />
      </div>

      {/* ── Ana içerik ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl transition"
            style={{ background: "var(--bg-hover)" }}
            aria-label="Menüyü aç"
            aria-expanded={open}
          >
            <Menu size={20} style={{ color: "var(--text-primary)" }} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Serhendi" className="w-7 h-7" />
            <div>
              <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                Faaliyet Takip
              </p>
              <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
                Serhendi Vakfı
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>

        {/* Sayfa içeriği */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
