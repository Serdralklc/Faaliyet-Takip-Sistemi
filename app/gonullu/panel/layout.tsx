"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useColors() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const dark = m && resolvedTheme === "dark";
  return {
    bg:      dark ? "#081C15" : "#F6F8F5",
    sidebar: dark ? "#0F241C" : "#FFFFFF",
    card:    dark ? "#142C22" : "#FFFFFF",
    br:      dark ? "#1F3D31" : "#E2E8F0",
    h:       dark ? "#F8FAFC" : "#0F172A",
    b:       dark ? "#CBD5E1" : "#475569",
    mu:      dark ? "#94A3B8" : "#64748B",
    hover:   dark ? "#142C22" : "#F6F8F5",
    active:  dark ? "#1A3428" : "#EBF5EF",
  };
}

const GONULLU_NAV = [
  { href: "/gonullu/panel",                label: "Ana Sayfa",              icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  { href: "/gonullu/panel/burs-basvurusu", label: "Nezir Bursu Başvurusu", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" },
  { href: "/gonullu/panel/basvurularim",   label: "Başvurularım",           icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/gonullu/panel/geri-bildirim",  label: "Geri Bildirim Gönder",  icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
  { href: "/gonullu/panel/profil",         label: "Profilim",               icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

const ADMIN_NAV = [
  { href: "/gonullu/panel",               label: "Ana Sayfa",            icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  { href: "/gonullu/panel/burs-paneli",   label: "Burs Başvuru Paneli",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/gonullu/panel/bildirimler",   label: "Geri Bildirimler",     icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
  { href: "/gonullu/panel/profil",        label: "Profilim",             icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" },
];

export default function GonulluPanelLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const c = useColors();
  const [adSoyad,  setAdSoyad]  = useState("");
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/gonullu/me")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setAdSoyad(d.adSoyad);
        setIsAdmin(d.isAdmin === true);
      })
      .catch(() => router.replace("/gonullu/giris"));
  }, [router]);

  async function handleCikis() {
    await fetch("/api/gonullu/cikis", { method: "POST" });
    router.push("/gonullu/giris");
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${c.br}` }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div style={{ background: "#EBF5EF", width: 32, height: 32, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/logo.svg" alt="Serhendi" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p style={{ color: "#064E2A", fontWeight: 700, fontSize: "13px", lineHeight: 1 }}>Serhendi Gençlik</p>
            <p style={{ color: c.mu, fontSize: "11px", marginTop: "2px" }}>Gönüllü Paneli</p>
          </div>
        </Link>
      </div>

      {/* Kullanıcı */}
      {adSoyad && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${c.br}` }}>
          <div style={{ background: BRAND.green + "15", borderRadius: "12px", padding: "12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: BRAND.green, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
              <span style={{ color: BRAND.gold, fontWeight: 800, fontSize: "14px" }}>{adSoyad[0]}</span>
            </div>
            <p style={{ color: c.h, fontWeight: 600, fontSize: "13px" }}>{adSoyad}</p>
            <p style={{ color: c.mu, fontSize: "11px" }}>{isAdmin ? "Yönetici" : "Gönüllü"}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px" }}>
        {(isAdmin ? ADMIN_NAV : GONULLU_NAV).map(item => {
          const active = item.href === "/gonullu/panel"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px", marginBottom: "2px",
                background:  active ? (BRAND.green + "20") : "transparent",
                color:       active ? BRAND.green : c.b,
                fontWeight:  active ? 700 : 500,
                fontSize:    "14px",
                textDecoration: "none",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.icon.split(" M").map((d, i) => <path key={i} d={(i === 0 ? "" : "M") + d}/>)}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Çıkış */}
      <div style={{ padding: "12px 12px", borderTop: `1px solid ${c.br}` }}>
        <button
          onClick={handleCikis}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", width: "100%", color: "#EF4444", fontWeight: 500, fontSize: "14px", background: "transparent", cursor: "pointer", border: "none" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: c.bg }}>

      {/* Desktop sidebar */}
      <aside style={{ width: 260, background: c.sidebar, borderRight: `1px solid ${c.br}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40 }} className="hidden lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile navbar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50" style={{ background: c.sidebar, borderBottom: `1px solid ${c.br}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        <span style={{ color: c.h, fontWeight: 700, fontSize: "15px" }}>Serhendi Gönüllü</span>
        <button onClick={() => setMenuOpen(v => !v)} style={{ color: c.b, background: "none", border: "none", cursor: "pointer" }}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div style={{ width: 260, background: c.sidebar, borderRight: `1px solid ${c.br}`, display: "flex", flexDirection: "column", paddingTop: 56 }}>
            <SidebarContent />
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={() => setMenuOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 0, paddingTop: 0 }} className="lg:ml-[260px]">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
