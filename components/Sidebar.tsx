"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/constants";
import { gorevEtiket, rolEtiket, icerikYanRol, formYonetimiYanRol, istisareYanRol, barinmaGorunumYanRol, ilFaaliyetTakipYanRol } from "@/lib/constants";
import {
  LayoutDashboard, Users, MapPin, FileText, ClipboardList,
  LogOut, Sun, Moon, ChevronDown, ChevronRight,
  GraduationCap, School, BookOpen, Home, Building2,
  Hotel, BarChart3, Settings, UserCircle, X,
  FolderOpen, Bell, Archive, PenSquare, MessagesSquare,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

interface User {
  id: string; ad: string; soyad: string; role: Role;
  sistem?: string | null;
  icerikYoneticisi?: boolean;
  merkezGorev?: string | null;
  anaRol?: string | null;
  yanRoller?: string[];
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

/* Merkez Ekip + İçerik Yöneticisi: aktif görünüm değiştirici */
function GorunumSwitcher({ aktif }: { aktif: "merkez" | "icerik" }) {
  const router = useRouter();
  const set = (v: "merkez" | "icerik") => {
    if (v === aktif) return;
    document.cookie = `panel-gorunum=${v}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.push("/panel/admin");
    router.refresh();
  };
  const btn = (v: "merkez" | "icerik", Icon: React.ElementType, label: string) => {
    const on = aktif === v;
    return (
      <button
        onClick={() => set(v)}
        aria-pressed={on}
        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition"
        style={on
          ? { background: "var(--green-primary)", color: "#fff" }
          : { color: "var(--text-muted)" }}
      >
        <Icon size={13} strokeWidth={on ? 2.5 : 2} />
        <span>{label}</span>
      </button>
    );
  };
  return (
    <div className="pb-1">
      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
        Görünüm
      </p>
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-hover)" }}>
        {btn("merkez", UserCircle, "Merkez Ekip")}
        {btn("icerik", PenSquare, "İçerik Yön.")}
      </div>
    </div>
  );
}

export function Sidebar({ user, aktifGorunum = "merkez", onClose }: {
  user: User; aktifGorunum?: "merkez" | "icerik"; onClose?: () => void;
}) {
  // ── Ana rol (F2/F3): sidebar ana role göre; yan roller ek sekme/yetki kapıları ──
  const anaRol = user.anaRol ?? null;
  const yan = user.yanRoller ?? [];
  // anaRol boşsa eski role'den türet (uyum köprüsü)
  const isAdmin       = anaRol === "ADMIN" || (!anaRol && user.role === "SISTEM_ADMIN");
  const isMerkez      = anaRol === "MERKEZ" || (!anaRol && (user.role === "GENEL_MERKEZ" || user.role === "TURKIYE_EGITIM_SORUMLUSU"));
  const isUniGenclik  = anaRol === "UNIVERSITE_GENCLIK" || (!anaRol && user.role === "TURKIYE_UNIVERSITE_SORUMLUSU");
  const isLiseGenclik = anaRol === "LISE_GENCLIK" || (!anaRol && user.role === "TURKIYE_LISE_SORUMLUSU");
  const isTeknik = !anaRol && user.role === "TEKNIK";
  const isBolge  = user.role === "BOLGE_SORUMLUSU";
  const isIl     = user.role === "IL_SORUMLUSU";
  const isManagement = isAdmin || isMerkez || isUniGenclik || isLiseGenclik;

  // Yan rol yetenek kapıları (Merkez ana rolünde ek sekmeler)
  const canFormYon    = formYonetimiYanRol(yan);
  const canIstisare   = istisareYanRol(yan);
  const canIcerikTabs = icerikYanRol(yan);
  const canBarinma    = isAdmin || barinmaGorunumYanRol(yan);
  const canIlFaaliyet = isAdmin || ilFaaliyetTakipYanRol(yan);

  const dashHref = isTeknik ? "/panel/istisare"
    : isManagement ? "/panel/admin"
    : isBolge ? "/panel/bolge"
    : "/panel/il";

  // ── Tam yetkili admin sidebar grupları ────────────────────────────────
  const faaliyetGroup: NavGroupDef = {
    label: "Faaliyet Takip Sistemi",
    icon: ClipboardList,
    items: [
      { href: "/panel/admin/raporlar?sistem=EGITIMCI",   label: "Eğitimci",          icon: BookOpen },
      { href: "/panel/admin/raporlar?sistem=UNIVERSITE", label: "Üniversite Gençlik", icon: GraduationCap },
      { href: "/panel/admin/raporlar?sistem=LISE",       label: "Lise Gençlik",       icon: School },
    ],
  };

  const gonulluGroup: NavGroupDef = {
    label: "Gönüllü Sistemi",
    icon: Users,
    items: [
      { href: "/panel/admin/gonulluler",            label: "SerGenç",                 icon: Users },
      { href: "/panel/admin/burs-basvurulari",      label: "Nezir Burs Başvuruları",  icon: FileText },
      { href: "/panel/admin/ek-kayit-basvurulari",  label: "Ev / Yurt Başvuruları",   icon: Building2 },
    ],
  };

  const kullaniciGroup: NavGroupDef = {
    label: "Kullanıcı Yönetimi",
    icon: UserCircle,
    items: [
      { href: "/panel/admin/kullanicilar?sistem=EGITIMCI",   label: "Eğitimci",          icon: BookOpen },
      { href: "/panel/admin/kullanicilar?sistem=UNIVERSITE", label: "Üniversite Gençlik", icon: GraduationCap },
      { href: "/panel/admin/kullanicilar?sistem=LISE",       label: "Lise Gençlik",       icon: School },
      { href: "/panel/admin/kullanicilar?sistem=GONULLU",    label: "Gönüllüler",         icon: Users },
    ],
  };

  // ── Türkiye Üniversite sorumlusu grupları ─────────────────────────────
  const uniOnlyFaaliyet: NavGroupDef = {
    label: "Faaliyet Takip Sistemi",
    icon: ClipboardList,
    items: [
      { href: "/panel/admin/raporlar?sistem=UNIVERSITE", label: "Üniversite Gençlik", icon: GraduationCap },
    ],
  };

  // ── Türkiye Lise sorumlusu grupları ───────────────────────────────────
  const liseOnlyFaaliyet: NavGroupDef = {
    label: "Faaliyet Takip Sistemi",
    icon: ClipboardList,
    items: [
      { href: "/panel/admin/raporlar?sistem=LISE", label: "Lise Gençlik", icon: School },
    ],
  };

  const ilGroups: NavGroupDef[] = [
    {
      label: "Faaliyet Takip Sistemi",
      icon: ClipboardList,
      items: [
        { href: "/panel/il/faaliyet/ilkogretim", label: "İlköğretim", icon: BookOpen },
        { href: "/panel/il/faaliyet/lise", label: "Lise", icon: School },
        { href: "/panel/il/faaliyet/universite", label: "Üniversite", icon: GraduationCap },
        { href: "/panel/il/faaliyet/ortak", label: "Ortak Faaliyetler", icon: Users },
      ],
    },
    {
      label: "Barınma Yönetimi",
      icon: Home,
      items: [
        { href: "/panel/il/barinma", label: "Ev / Apart / Yurt", icon: Home },
        { href: "/panel/il/barinma/ogrenci", label: "Öğrenci Bilgi Sistemi", icon: Users },
        { href: "/panel/il/barinma/ziyaret", label: "Ziyaret Kayıtları", icon: ClipboardList },
        { href: "/panel/il/ek-kayit-basvurulari", label: "Ev / Yurt Başvuruları", icon: Building2 },
      ],
    },
  ];

  // Bölge Eğitim Sorumlusu — "Faaliyet Takip Sistemi" açılır penceresi (3 sistem, bölgeye kısıtlı)
  const bolgeEgitimFaaliyet: NavGroupDef = {
    label: "Faaliyet Takip Sistemi",
    icon: ClipboardList,
    items: [
      { href: "/panel/bolge/egitim-rapor", label: "Eğitim Birimi", icon: BookOpen },
      { href: "/panel/bolge/genclik-faaliyet?sistem=UNIVERSITE", label: "Üniversite Gençlik", icon: GraduationCap },
      { href: "/panel/bolge/genclik-faaliyet?sistem=LISE", label: "Lise Gençlik", icon: School },
    ],
  };

  // Bölge Eğitim — Barınma Yönetimi (ev/yurt başvuruları bu sekmenin altında)
  const bolgeBarinmaGroup: NavGroupDef = {
    label: "Barınma Yönetimi",
    icon: Home,
    items: [
      { href: "/panel/bolge/barinma", label: "Ev / Apart / Yurt", icon: Home },
      { href: "/panel/bolge/ek-kayit-basvurulari", label: "Ev / Yurt Başvuruları", icon: Building2 },
    ],
  };

  const roleLabel = gorevEtiket(user.role, user.sistem, user.merkezGorev);

  const locationLabel = user.activeIlAd
    ? `${user.activeIlAd} ${rolEtiket("IL_SORUMLUSU", user.sistem)}`
    : user.activeBolgeAd
    ? `${user.activeBolgeAd} ${rolEtiket("BOLGE_SORUMLUSU", user.sistem)}`
    : roleLabel;

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
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <NotificationBell />
        {onClose && (
          <button onClick={onClose} aria-label="Menüyü kapat" className="p-1.5 rounded-lg flex-shrink-0"
            style={{ background: "var(--bg-hover)" }}>
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        )}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* ── ADMIN — tüm ekranlar ── */}
        {isAdmin && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Yönetim Merkezi
            </p>
            <NavItem href="/panel/admin" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavGroupComp group={faaliyetGroup} />
            {canIlFaaliyet && <NavItem href="/panel/admin/il-faaliyet" label="İl Faaliyet Takip" icon={ClipboardList} />}
            {canBarinma && <NavItem href="/panel/admin/barinma-gorunum" label="Barınma Yönetimi" icon={Home} />}
            <NavGroupComp group={gonulluGroup} />
            <NavItem href="/panel/admin/form-yonetimi" label="Form Yönetimi" icon={FileText} />
            <NavItem href="/panel/admin/bildirimler-merkezi" label="Bildirim Merkezi" icon={Bell} />
            <NavItem href="/panel/admin/analiz" label="Rapor ve Analiz Merkezi" icon={BarChart3} />
            <NavItem href="/panel/admin/kullanicilar" label="Kullanıcı Yönetimi" icon={UserCircle} />
            <NavItem href="/panel/admin/bolgeler" label="Eksik Veri Takip" icon={MapPin} />
            <NavItem href="/panel/admin/dokumanlar" label="Doküman Merkezi" icon={FolderOpen} />
            <NavItem href="/panel/admin/arsiv" label="Veri Arşivi" icon={Archive} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
            <NavItem href="/panel/admin/loglar"   label="Denetim Logları" icon={ClipboardList} />
          </>
        )}

        {/* ── MERKEZ — temel sekmeler + yan rol kapıları ── */}
        {isMerkez && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Yönetim Merkezi
            </p>
            <NavItem href="/panel/admin" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavGroupComp group={faaliyetGroup} />
            {canIlFaaliyet && <NavItem href="/panel/admin/il-faaliyet" label="İl Faaliyet Takip" icon={ClipboardList} />}
            {canBarinma && <NavItem href="/panel/admin/barinma-gorunum" label="Barınma Yönetimi" icon={Home} />}
            <NavGroupComp group={gonulluGroup} />
            <NavItem href="/panel/admin/analiz" label="Rapor ve Analiz Merkezi" icon={BarChart3} />
            <NavItem href="/panel/admin/bolgeler" label="Eksik Veri Takip" icon={MapPin} />
            <NavItem href="/panel/admin/dokumanlar" label="Doküman Merkezi" icon={FolderOpen} />
            {/* Yan rol kapıları */}
            {canFormYon && <NavItem href="/panel/admin/form-yonetimi" label="Form Yönetimi" icon={FileText} />}
            {canIcerikTabs && <NavItem href="/panel/admin/kullanicilar" label="Kullanıcı Yönetimi" icon={UserCircle} />}
            {canIcerikTabs && <NavItem href="/panel/admin/bildirimler-merkezi" label="Bildirim Merkezi" icon={Bell} />}
            {canIcerikTabs && <NavItem href="/panel/admin/arsiv" label="Veri Arşivi" icon={Archive} />}
            {canIstisare && <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />}
            <NavItem href="/panel/admin/loglar"   label="Denetim Logları" icon={ClipboardList} />
          </>
        )}

        {/* ── ÜNİVERSİTE GENÇLİK — yalnızca kendi sistemi ── */}
        {isUniGenclik && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Üniversite Gençlik
            </p>
            <NavItem href="/panel/admin" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavItem href="/panel/admin/raporlar?sistem=UNIVERSITE" label="Faaliyet Takip Sistemi" icon={ClipboardList} />
            {canIlFaaliyet && <NavItem href="/panel/admin/il-faaliyet" label="İl Faaliyet Takip" icon={ClipboardList} />}
            {canBarinma && <NavItem href="/panel/admin/barinma-gorunum" label="Barınma Yönetimi" icon={Home} />}
            <NavItem href="/panel/admin/analiz" label="Rapor ve Analiz Merkezi" icon={BarChart3} />
            <NavItem href="/panel/admin/bolgeler" label="Eksik Veri Takip" icon={MapPin} />
            <NavItem href="/panel/admin/kullanicilar" label="Kullanıcı Yönetimi" icon={UserCircle} />
            <NavItem href="/panel/admin/bildirimler-merkezi" label="Bildirim Merkezi" icon={Bell} />
            <NavItem href="/panel/admin/form-yonetimi" label="Form Yönetimi" icon={FileText} />
            <NavItem href="/panel/admin/dokumanlar" label="Doküman Merkezi" icon={FolderOpen} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* ── LİSE GENÇLİK — yalnızca kendi sistemi ── */}
        {isLiseGenclik && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Lise Gençlik
            </p>
            <NavItem href="/panel/admin" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavItem href="/panel/admin/raporlar?sistem=LISE" label="Faaliyet Takip Sistemi" icon={ClipboardList} />
            {canIlFaaliyet && <NavItem href="/panel/admin/il-faaliyet" label="İl Faaliyet Takip" icon={ClipboardList} />}
            <NavItem href="/panel/admin/analiz" label="Rapor ve Analiz Merkezi" icon={BarChart3} />
            <NavItem href="/panel/admin/bolgeler" label="Eksik Veri Takip" icon={MapPin} />
            <NavItem href="/panel/admin/kullanicilar" label="Kullanıcı Yönetimi" icon={UserCircle} />
            <NavItem href="/panel/admin/bildirimler-merkezi" label="Bildirim Merkezi" icon={Bell} />
            <NavItem href="/panel/admin/form-yonetimi" label="Form Yönetimi" icon={FileText} />
            <NavItem href="/panel/admin/dokumanlar" label="Doküman Merkezi" icon={FolderOpen} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* ── TEKNİK ── (ana panel: İstişare Merkezi) */}
        {isTeknik && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Teknik
            </p>
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* Bölge — Eğitim Birimi */}
        {isBolge && user.sistem !== "UNIVERSITE" && user.sistem !== "LISE" && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Eğitim Birimi
            </p>
            <NavItem href="/panel/bolge" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavGroupComp group={bolgeEgitimFaaliyet} />
            <NavItem href="/panel/bolge/raporlar" label="Raporlar" icon={BarChart3} />
            <NavItem href="/panel/bolge/iller" label="Eksik Veri Girişi – İller" icon={MapPin} />
            <NavGroupComp group={bolgeBarinmaGroup} />
            <NavItem href="/panel/dokumanlar" label="Dokümanlar" icon={FolderOpen} />
            <NavItem href="/panel/formlarim" label="Formlarım" icon={ClipboardList} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* Bölge — Üniversite Gençlik */}
        {isBolge && user.sistem === "UNIVERSITE" && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Üniversite Gençlik
            </p>
            <NavItem href="/panel/bolge" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavItem href="/panel/bolge/genclik-faaliyet" label="Faaliyet Takip Sistemi" icon={ClipboardList} />
            <NavItem href="/panel/bolge/genclik-rapor" label="Raporlar" icon={BarChart3} />
            <NavItem href="/panel/bolge/genclik-iller" label="Eksik Veri Girişi – İller" icon={MapPin} />
            <NavItem href="/panel/bolge/barinma" label="Barınma Yönetimi" icon={Home} />
            <NavItem href="/panel/dokumanlar" label="Dokümanlar" icon={FolderOpen} />
            <NavItem href="/panel/formlarim" label="Formlarım" icon={FileText} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* Bölge — Lise Gençlik */}
        {isBolge && user.sistem === "LISE" && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Lise Gençlik
            </p>
            <NavItem href="/panel/bolge" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavItem href="/panel/bolge/genclik-faaliyet" label="Faaliyet Takip Sistemi" icon={ClipboardList} />
            <NavItem href="/panel/bolge/genclik-rapor" label="Raporlar" icon={BarChart3} />
            <NavItem href="/panel/bolge/genclik-iller" label="Eksik Veri Girişi – İller" icon={MapPin} />
            <NavItem href="/panel/dokumanlar" label="Dokümanlar" icon={FolderOpen} />
            <NavItem href="/panel/formlarim" label="Formlarım" icon={FileText} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* İl — Lise Gençlik sistemi: tek birim, faaliyet-bazlı (açılır menü yok) */}
        {isIl && user.sistem === "LISE" && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Lise Gençlik
            </p>
            <NavItem href="/panel/il" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavItem href="/panel/il/lise-faaliyet" label="Faaliyet Takip Sistemi" icon={ClipboardList} />
            <NavItem href="/panel/il/genclik-rapor" label="Raporlar" icon={BarChart3} />
            <NavItem href="/panel/dokumanlar" label="Dokümanlar" icon={FolderOpen} />
            <NavItem href="/panel/formlarim" label="Formlarım" icon={FileText} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* İl — Üniversite Gençlik sistemi: tek birim, faaliyet-bazlı (açılır menü yok) */}
        {isIl && user.sistem === "UNIVERSITE" && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Üniversite Gençlik
            </p>
            <NavItem href="/panel/il" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavItem href="/panel/il/universite-faaliyet" label="Faaliyet Takip Sistemi" icon={ClipboardList} />
            <NavItem href="/panel/il/genclik-rapor" label="Raporlar" icon={BarChart3} />
            <NavItem href="/panel/il/barinma-gorunum" label="Barınma Yönetimi" icon={Home} />
            <NavItem href="/panel/dokumanlar" label="Dokümanlar" icon={FolderOpen} />
            <NavItem href="/panel/formlarim" label="Formlarım" icon={FileText} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
          </>
        )}

        {/* İl — Eğitimci sistemi (tam yapı) */}
        {isIl && user.sistem !== "LISE" && user.sistem !== "UNIVERSITE" && (
          <>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Ana Menü
            </p>
            <NavItem href="/panel/il" label="Ana Sayfa" icon={LayoutDashboard} exact />
            <NavGroupComp group={ilGroups[0]} />
            <NavItem href="/panel/il/raporlar" label="Raporlar" icon={BarChart3} />
            {ilGroups.slice(1).map(g => <NavGroupComp key={g.label} group={g} />)}
            <NavItem href="/panel/dokumanlar" label="Dokümanlar" icon={FolderOpen} />
            <NavItem href="/panel/formlarim" label="Formlarım" icon={ClipboardList} />
            <NavItem href="/panel/istisare" label="İstişare Merkezi" icon={MessagesSquare} />
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
