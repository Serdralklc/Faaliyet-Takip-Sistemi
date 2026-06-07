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
  Hotel, BarChart3, Settings, UserCircle, Target, TrendingUp, X,
} from "lucide-react";

interface User {
  id: string; ad: string; soyad: string; role: Role;
  activeIlAd?: string | null;
  activeBolgeAd?: string | null;
}

interface NavGroupDef {
  label: string;
  icon: React.ElementType;
  items: { href: string; label: string; icon?: React.ElementType }[];
}

function NavItem({ href, label, icon: Icon, exact }: {
  href: string; label: string; icon?: React.ElementType; exact?: boolean;
}) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link href={href} className={`sv-nav-item ${active ? "active" : ""}`}>
      {Icon && <Icon size={16} strokeWidth={active ? 2.5 : 2} />}
      <span>{label}</span>
    </Link>
  );
}

function NavGroupComp({ group }: { group: NavGroupDef }) {
  const path = usePathname();
  const isAnyActive = group.items.some(i => path === i.href || path.startsWith(i.href + "/"));
  const [open, setOpen] = useState(isAnyActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="sv-nav-item w-full"
        style={isAnyActive ? { color: "var(--green-primary)", fontWeight: 600 } : {}}
      >
        <Icon size={16} strokeWidth={2} />
        <span className="flex-1 text-left">{group.label}</span>
        {open
          ? <ChevronDown size={13} strokeWidth={2.5} />
          : <ChevronRight size={13} strokeWidth={2.5} />}
      </button>
      {open && (
        <div className="ml-2 pl-4 mt-0.5 space-y-0.5 border-l-2"
          style={{ borderColor: "var(--green-muted)" }}>
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
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="sv-nav-item"
    >
      {isDark
        ? <Sun size={16} strokeWidth={2} />
        : <Moon size={16} strokeWidth={2} />}
      <span>{isDark ? "Açık Tema" : "Koyu Tema"}</span>
    </button>
  );
}

export function Sidebar({ user, onClose }: { user: User; onClose?: () => void }) {
  const isAdmin = ["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(user.role);
  const isTR = user.role === "TURKIYE_SORUMLUSU";
  const isBolge = user.role === "BOLGE_SORUMLUSU";
  const isIl = user.role === "IL_SORUMLUSU";

  const dashHref = isAdmin || isTR ? "/panel/admin" : isBolge ? "/panel/bolge" : "/panel/il";

  const adminGroups: NavGroupDef[] = [
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
    {
      label: "Hedef Yönetimi",
      icon: Target,
      items: [
        { href: "/panel/admin/hedefler", label: "Bölge Hedefleri", icon: Target },
      ],
    },
  ];

  const ilGroups: NavGroupDef[] = [
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
        { href: "/panel/il/barinma", label: "Ev / Apart / Yurt", icon: Home },
        { href: "/panel/il/barinma/ogrenci", label: "Öğrenci Bilgi Sistemi", icon: Users },
        { href: "/panel/il/barinma/ziyaret", label: "Ziyaret Kayıtları", icon: ClipboardList },
      ],
    },
    {
      label: "Raporlar",
      icon: BarChart3,
      items: [
        { href: "/panel/il/raporlar", label: "İl Raporları", icon: BarChart3 },
      ],
    },
    {
      label: "Hedef Takip",
      icon: Target,
      items: [
        { href: "/panel/il/hedefler", label: "Hedef Takip Merkezi", icon: Target },
      ],
    },
  ];

  const locationLabel = user.activeIlAd
    ? `${user.activeIlAd} İl Sorumlusu`
    : user.activeBolgeAd
    ? `${user.activeBolgeAd} Bölge Sorumlusu`
    : ROLE_LABELS[user.role];

  const initials = `${user.ad[0] ?? ""}${user.soyad[0] ?? ""}`.toUpperCase();

  return (
    <aside className="flex flex-col h-full border-r"
      style={{ width: 260, background: "var(--bg-sidebar)", borderColor: "var(--border)" }}>

      {/* ── Logo ── */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <Link href={dashHref} className="flex items-center gap-3 hover:opacity-85 transition-opacity min-w-0 flex-1">
          <img src="/logo.svg" alt="Serhendi" className="w-9 h-9 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
              Faaliyet Takip Sistemi
            </p>
            <p className="text-[10.5px] leading-tight truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
              Serhendi Vakfı Eğitim Birimi
            </p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg flex-shrink-0 ml-2"
            style={{ background: "var(--bg-hover)" }}>
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Ayırıcı etiket */}
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
          Ana Menü
        </p>

        {/* Admin / TR */}
        {(isAdmin || isTR) && (
          <>
            <NavItem href="/panel/admin" label="Dashboard" icon={LayoutDashboard} exact />
            {adminGroups.map(g => <NavGroupComp key={g.label} group={g} />)}
            {isAdmin && (
              <NavItem href="/panel/admin/loglar" label="Denetim Logları" icon={ClipboardList} />
            )}
          </>
        )}

        {/* Bölge */}
        {isBolge && (
          <>
            <NavItem href="/panel/bolge" label="Dashboard" icon={LayoutDashboard} exact />
            <NavItem href="/panel/bolge/iller" label="İller" icon={MapPin} />
            <NavItem href="/panel/bolge/raporlar" label="Raporlar" icon={BarChart3} />
            <NavItem href="/panel/bolge/hedefler" label="Hedef Dağıtımı" icon={Target} />
            <NavItem href="/panel/bolge/performans" label="Performans Paneli" icon={TrendingUp} />
          </>
        )}

        {/* İl */}
        {isIl && (
          <>
            <NavItem href="/panel/il" label="Dashboard" icon={LayoutDashboard} exact />
            {ilGroups.map(g => <NavGroupComp key={g.label} group={g} />)}
          </>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 pb-3 pt-2 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
        {/* Profil */}
        <Link href="/panel/profil"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[color:var(--bg-hover)] transition group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "var(--green-primary)" }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
              {user.ad} {user.soyad}
            </p>
            <p className="text-[11px] leading-tight truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
              {locationLabel}
            </p>
          </div>
        </Link>

        <ThemeToggle />

        <button onClick={() => signOut({ callbackUrl: "/giris" })}
          className="sv-nav-item text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
          style={{ color: "#EF4444" }}>
          <LogOut size={16} strokeWidth={2} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
