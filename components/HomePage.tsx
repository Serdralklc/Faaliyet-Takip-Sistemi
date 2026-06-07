"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ─── Kesin renk sistemi — opacity ile metin soldurma YOK ─── */
const C = {
  /* Marka */
  green:       "#006B3F",
  greenDark:   "#004D2D",
  greenDeep:   "#002E1A",
  gold:        "#C9A227",
  goldDark:    "#A8861F",

  /* Metin — koyu zemin üstü */
  textOnDark:  "#FFFFFF",
  subOnDark:   "#C8D8CC",   // açık yeşilimsi gri — net görünür
  bodyOnDark:  "#94B8A3",   // okunabilir, silik değil

  /* Metin — açık zemin üstü */
  heading:     "#0F172A",
  sub:         "#334155",
  body:        "#475569",
  muted:       "#64748B",

  /* Yüzeyler */
  white:       "#FFFFFF",
  light:       "#F8F9F6",
  border:      "#CBD5CB",
  borderLight: "#E4EBE6",

  /* Footer */
  footerBg:    "#0D1A10",
  footerText:  "#6B9475",
  footerSub:   "#4A6855",
};

/* ════════════════════════════════════════
   NAV
════════════════════════════════════════ */
function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) setLoginOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const links = [
    { href: "#hakkimizda",  label: "Hakkımızda"  },
    { href: "#faaliyetler", label: "Faaliyetler"  },
    { href: "#projeler",    label: "Projeler"     },
    { href: "#iletisim",    label: "İletişim"     },
  ];

  const bg         = scrolled ? C.white          : "transparent";
  const bdr        = scrolled ? C.borderLight     : "transparent";
  const lc         = scrolled ? C.sub             : C.subOnDark;
  const logoText   = scrolled ? C.greenDark       : C.textOnDark;
  const logoSub    = scrolled ? C.muted           : C.subOnDark;
  const logoBg     = scrolled ? "#E8F5EE"         : "rgba(255,255,255,0.12)";
  const logoBorder = scrolled ? C.borderLight     : "rgba(255,255,255,0.20)";
  const shadow     = scrolled ? "0 1px 0 rgba(0,0,0,0.07)" : "none";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{ background: bg, borderBottom: `1px solid ${bdr}`, boxShadow: shadow, backdropFilter: scrolled ? "blur(16px)" : "none" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: logoBg, border: `1px solid ${logoBorder}` }}>
            <img src="/logo.svg" alt="Serhendi" className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-[14.5px] leading-tight transition-colors" style={{ color: logoText }}>Serhendi Gençlik</p>
            <p className="text-[11px] leading-tight transition-colors" style={{ color: logoSub }}>Serhendi Vakfı Eğitim Birimi</p>
          </div>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 text-[13.5px] font-medium rounded-md transition hover:opacity-100"
              style={{ color: lc }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop sağ butonlar */}
        <div className="hidden lg:flex items-center gap-3" ref={loginRef}>
          <a href="#bagis"
            className="px-4 py-2 text-[13.5px] font-semibold rounded-md border transition hover:opacity-80"
            style={{
              borderColor: scrolled ? C.border : "rgba(255,255,255,0.28)",
              color:       scrolled ? C.sub    : C.subOnDark,
            }}>
            Bağış Yap
          </a>
          <div className="relative">
            <button onClick={() => setLoginOpen(v => !v)}
              className="px-5 py-2 text-[13.5px] font-bold rounded-md text-white flex items-center gap-1.5 transition hover:opacity-90"
              style={{ background: C.green }}>
              Oturum Aç
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d={loginOpen ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {loginOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-[264px] rounded-xl border shadow-2xl overflow-hidden"
                style={{ background: C.white, borderColor: C.borderLight }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: C.borderLight }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>Giriş Türü Seçin</p>
                </div>
                <Link href="/giris" onClick={() => setLoginOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5EE" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.heading }}>Görevli Girişi</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>İl / Bölge Sorumlusu · Yönetici</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 px-4 py-4 border-t" style={{ borderColor: "#F3F4F6", opacity: 0.5, cursor: "not-allowed" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FEF3C7" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: C.heading }}>Gönüllü Girişi</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>Yakında</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>Gönüllü katılımcılar</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2 rounded-md" onClick={() => setMenuOpen(v => !v)}
          style={{ color: scrolled ? C.heading : C.textOnDark }}>
          {menuOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden px-6 py-5 space-y-0 border-t" style={{ background: C.white, borderColor: C.borderLight }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block py-3.5 text-sm font-medium border-b last:border-0"
              style={{ color: C.sub, borderColor: C.borderLight }}>
              {l.label}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-2.5">
            <Link href="/giris"
              className="py-3 text-center text-sm font-bold rounded-md text-white"
              style={{ background: C.green }}>
              Görevli Girişi
            </Link>
            <a href="#bagis"
              className="py-3 text-center text-sm font-semibold rounded-md border"
              style={{ borderColor: C.border, color: C.sub }}>
              Bağış Yap
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ════════════════════════════════════════
   HERO
════════════════════════════════════════ */
function Hero() {
  return (
    <section style={{ background: C.greenDeep, minHeight: "100vh" }}
      className="flex items-center pt-[68px]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full py-20 lg:py-0 lg:min-h-[calc(100vh-68px)] flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

          {/* SOL: Metin */}
          <div>
            {/* Logo container — NET görünür */}
            <div className="inline-flex items-center gap-3 mb-10 px-4 py-3 rounded-lg"
              style={{ background: C.white, border: `1px solid ${C.borderLight}` }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: "#E8F5EE" }}>
                <img src="/logo.svg" alt="Serhendi Gençlik" className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: C.greenDark }}>Serhendi Gençlik</p>
                <p className="text-[11px] leading-tight" style={{ color: C.muted }}>Serhendi Vakfı · Eğitim Birimi</p>
              </div>
            </div>

            {/* Etiket */}
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-6 h-[2px]" style={{ background: C.gold }} />
              <span className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: C.gold }}>
                Türkiye Geneli · 81 İl
              </span>
            </div>

            {/* Ana başlık */}
            <h1 className="font-black leading-[1.06] mb-6"
              style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", color: C.textOnDark, letterSpacing: "-0.025em" }}>
              İlim, Ahlâk<br />
              ve Hizmet<br />
              <span style={{ color: C.gold }}>Yolunda.</span>
            </h1>

            {/* Açıklama */}
            <p className="text-base lg:text-[17px] leading-relaxed mb-10 max-w-md"
              style={{ color: C.subOnDark, fontWeight: 400 }}>
              İlköğretimden üniversiteye kadar her kademedeki gencin
              ilmî, ahlâkî ve manevî gelişimine katkı sağlayan köklü
              bir gençlik ve eğitim organizasyonu.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 mb-14">
              <a href="#hakkimizda"
                className="px-7 py-3 text-sm font-bold text-white rounded-md transition hover:opacity-90"
                style={{ background: C.green }}>
                Hakkımızda
              </a>
              <a href="#faaliyetler"
                className="px-7 py-3 text-sm font-semibold rounded-md transition hover:opacity-80"
                style={{ color: C.subOnDark, border: "1px solid rgba(255,255,255,0.20)", background: "transparent" }}>
                Faaliyetlerimiz →
              </a>
            </div>

            {/* İstatistikler */}
            <div className="flex items-start gap-10 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              {[
                { n: "81",   l: "İl"             },
                { n: "500+", l: "Aktif Gönüllü"  },
                { n: "12+",  l: "Yıl Tecrübe"    },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-3xl font-black" style={{ color: C.textOnDark, letterSpacing: "-0.03em" }}>{s.n}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: C.bodyOnDark }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SAĞ: Görsel kutusu */}
          <div className="relative hidden lg:block">
            <div className="rounded-lg overflow-hidden"
              style={{ aspectRatio: "4/5", background: C.greenDark, border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* Fotoğraf placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-10 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.bodyOnDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-sm font-semibold" style={{ color: C.bodyOnDark }}>Faaliyet Fotoğrafı</p>
                <p className="text-xs max-w-[180px] leading-relaxed" style={{ color: C.footerText }}>
                  public/hero.jpg olarak eklenebilir
                </p>
              </div>

              {/* Alt overlay kart */}
              <div className="absolute bottom-0 inset-x-0 px-6 py-5"
                style={{ background: "rgba(0,30,15,0.80)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.gold }} />
                  <p className="text-sm font-bold" style={{ color: C.textOnDark }}>2024–2025 Faaliyet Dönemi</p>
                </div>
                <p className="text-xs" style={{ color: C.bodyOnDark }}>
                  Türkiye genelinde 81 ilde eş zamanlı faaliyetler
                </p>
              </div>
            </div>
            {/* Altın dekor */}
            <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-md -z-10"
              style={{ background: C.gold, opacity: 0.20 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   HAKKIMIZDA
════════════════════════════════════════ */
function Hakkimizda() {
  const items = [
    { n: "01", t: "Kuran-ı Kerim Eğitimi",     d: "Elif-Ba'dan başlayarak her seviyede haftalık kurslar, deneyimli eğitmen kadrosu." },
    { n: "02", t: "İlim Halkaları",             d: "Lise ve üniversite öğrencilerine yönelik sistematik haftalık ders programları." },
    { n: "03", t: "Kafile & Sosyal Programlar", d: "Gençleri bir araya getiren manevi seyahatler ve sosyal etkinlikler." },
    { n: "04", t: "Barınma & Burs Desteği",     d: "Güvenli barınma ortamları ve Nezir Bursu ile eğitime kesintisiz destek." },
  ];

  return (
    <section id="hakkimizda" style={{ background: C.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* Sol */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-6" style={{ color: C.green }}>
              Hakkımızda
            </p>
            <h2 className="font-black leading-[1.08] mb-8"
              style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", color: C.heading, letterSpacing: "-0.025em" }}>
              Gençliğe Değer,<br />Geleceğe Yatırım
            </h2>
            <p className="text-base leading-relaxed mb-5" style={{ color: C.sub }}>
              Serhendi Vakfı çatısı altında faaliyet gösteren Gençlik Eğitim Birimi
              olarak 12 yılı aşkın tecrübemizle Türkiye'nin her köşesinde ilköğretimden
              üniversiteye kadar gençleri kucaklayan programlar yürütüyoruz.
            </p>
            <p className="text-base leading-relaxed mb-10" style={{ color: C.body }}>
              Amacımız yalnızca bilgi aktarmak değil; güçlü karakter, derin inanç
              ve toplumsal sorumluluk taşıyan nesiller yetiştirmektir.
            </p>
            <a href="#faaliyetler"
              className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3"
              style={{ color: C.green }}>
              Faaliyetlerimizi İnceleyin
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          {/* Sağ — numaralı liste */}
          <div className="border-t" style={{ borderColor: C.borderLight }}>
            {items.map(it => (
              <div key={it.n} className="flex items-start gap-5 py-6 border-b" style={{ borderColor: C.borderLight }}>
                <span className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                  style={{ background: "#E8F5EE", color: C.green }}>
                  {it.n}
                </span>
                <div>
                  <p className="font-bold text-[15px] mb-1.5" style={{ color: C.heading }}>{it.t}</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.body }}>{it.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   FAALİYETLER
════════════════════════════════════════ */
function Faaliyetler() {
  const birimler = [
    { n: "01", t: "İlköğretim Birimi",  r: C.green,       d: "Elif-Ba'dan Kur'an-ı Kerim'e uzanan yolda çocuklara haftalık dini eğitim kursları. Deneyimli eğitmenler, sistematik program." },
    { n: "02", t: "Lise Birimi",        r: "#0369A1",     d: "Sabah namazı buluşmaları, ilim dersleri ve kafile programları. Lise öğrencilerinin ruhî ve ilmî gelişimine odaklanır." },
    { n: "03", t: "Üniversite Birimi",  r: "#5B21B6",     d: "KYK buluşmaları, dergah programları, ilim halkaları. Üniversite gençliğine derinlikli topluluk ve bilgi ortamı." },
    { n: "04", t: "Barınma Hizmetleri", r: "#B45309",     d: "Öğrenci evleri, apart ve yurtlarda şeffaf yönetim. Güvenli, değerli ve takip edilen barınma ortamları." },
  ];

  const ek = [
    "Sabah Namazı Buluşmaları",
    "Kafile Programları",
    "Sosyal Faaliyetler",
    "Nezir Burs Programı",
    "KYK Buluşmaları",
    "Eğitim Materyalleri",
  ];

  return (
    <section id="faaliyetler" style={{ background: C.light }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        {/* Başlık */}
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: C.green }}>
            Faaliyetlerimiz
          </p>
          <h2 className="font-black leading-[1.08] mb-4"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", color: C.heading, letterSpacing: "-0.025em" }}>
            Geniş Bir Hizmet Yelpazesi
          </h2>
          <p className="text-base leading-relaxed" style={{ color: C.body }}>
            İlköğretimden üniversiteye, barınmadan burs programlarına kadar gençliğin
            her alanında sistematik ve kararlı bir hizmet anlayışı.
          </p>
        </div>

        {/* 2×2 grid — beyaz kartlar, kenarlık tabanlı */}
        <div className="grid sm:grid-cols-2 gap-px mb-px" style={{ background: C.border }}>
          {birimler.map(b => (
            <div key={b.n} className="p-8 lg:p-10 flex flex-col" style={{ background: C.white }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: b.r }}>{b.n}</span>
                <span className="flex-1 h-px" style={{ background: b.r + "30" }} />
              </div>
              <h3 className="font-black text-[1.15rem] mb-3" style={{ color: C.heading, letterSpacing: "-0.01em" }}>
                {b.t}
              </h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: C.body }}>{b.d}</p>
              <div className="w-8 h-[3px] rounded-sm mt-6" style={{ background: b.r }} />
            </div>
          ))}
        </div>

        {/* Ek faaliyetler */}
        <div className="mt-10 flex flex-wrap gap-2.5">
          {ek.map(e => (
            <span key={e}
              className="px-4 py-2 text-sm font-medium rounded-md border"
              style={{ background: C.white, borderColor: C.border, color: C.sub }}>
              {e}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   PROJELER
════════════════════════════════════════ */
function Projeler() {
  const projeler = [
    { n: "01", t: "Faaliyet Takip Sistemi",  d: "81 ilde tüm faaliyetlerin anlık takibi, hedef yönetimi ve raporlama.",       r: "#0369A1", durum: "Aktif"        },
    { n: "02", t: "Nesil Yetiştirilmesi",    d: "İlköğretimden üniversiteye sistematik eğitim — Türkiye geneli kapsam.",       r: C.green,   durum: "Devam Ediyor" },
    { n: "03", t: "Öğrenci Barınma Ağı",     d: "Üniversite öğrencileri için değer odaklı güvenli barınma ortamları.",         r: "#5B21B6", durum: "Devam Ediyor" },
    { n: "04", t: "Nezir Burs Programı",     d: "İhtiyaç sahibi öğrencilere burs desteği ile eğitimde fırsat eşitliği.",      r: C.goldDark, durum: "Devam Ediyor" },
  ];

  return (
    <section id="projeler" style={{ background: C.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: C.green }}>
            Projelerimiz
          </p>
          <h2 className="font-black leading-[1.08]"
            style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", color: C.heading, letterSpacing: "-0.025em" }}>
            Uzun Vadeli Projeler
          </h2>
        </div>

        {/* Tablo tarzı liste */}
        <div className="border-t" style={{ borderColor: C.borderLight }}>
          {projeler.map((p, i) => (
            <div key={p.n}
              className="grid grid-cols-12 gap-4 py-7 items-start border-b px-1 hover:bg-slate-50 transition"
              style={{ borderColor: C.borderLight }}>
              <div className="col-span-1 hidden sm:flex">
                <span className="text-xs font-black" style={{ color: C.border }}>{p.n}</span>
              </div>
              <div className="col-span-12 sm:col-span-4 lg:col-span-3">
                <p className="font-bold text-[15px]" style={{ color: C.heading }}>{p.t}</p>
              </div>
              <div className="col-span-12 sm:col-span-5 lg:col-span-6">
                <p className="text-sm leading-relaxed" style={{ color: C.body }}>{p.d}</p>
              </div>
              <div className="col-span-12 sm:col-span-2 flex sm:justify-end">
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded"
                  style={{ background: p.r + "18", color: p.r }}>
                  {p.durum}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   GÖNÜLLÜ CTA
════════════════════════════════════════ */
function Cta() {
  return (
    <section id="gonullu" style={{ background: C.greenDeep }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-[2px]" style={{ background: C.gold }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.gold }}>Katılım</span>
            </div>
            <h2 className="font-black leading-[1.06] mb-6"
              style={{ fontSize: "clamp(2rem, 3.8vw, 3rem)", color: C.textOnDark, letterSpacing: "-0.025em" }}>
              Faaliyetlerimizden<br />Haberdar Olun.
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: C.subOnDark }}>
              Eğitim programları, gençlik çalışmaları ve faaliyet haberlerini
              takip etmek için gönüllü topluluğumuza katılabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-8 py-3 text-sm font-bold rounded-md transition hover:opacity-90"
                style={{ background: C.gold, color: "#1a0a00" }}>
                Gönüllü Ol
              </button>
              <a href="#iletisim"
                className="px-8 py-3 text-sm font-semibold rounded-md border transition hover:opacity-80"
                style={{ color: C.subOnDark, borderColor: "rgba(255,255,255,0.22)" }}>
                İletişime Geç
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="space-y-3">
              {[
                "Türkiye genelinde 81 ilde aktif yapılanma",
                "Haftalık dini eğitim kursları",
                "Sabah namazı buluşmaları ve kafile programları",
                "Öğrenci barınma ve burs desteği",
              ].map(m => (
                <div key={m} className="flex items-start gap-3 px-5 py-4 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <svg className="mt-0.5 flex-shrink-0" width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2.5 8l4 4 7-7" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium" style={{ color: C.subOnDark }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   BAĞIŞ
════════════════════════════════════════ */
function Bagis() {
  return (
    <section id="bagis" style={{ background: C.light }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: C.goldDark }}>Destek Ol</p>
            <h2 className="font-black leading-[1.08] mb-4"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: C.heading, letterSpacing: "-0.025em" }}>
              Geleceğe Yatırım Yapın
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: C.body }}>
              Bağışlarınız öğrenci bursları, dergah faaliyetleri ve eğitim
              programlarının sürdürülmesine doğrudan katkı sağlar.
            </p>
            <button
              className="px-8 py-3 text-sm font-bold rounded-md text-white transition hover:opacity-90"
              style={{ background: C.green }}>
              Bağış Yap
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Öğrenci Bursu",    s: "Eğitime kesintisiz devam"       },
              { l: "Dergah Desteği",   s: "Faaliyetlerin sürdürülmesi"     },
              { l: "Kafile Programı",  s: "Manevi seyahat desteği"         },
              { l: "Kitap & Materyal", s: "Eğitim kaynaklarının temini"    },
            ].map(b => (
              <div key={b.l} className="p-5 rounded-md border"
                style={{ background: C.white, borderColor: C.borderLight }}>
                <p className="font-bold text-[14px] mb-1" style={{ color: C.heading }}>{b.l}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.body }}>{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   FOOTER
════════════════════════════════════════ */
function Footer() {
  return (
    <footer id="iletisim" style={{ background: C.footerBg }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Marka */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <img src="/logo.svg" alt="" className="w-5 h-5 brightness-0 invert opacity-60" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#D1E8D8" }}>Serhendi Gençlik</p>
                <p className="text-[11px]" style={{ color: C.footerSub }}>Serhendi Vakfı Eğitim Birimi</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: C.footerText }}>
              İlim, ahlâk ve hizmet yolunda yürüyen Serhendi Gençlik, Türkiye'nin
              dört bir yanında nesil yetiştirme misyonunu sürdürmektedir.
            </p>
          </div>

          {/* Hızlı linkler */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "#D1E8D8" }}>Erişim</p>
            <div className="space-y-3">
              {[
                { href: "#hakkimizda",  l: "Hakkımızda"      },
                { href: "#faaliyetler", l: "Faaliyetlerimiz"  },
                { href: "#projeler",    l: "Projelerimiz"     },
                { href: "#gonullu",     l: "Gönüllü Ol"       },
                { href: "#bagis",       l: "Bağış Yap"        },
                { href: "/giris",       l: "Görevli Girişi"   },
              ].map(x => (
                <a key={x.l} href={x.href}
                  className="block text-sm transition hover:text-white"
                  style={{ color: C.footerText }}>{x.l}</a>
              ))}
            </div>
          </div>

          {/* İletişim */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-5" style={{ color: "#D1E8D8" }}>İletişim</p>
            <div className="space-y-4">
              {[
                { icon: "✉", text: "iletisim@serhendi.com" },
                { icon: "◎", text: "Türkiye Geneli · 81 İl" },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-sm flex-shrink-0 mt-px" style={{ color: C.gold }}>{c.icon}</span>
                  <span className="text-sm" style={{ color: C.footerText }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: `1px solid rgba(255,255,255,0.07)` }}>
          <p className="text-xs" style={{ color: C.footerSub }}>
            © {new Date().getFullYear()} Serhendi Vakfı Eğitim Birimi. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-5">
            {["Gizlilik", "Kullanım Şartları"].map(l => (
              <a key={l} href="#" className="text-xs transition hover:text-white" style={{ color: C.footerSub }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════
   EXPORT
════════════════════════════════════════ */
export function HomePage() {
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <Nav />
      <Hero />
      <Hakkimizda />
      <Faaliyetler />
      <Projeler />
      <Cta />
      <Bagis />
      <Footer />
    </div>
  );
}
