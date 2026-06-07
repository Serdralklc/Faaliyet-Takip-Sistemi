"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ─── Renkler ─── */
const G   = "#006B3F";   // Serhendi Yeşili
const GD  = "#004D2D";   // Koyu yeşil
const GO  = "#005030";   // Orta yeşil
const GOLD = "#C9A227";  // Altın
const GOLDB = "#A8881F"; // Koyu altın
const INK  = "#0D1A10";  // Neredeyse siyah, yeşil tonlu
const DARK = "#111827";
const MID  = "#374151";
const MUTED = "#6B7280";
const LIGHT = "#F5F7F5";
const BORDER = "#D1D8D3";

/* ════════════════════════════════════════
   NAV
════════════════════════════════════════ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const links = [
    { href: "#hakkimizda",  label: "Hakkımızda"      },
    { href: "#faaliyetler", label: "Faaliyetler"      },
    { href: "#projeler",    label: "Projeler"         },
    { href: "#iletisim",    label: "İletişim"         },
  ];

  const navBg  = scrolled ? "rgba(255,255,255,0.96)" : "transparent";
  const shadow = scrolled ? "0 1px 0 rgba(0,0,0,0.08)" : "none";
  const linkColor = scrolled ? MID : "rgba(255,255,255,0.88)";

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{ background: navBg, boxShadow: shadow, backdropFilter: scrolled ? "blur(16px)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: scrolled ? "#E8F5EE" : "rgba(255,255,255,0.15)", border: `1px solid ${scrolled ? "#B8DCC8" : "rgba(255,255,255,0.25)"}` }}>
              <img src="/logo.svg" alt="Serhendi" className="w-5 h-5" />
            </div>
            <span className="font-bold text-[15px] tracking-tight"
              style={{ color: scrolled ? INK : "#fff" }}>
              Serhendi Gençlik
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="px-3.5 py-2 text-[13.5px] font-medium rounded-md transition hover:opacity-100"
                style={{ color: linkColor, opacity: 0.85 }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-3" ref={loginRef}>
            <a href="#bagis"
              className="px-4 py-2 text-[13.5px] font-semibold rounded-md transition border"
              style={{ borderColor: scrolled ? BORDER : "rgba(255,255,255,0.3)", color: scrolled ? MID : "rgba(255,255,255,0.85)" }}>
              Bağış Yap
            </a>
            <div className="relative">
              <button onClick={() => setLoginOpen(v => !v)}
                className="px-5 py-2 text-[13.5px] font-bold rounded-md text-white flex items-center gap-1.5 transition"
                style={{ background: G }}>
                Oturum Aç
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d={loginOpen ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {loginOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[260px] rounded-xl border overflow-hidden shadow-xl"
                  style={{ background: "#fff", borderColor: BORDER }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUTED }}>Giriş Türü Seçin</p>
                  </div>
                  <Link href="/giris" onClick={() => setLoginOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#E8F5EE" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: INK }}>Görevli Girişi</p>
                      <p className="text-xs" style={{ color: MUTED }}>İl / Bölge / Yönetici</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 px-4 py-3.5 opacity-50 cursor-not-allowed border-t" style={{ borderColor: "#F3F4F6" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#FEF3C7" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: INK }}>Gönüllü Girişi</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>Yakında</span>
                      </div>
                      <p className="text-xs" style={{ color: MUTED }}>Gönüllü katılımcılar</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 rounded-md" onClick={() => setMenuOpen(v => !v)}
            style={{ color: scrolled ? INK : "#fff" }}>
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            }
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden border-t px-6 py-5 space-y-1" style={{ background: "#fff", borderColor: BORDER }}>
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block py-3 text-sm font-medium border-b" style={{ color: MID, borderColor: "#F3F4F6" }}>
                {l.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <Link href="/giris" className="py-3 text-center text-sm font-bold rounded-md text-white" style={{ background: G }}>
                Görevli Girişi
              </Link>
              <a href="#bagis" className="py-3 text-center text-sm font-semibold rounded-md border" style={{ borderColor: BORDER, color: MID }}>
                Bağış Yap
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

/* ════════════════════════════════════════
   HERO — sol içerik / sağ görsel
════════════════════════════════════════ */
function Hero() {
  const stats = [
    { n: "81",   l: "İl"              },
    { n: "500+", l: "Aktif Gönüllü"  },
    { n: "12+",  l: "Yıl"            },
  ];

  return (
    <section style={{ background: GD, minHeight: "100vh" }}
      className="flex items-center pt-[68px]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full py-16 lg:py-0 lg:min-h-[calc(100vh-68px)] flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Sol: metin */}
          <div>
            {/* Üst etiket */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-5 h-[2px] rounded" style={{ background: GOLD }} />
              <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
                Serhendi Vakfı Eğitim Birimi
              </span>
            </div>

            {/* Ana başlık */}
            <h1 className="font-black leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", color: "#fff", letterSpacing: "-0.02em" }}>
              İlim, Ahlâk<br />
              ve Hizmet<br />
              <span style={{ color: GOLD }}>Yolunda.</span>
            </h1>

            {/* Alt açıklama */}
            <p className="text-base lg:text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: "rgba(255,255,255,0.62)", fontWeight: 400 }}>
              Türkiye'nin 81 ilinde ilköğretimden üniversiteye kadar her
              kademedeki gencin ilmî, ahlâkî ve manevî gelişimine katkı
              sağlıyoruz.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 mb-14">
              <a href="#hakkimizda"
                className="px-7 py-3 text-sm font-bold text-white rounded-md transition hover:opacity-90"
                style={{ background: G, border: `1px solid ${G}` }}>
                Hakkımızda
              </a>
              <a href="#faaliyetler"
                className="px-7 py-3 text-sm font-bold rounded-md transition hover:opacity-80"
                style={{ background: "transparent", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.22)" }}>
                Faaliyetlerimiz
              </a>
            </div>

            {/* İstatistikler — yatay çizgi */}
            <div className="flex items-center gap-10 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <p className="text-3xl font-black" style={{ color: "#fff", letterSpacing: "-0.03em" }}>{s.n}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: görsel alanı */}
          <div className="relative hidden lg:block">
            {/* Placeholder — gerçek fotoğraf için */}
            <div className="relative rounded-lg overflow-hidden"
              style={{ aspectRatio: "4/5", background: GO, border: `1px solid rgba(255,255,255,0.07)` }}>

              {/* Görsel yok ise içerik */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-10 text-center">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <img src="/logo.svg" alt="" className="w-10 h-10 opacity-70" />
                </div>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Faaliyet Fotoğrafı
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
                  public/ klasörüne eklenecek
                </p>
              </div>

              {/* Altta bilgi kartı overlay */}
              <div className="absolute bottom-5 left-5 right-5 rounded-lg px-5 py-4"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: GOLD }} />
                  <p className="text-sm font-semibold text-white">2024–2025 Faaliyet Dönemi</p>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Türkiye genelinde 81 ilde eş zamanlı faaliyetler
                </p>
              </div>
            </div>

            {/* Altın çerçeve süsleme */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-lg -z-10"
              style={{ background: GOLD, opacity: 0.18 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   HAKKIMIZDA — editorial
════════════════════════════════════════ */
function Hakkimizda() {
  const items = [
    { title: "Kuran-ı Kerim Eğitimi",      desc: "Elif-Ba'dan başlayarak her seviyede nitelikli dini eğitim." },
    { title: "İlim Halkaları",              desc: "Lise ve üniversite öğrencilerine yönelik haftalık ders programları." },
    { title: "Kafile & Sosyal Programlar",  desc: "Manevi seyahatler ve gençleri buluşturan sosyal etkinlikler." },
    { title: "Barınma Desteği",             desc: "Üniversite öğrencileri için güvenli, değerli barınma ortamları." },
  ];

  return (
    <section id="hakkimizda" style={{ background: "#fff" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="grid lg:grid-cols-2 gap-20 items-start">

          {/* Sol: büyük statement */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-6" style={{ color: G }}>
              Hakkımızda
            </p>
            <h2 className="font-black leading-[1.08] mb-8"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: INK, letterSpacing: "-0.02em" }}>
              Gençliğe Değer,<br />Geleceğe Yatırım
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: MID }}>
              Serhendi Vakfı çatısı altında faaliyet gösteren Gençlik Eğitim Birimi
              olarak 12 yılı aşkın tecrübemizle Türkiye'nin her köşesinde
              ilköğretimden üniversiteye kadar gençleri kucaklayan programlar yürütüyoruz.
            </p>
            <p className="text-base leading-relaxed mb-10" style={{ color: MUTED }}>
              Amacımız yalnızca bilgi aktarmak değil; güçlü karakter, derin inanç
              ve toplumsal sorumluluk taşıyan nesiller yetiştirmektir.
            </p>
            <a href="#faaliyetler"
              className="inline-flex items-center gap-2 text-sm font-bold transition"
              style={{ color: G }}>
              Faaliyetlerimizi İnceleyin
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          {/* Sağ: madde listesi */}
          <div className="space-y-0 divide-y" style={{ borderColor: BORDER }}>
            {items.map((it, i) => (
              <div key={i} className="flex items-start gap-5 py-6">
                <span className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black"
                  style={{ background: "#E8F5EE", color: G }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-bold text-[15px] mb-1" style={{ color: INK }}>{it.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{it.desc}</p>
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
   FAALİYETLER — büyük, editöryel grid
════════════════════════════════════════ */
function Faaliyetler() {
  const birimler = [
    {
      kodu: "01",
      baslik: "İlköğretim Birimi",
      aciklama: "Elif-Ba'dan Kur'an-ı Kerim'e uzanan yolda çocuklara nitelikli dini eğitim sunuyoruz. Hafta sonu kursları, deneyimli eğitmenler.",
      renk: G,
    },
    {
      kodu: "02",
      baslik: "Lise Birimi",
      aciklama: "Lise öğrencileri için ilim dersleri, sabah namazı buluşmaları ve kafile programları ile ruhî ve ilmî gelişim.",
      renk: "#0369A1",
    },
    {
      kodu: "03",
      baslik: "Üniversite Birimi",
      aciklama: "KYK buluşmaları, dergah programları, ilim halkaları ile üniversite gençliğine derinlikli bir topluluk deneyimi.",
      renk: "#5B21B6",
    },
    {
      kodu: "04",
      baslik: "Barınma Hizmetleri",
      aciklama: "Öğrenci evleri, apart ve yurtlarda güvenli, değerli ve şeffaf yönetilen barınma ortamları.",
      renk: "#B45309",
    },
  ];

  const ek = [
    { icon: "🌙", label: "Sabah Namazı Buluşmaları" },
    { icon: "🚌", label: "Kafile Programları"        },
    { icon: "🤝", label: "Sosyal Faaliyetler"        },
    { icon: "📚", label: "Eğitim Programları"        },
    { icon: "🌿", label: "Nezir Burs Desteği"        },
    { icon: "🏛️", label: "KYK Buluşmaları"           },
  ];

  return (
    <section id="faaliyetler" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        {/* Başlık */}
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: G }}>Faaliyetlerimiz</p>
          <h2 className="font-black leading-[1.08] mb-4"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", color: INK, letterSpacing: "-0.02em" }}>
            Geniş Bir Hizmet Yelpazesi
          </h2>
          <p className="text-base leading-relaxed" style={{ color: MUTED }}>
            İlköğretimden üniversiteye, barınmadan burs programlarına kadar gençliğin
            her alanında sistematik ve kararlı bir hizmet anlayışı.
          </p>
        </div>

        {/* Ana 4 birim — 2×2 grid */}
        <div className="grid sm:grid-cols-2 gap-px mb-px" style={{ background: BORDER }}>
          {birimler.map(b => (
            <div key={b.kodu} className="p-8 lg:p-10 flex flex-col gap-5" style={{ background: "#fff" }}>
              <div className="flex items-start justify-between">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: b.renk }}>{b.kodu}</span>
              </div>
              <div>
                <h3 className="font-black text-[1.25rem] mb-3 leading-tight" style={{ color: INK }}>{b.baslik}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{b.aciklama}</p>
              </div>
              <div className="w-8 h-[3px] rounded-sm mt-auto" style={{ background: b.renk }} />
            </div>
          ))}
        </div>

        {/* Ek faaliyetler — yatay liste */}
        <div className="mt-12 flex flex-wrap gap-3">
          {ek.map(e => (
            <div key={e.label}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border"
              style={{ background: "#fff", borderColor: BORDER, color: MID }}>
              <span>{e.icon}</span>
              {e.label}
            </div>
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
    {
      no: "01",
      durum: "Aktif",
      baslik: "Faaliyet Takip Sistemi",
      aciklama: "81 ilde tüm faaliyetlerin anlık takibi, hedef yönetimi ve raporlama platformu.",
      renk: "#0369A1",
    },
    {
      no: "02",
      durum: "Devam Ediyor",
      baslik: "Nesil Yetiştirilmesi",
      aciklama: "İlköğretimden üniversiteye sistemli eğitim programı — Türkiye geneli kapsam.",
      renk: G,
    },
    {
      no: "03",
      durum: "Devam Ediyor",
      baslik: "Öğrenci Barınma Ağı",
      aciklama: "Üniversite öğrencileri için sağlıklı, güvenli ve değer odaklı barınma ortamları.",
      renk: "#5B21B6",
    },
    {
      no: "04",
      durum: "Devam Ediyor",
      baslik: "Nezir Burs Programı",
      aciklama: "İhtiyaç sahibi öğrencilere verilen burs desteği ile eğitimde fırsat eşitliği.",
      renk: GOLDB,
    },
  ];

  return (
    <section id="projeler" style={{ background: "#fff" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: G }}>Projelerimiz</p>
          <h2 className="font-black leading-[1.08]"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", color: INK, letterSpacing: "-0.02em" }}>
            Uzun Vadeli Projeler
          </h2>
        </div>

        {/* Tablo tarzı liste */}
        <div className="divide-y border-t border-b" style={{ borderColor: BORDER }}>
          {projeler.map(p => (
            <div key={p.no} className="grid grid-cols-12 gap-6 py-7 items-center group hover:bg-gray-50 transition px-1">
              <div className="col-span-1 hidden sm:block">
                <span className="text-xs font-black" style={{ color: BORDER }}>{p.no}</span>
              </div>
              <div className="col-span-12 sm:col-span-3">
                <h3 className="font-bold text-[15px]" style={{ color: INK }}>{p.baslik}</h3>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{p.aciklama}</p>
              </div>
              <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-end">
                <span className="text-xs font-bold px-2.5 py-1 rounded"
                  style={{ background: p.renk + "14", color: p.renk }}>
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
   GÖNÜLLÜ CTA — sade, güçlü
════════════════════════════════════════ */
function Cta() {
  return (
    <section id="gonullu" style={{ background: GD }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-8 h-[2px]" style={{ background: GOLD }} />
            <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>Katılım</span>
          </div>
          <h2 className="font-black leading-[1.05] mb-6 text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.02em" }}>
            Faaliyetlerimizden<br />Haberdar Olun.
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.55)" }}>
            Eğitim programları, gençlik çalışmaları ve faaliyet haberlerimizi
            takip etmek için gönüllü topluluğumuza katılabilirsiniz.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-3 text-sm font-bold rounded-md transition hover:opacity-90"
              style={{ background: GOLD, color: "#1a0a00" }}>
              Gönüllü Ol
            </button>
            <a href="#iletisim"
              className="px-8 py-3 text-sm font-bold rounded-md transition"
              style={{ background: "transparent", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.18)" }}>
              İletişime Geç
            </a>
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
    <section id="bagis" style={{ background: LIGHT }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-4" style={{ color: GOLDB }}>Destek</p>
            <h2 className="font-black leading-[1.08] mb-4"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: INK, letterSpacing: "-0.02em" }}>
              Geleceğe Yatırım Yapın
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: MUTED }}>
              Bağışlarınız öğrenci bursları, dergah faaliyetleri ve eğitim
              programlarının sürdürülmesine doğrudan katkı sağlar.
            </p>
            <button className="px-8 py-3 text-sm font-bold rounded-md text-white transition hover:opacity-90"
              style={{ background: G }}>
              Bağış Yap
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Öğrenci Bursu",      sub: "Eğitime devam için"        },
              { label: "Dergah Desteği",     sub: "Faaliyet sürdürülebilirliği" },
              { label: "Kafile Programı",    sub: "Manevi seyahat desteği"    },
              { label: "Kitap & Materyal",   sub: "Eğitim kaynakları"         },
            ].map(b => (
              <div key={b.label} className="p-5 rounded-lg border" style={{ background: "#fff", borderColor: BORDER }}>
                <p className="font-bold text-sm mb-1" style={{ color: INK }}>{b.label}</p>
                <p className="text-xs" style={{ color: MUTED }}>{b.sub}</p>
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
  const year = new Date().getFullYear();
  return (
    <footer id="iletisim" style={{ background: INK }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">

          {/* Marka */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <img src="/logo.svg" alt="" className="w-5 h-5 opacity-80" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Serhendi Gençlik</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Serhendi Vakfı Eğitim Birimi</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
              İlim, ahlâk ve hizmet yolunda yürüyen Serhendi Gençlik, Türkiye'nin
              dört bir yanında nesil yetiştirme misyonunu sürdürmektedir.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
              ].map(s => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={s.path}/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Hızlı linkler */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] mb-5 text-white">Erişim</p>
            <div className="space-y-3">
              {[
                { href: "#hakkimizda",  label: "Hakkımızda"     },
                { href: "#faaliyetler", label: "Faaliyetlerimiz" },
                { href: "#projeler",    label: "Projelerimiz"    },
                { href: "#gonullu",     label: "Gönüllü Ol"      },
                { href: "#bagis",       label: "Bağış Yap"       },
                { href: "/giris",       label: "Görevli Girişi"  },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="block text-sm transition hover:text-white"
                  style={{ color: "rgba(255,255,255,0.42)" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* İletişim */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] mb-5 text-white">İletişim</p>
            <div className="space-y-3">
              {[
                { icon: "✉", text: "iletisim@serhendi.com" },
                { icon: "⌖", text: "Türkiye Geneli · 81 İl" },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-sm mt-px flex-shrink-0" style={{ color: GOLD }}>{c.icon}</span>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alt çizgi */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            © {year} Serhendi Vakfı Eğitim Birimi. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-5">
            {["Gizlilik", "Kullanım Şartları"].map(l => (
              <a key={l} href="#" className="text-xs transition hover:text-white"
                style={{ color: "rgba(255,255,255,0.22)" }}>{l}</a>
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
