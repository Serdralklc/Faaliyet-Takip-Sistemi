"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
import {
  LayoutDashboard, Users, MapPin, FileText, ClipboardList,
  LogOut, Sun, Moon, ChevronDown, ChevronRight,
  GraduationCap, School, BookOpen, Home, Building2,
  Hotel, BarChart3, Settings, Shield,
} from "lucide-react";

interface User {
  id: string; ad: string; soyad: string; role: Role;
  activeIlAd?: string | null;
  activeBolgeAd?: string | null;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string; icon?: React.ElementType }[];
}

function NavItem({ href, label, icon: Icon, exact }: { href: string; label: string; icon?: React.ElementType; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? "bg-blue-600 text-white font-semibold shadow-sm"
          : "font-medium hover:bg-[color:var(--bg-hover)]"
      }`}
      style={active ? {} : { color: "var(--text-muted)" }}>
      {Icon && <Icon size={15} />}
      <span>{label}</span>
    </Link>
  );
}

function NavGroup({ group }: { group: NavGroup }) {
  const path = usePathname();
  const isAnyActive = group.items.some(i => path === i.href || path.startsWith(i.href + "/"));
  const [open, setOpen] = useState(isAnyActive);
  const Icon = group.icon;

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
          isAnyActive ? "text-blue-600" : "hover:bg-[color:var(--bg-hover)]"
        }`}
        style={isAnyActive ? {} : { color: "var(--text-secondary)" }}>
        <Icon size={16} />
        <span className="flex-1 text-left">{group.label}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="ml-3 pl-3 border-l mt-0.5 space-y-0.5" style={{ borderColor: "var(--border)" }}>
          {group.items.map(item => (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === "dark";
  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition hover:bg-[color:var(--bg-hover)]"
      style={{ color: "var(--text-muted)" }}>
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      <span>{isDark ? "Açık Tema" : "Koyu Tema"}</span>
    </button>
  );
}

export function Sidebar({ user }: { user: User }) {
  const isAdmin = ["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(user.role);
  const isTR = user.role === "TURKIYE_SORUMLUSU";
  const isBolge = user.role === "BOLGE_SORUMLUSU";
  const isIl = user.role === "IL_SORUMLUSU";

  const adminGroups: NavGroup[] = [
    {
      label: "Kullanıcı Yönetimi",
      icon: Users,
      items: [
        { href: "/panel/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
      ],
    },
    {
      label: "Coğrafi Yapı",
      icon: MapPin,
      items: [
        { href: "/panel/admin/bolgeler", label: "Bölgeler & İller", icon: MapPin },
      ],
    },
    {
      label: "Raporlar",
      icon: BarChart3,
      items: [
        { href: "/panel/admin/raporlar", label: "Türkiye Geneli", icon: BarChart3 },
      ],
    },
  ];

  const ilGroups: NavGroup[] = [
    {
      label: "Faaliyet Yönetimi",
      icon: ClipboardList,
      items: [
        { href: "/panel/il/faaliyet/ilkogretim", label: "İlköğretim", icon: BookOpen },
        { href: "/panel/il/faaliyet/lise", label: "Lise", icon: School },
        { href: "/panel/il/faaliyet/universite", label: "Üniversite", icon: GraduationCap },
      ],
    },
    {
      label: "Barınma Yönetimi",
      icon: Home,
      items: [
        { href: "/panel/il/barinma/evler", label: "Evler", icon: Home },
        { href: "/panel/il/barinma/apartlar", label: "Apartlar", icon: Building2 },
        { href: "/panel/il/barinma/yurtlar", label: "Yurtlar", icon: Hotel },
      ],
    },
    {
      label: "Raporlar",
      icon: BarChart3,
      items: [
        { href: "/panel/il/raporlar", label: "İl Raporları", icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside className="w-64 flex flex-col h-full border-r"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link
          href={isAdmin || isTR ? "/panel/admin" : isBolge ? "/panel/bolge" : "/panel/il"}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>Faaliyet Takip</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Serhendi Gençlik</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Admin / TR / GM */}
        {(isAdmin || isTR) && (
          <>
            <NavItem href="/panel/admin" label="Genel Bakış" icon={LayoutDashboard} exact />
            {adminGroups.map(g => <NavGroup key={g.label} group={g} />)}
            {isAdmin && <NavItem href="/panel/admin/loglar" label="Denetim Logları" icon={ClipboardList} />}
          </>
        )}

        {/* Bölge */}
        {isBolge && (
          <>
            <NavItem href="/panel/bolge" label="Dashboard" icon={LayoutDashboard} exact />
            <NavItem href="/panel/bolge/iller" label="İller" icon={MapPin} />
            <NavItem href="/panel/bolge/raporlar" label="Raporlar" icon={BarChart3} />
          </>
        )}

        {/* İl */}
        {isIl && (
          <>
            <NavItem href="/panel/il" label="Dashboard" icon={LayoutDashboard} exact />
            {ilGroups.map(g => <NavGroup key={g.label} group={g} />)}
            <NavItem href="/panel/il/ayarlar" label="Ayarlar" icon={Settings} />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-0.5" style={{ borderColor: "var(--border)" }}>
        <Link href="/panel/profil" className="block px-3 py-2 rounded-lg hover:bg-[color:var(--bg-hover)] transition">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{user.ad} {user.soyad}</p>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {user.activeIlAd
              ? `${user.activeIlAd} İl Sorumlusu`
              : user.activeBolgeAd
              ? `${user.activeBolgeAd} Bölge Sorumlusu`
              : ROLE_LABELS[user.role]}
          </p>
        </Link>
        <ThemeToggle />
        <button onClick={() => signOut({ callbackUrl: "/giris" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition">
          <LogOut size={15} />Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
