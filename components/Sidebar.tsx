"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
import {
  LayoutDashboard, Users, MapPin, FileText,
  ClipboardList, LogOut, ChevronRight, Sun, Moon,
} from "lucide-react";

interface User {
  id: string;
  ad: string;
  soyad: string;
  role: Role;
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const path = usePathname();
  const active = path === href || (href !== "/panel/admin" && path.startsWith(href));
  return (
    <Link href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "hover:bg-[color:var(--border)]"
      }`}
      style={active ? {} : { color: "var(--text-secondary)" }}>
      <Icon size={18} />
      <span>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto" />}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition hover:bg-[color:var(--border)]"
      style={{ color: "var(--text-muted)" }}
      title={isDark ? "Açık Tema" : "Koyu Tema"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? "Açık Tema" : "Koyu Tema"}</span>
    </button>
  );
}

export function Sidebar({ user }: { user: User }) {
  const isAdmin = ["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(user.role);
  const isTR = user.role === "TURKIYE_SORUMLUSU";
  const isBolge = user.role === "BOLGE_SORUMLUSU";
  const isIl = user.role === "IL_SORUMLUSU";

  return (
    <aside className="w-64 flex flex-col h-full border-r"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}>
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--accent)" }}>Faaliyet Takip</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Serhendi Gençlik</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {(isAdmin || isTR) && (
          <>
            <NavItem href="/panel/admin" icon={LayoutDashboard} label="Genel Bakış" />
            <NavItem href="/panel/admin/kullanicilar" icon={Users} label="Kullanıcılar" />
            <NavItem href="/panel/admin/bolgeler" icon={MapPin} label="Bölgeler & İller" />
            <NavItem href="/panel/admin/raporlar" icon={FileText} label="Raporlar" />
            {isAdmin && <NavItem href="/panel/admin/loglar" icon={ClipboardList} label="Denetim Logları" />}
          </>
        )}
        {isBolge && (
          <>
            <NavItem href="/panel/bolge" icon={LayoutDashboard} label="Bölge Özeti" />
            <NavItem href="/panel/bolge/iller" icon={MapPin} label="İller" />
            <NavItem href="/panel/bolge/raporlar" icon={FileText} label="Raporlar" />
          </>
        )}
        {isIl && (
          <>
            <NavItem href="/panel/il" icon={LayoutDashboard} label="İl Özeti" />
            <NavItem href="/panel/il/faaliyet-gir" icon={ClipboardList} label="Faaliyet Gir" />
            <NavItem href="/panel/il/raporlar" icon={FileText} label="Raporlar" />
          </>
        )}
      </nav>

      <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.ad} {user.soyad}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ROLE_LABELS[user.role]}</p>
        </div>
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: "/giris" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
        >
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
