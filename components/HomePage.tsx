"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#anasayfa",    label: "Ana Sayfa"      },
    { href: "#hakkimizda",  label: "Hakkımızda"     },
    { href: "#faaliyetler", label: "Faaliyetlerimiz" },
    { href: "#projeler",    label: "Projelerimiz"   },
    { href: "#iletisim",    label: "İletişim"       },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 24px rgba(0,107,63,0.10)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,107,63,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#anasayfa" className="flex items-center gap-3 group">
          <img src="/logo.svg" alt="Serhendi" className="w-9 h-9" />
          <div>
            <p className="text-sm font-bold leading-tight"
              style={{ color: scrolled ? "#006B3F" : "#fff" }}>
              Serhendi Gençlik
            </p>
            <p className="text-[10px] leading-tight"
              style={{ color: scrolled ? "#6B7280" : "rgba(255,255,255,0.7)" }}>
              Serhendi Vakfı Eğitim Birimi
            </p>
          </div>
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-white/10"
              style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.9)" }}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop right buttons */}
        <div className="hidden lg:flex items-center gap-3 relative">
          <a href="#bagis"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition border"
            style={{
              borderColor: scrolled ? "#D9BC4B" : "rgba(217,188,75,0.7)",
              color: scrolled ? "#92700A" : "#D9BC4B",
              background: scrolled ? "rgba(217,188,75,0.08)" : "transparent",
            }}>
            Bağış Yap
          </a>
          <button
            onClick={() => setLoginOpen(!loginOpen)}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition shadow"
            style={{ background: "linear-gradient(135deg, #006B3F, #008C4F)" }}>
            Oturum Aç
          </button>

          {/* Login dropdown */}
          {loginOpen && (
            <div
              className="absolute top-12 right-0 w-72 rounded-2xl border shadow-xl p-4 z-50"
              style={{ background: "#fff", borderColor: "#E2EBE7" }}
            >
              {/* Görevli Girişi */}
              <Link href="/giris" onClick={() => setLoginOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-green-50 transition group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#E8F5EE" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006B3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Görevli Girişi</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>İl / Bölge Sorumlusu ve Yöneticiler</p>
                </div>
              </Link>

              <div className="my-2 border-t" style={{ borderColor: "#F0F0F0" }} />

              {/* Gönüllü Girişi */}
              <div className="flex items-start gap-3 p-3 rounded-xl cursor-not-allowed opacity-60 select-none">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FFF7ED" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Gönüllü Girişi</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Gönüllü katılımcı sistemi</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#FEF3C7", color: "#92400E" }}>Yakında</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: scrolled ? "#1F2937" : "#fff" }}>
          {mobileOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t px-4 py-4 space-y-1"
          style={{ background: "#fff", borderColor: "#E2EBE7" }}>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium"
              style={{ color: "#374151" }}>
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <a href="#bagis"
              className="text-center px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#D9BC4B", color: "#92700A" }}>
              Bağış Yap
            </a>
            <Link href="/giris"
              className="text-center px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "#006B3F" }}>
              Görevli Girişi
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO
═══════════════════════════════════════════ */
function Hero() {
  return (
    <section id="anasayfa" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient arka plan */}
      <div className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #003D24 0%, #006B3F 45%, #00944F 70%, #004D2D 100%)",
        }} />

      {/* Dekoratif daireler */}
      <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #D9BC4B, transparent)" }} />
      <div className="absolute bottom-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full opacity-8"
        style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
      <div className="absolute top-1/3 left-[10%] w-[200px] h-[200px] rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #D9BC4B, transparent)" }} />

      {/* İçerik */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <img src="/logo.svg" alt="Serhendi Gençlik" className="w-14 h-14" />
          </div>
        </div>

        {/* Etiket */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(217,188,75,0.15)", border: "1px solid rgba(217,188,75,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D9BC4B" }} />
          <span className="text-xs font-semibold" style={{ color: "#D9BC4B" }}>Serhendi Vakfı Eğitim Birimi</span>
        </div>

        {/* Başlık */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
          İlim, Ahlâk ve Hizmet{" "}
          <span style={{ color: "#D9BC4B" }}>Yolunda</span>
          <br />Bir Gençlik
        </h1>

        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.80)" }}>
          Serhendi Gençlik olarak ilköğretimden üniversiteye kadar her kademedeki
          gencin ilmî, ahlâkî ve manevî gelişimine katkı sağlıyoruz.
        </p>

        {/* CTA butonları */}
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#hakkimizda"
            className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition shadow-lg hover:scale-105"
            style={{ background: "linear-gradient(135deg, #D9BC4B, #C8A830)", color: "#1a0a00" }}>
            Daha Fazla Bilgi
          </a>
          <a href="#faaliyetler"
            className="px-8 py-3.5 rounded-2xl text-sm font-bold transition hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
            Faaliyetlerimiz
          </a>
        </div>

        {/* İstatistik çubukları */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { num: "81",   label: "İl"                  },
            { num: "500+", label: "Aktif Gönüllü"       },
            { num: "12+",  label: "Yıllık Tecrübe"      },
            { num: "10K+", label: "Öğrenciye Ulaşıldı"  },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <p className="text-2xl font-black" style={{ color: "#D9BC4B" }}>{s.num}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aşağı ok animasyonu */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HAKKIMIZDA
═══════════════════════════════════════════ */
function Hakkimizda() {
  const degerler = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006B3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      baslik: "İlmî Birikim",
      aciklama: "Kuran-ı Kerim öğretiminden ilim halkalarına kadar geniş bir eğitim yelpazesi sunuyoruz.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006B3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      baslik: "Topluluk Ruhu",
      aciklama: "Gençleri bir araya getirerek güçlü bağlar kuran, dayanışmayı esas alan bir yapı oluşturuyoruz.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006B3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      baslik: "Değer Odaklı",
      aciklama: "İslâmî ahlâk ve ulusal değerler çerçevesinde nesiller yetiştirmeyi hedefliyoruz.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006B3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      baslik: "Sürdürülebilir Hizmet",
      aciklama: "12 yılı aşkın tecrübemizle kesintisiz ve sistematik bir hizmet anlayışını sürdürüyoruz.",
    },
  ];

  return (
    <section id="hakkimizda" className="py-24" style={{ background: "#F7F8F4" }}>
      <div className="max-w-6xl mx-auto px-5">
        {/* Başlık */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-3"
            style={{ background: "#E8F5EE", color: "#006B3F" }}>Hakkımızda</span>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "#1F2937" }}>
            Serhendi Gençlik Kimdir?
          </h2>
          <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: "#6B7280" }}>
            Serhendi Vakfı çatısı altında faaliyet gösteren Gençlik Eğitim Birimi olarak
            Türkiye'nin dört bir yanında ilköğretimden üniversiteye kadar her kademedeki
            genci kucaklayan kapsamlı programlar yürütüyoruz.
          </p>
        </div>

        {/* 2 kolon: metin + değerler */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
          <div>
            <h3 className="text-xl font-black mb-4" style={{ color: "#1F2937" }}>Misyonumuz</h3>
            <p className="leading-relaxed mb-4" style={{ color: "#4B5563" }}>
              Gençlerimize Kur'an-ı Kerim'i, İslâm'ın temel ilkelerini ve tarihimizin
              derin köklerini öğretirken aynı zamanda modern dünyada ayakları yere basan,
              özgüvenli ve değer sahibi bireyler yetiştirmeyi misyon ediniyoruz.
            </p>
            <p className="leading-relaxed mb-6" style={{ color: "#4B5563" }}>
              Dergah ve şubelerimizde yürütülen haftalık dersler, kafile programları,
              KYK buluşmaları ve sosyal faaliyetlerle gençlerin hem ruhî hem de akademik
              gelişimine katkı sağlıyoruz.
            </p>
            <div className="flex flex-col gap-3">
              {["Türkiye genelinde 81 ilde aktif yapılanma", "Nitelikli eğitmen kadrosu ile hafta sonu kursları", "Üniversite öğrencilerine özel barınma ve burs desteği"].map(m => (
                <div key={m} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#E8F5EE" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#006B3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  <span className="text-sm" style={{ color: "#4B5563" }}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Değerler grid */}
          <div className="grid grid-cols-2 gap-4">
            {degerler.map(d => (
              <div key={d.baslik} className="rounded-2xl p-5 border transition hover:-translate-y-1 duration-200"
                style={{ background: "#fff", borderColor: "#E2EBE7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "#E8F5EE" }}>
                  {d.icon}
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: "#1F2937" }}>{d.baslik}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{d.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FAALİYETLER
═══════════════════════════════════════════ */
function Faaliyetler() {
  const faaliyetler = [
    {
      icon: "📖",
      renk: "#006B3F",
      bg: "#E8F5EE",
      baslik: "İlköğretim Çalışmaları",
      aciklama: "Elif ba'dan Kur'an-ı Kerim'e uzanan yolda çocuklara nitelikli dini eğitim sunuyoruz.",
    },
    {
      icon: "🏫",
      renk: "#0369A1",
      bg: "#E0F2FE",
      baslik: "Lise Çalışmaları",
      aciklama: "Lise öğrencilerine yönelik ilim dersleri, sabah namazı buluşmaları ve kafile programları.",
    },
    {
      icon: "🎓",
      renk: "#7C3AED",
      bg: "#EDE9FE",
      baslik: "Üniversite Çalışmaları",
      aciklama: "Üniversite gençliğine özel KYK buluşmaları, dergah programları ve ilim halkaları.",
    },
    {
      icon: "🏠",
      renk: "#B45309",
      bg: "#FEF3C7",
      baslik: "Barınma Hizmetleri",
      aciklama: "Öğrenci evleri, apart ve yurtlarda şeffaf kayıt ve takip sistemi ile kaliteli barınma.",
    },
    {
      icon: "🌙",
      renk: "#0E7490",
      bg: "#CFFAFE",
      baslik: "Sabah Namazı Buluşmaları",
      aciklama: "Camii merkezli sabah namazı buluşmaları ile gençler arasında güçlü bağlar inşa ediyoruz.",
    },
    {
      icon: "🚌",
      renk: "#BE185D",
      bg: "#FCE7F3",
      baslik: "Kafile Programları",
      aciklama: "Lise ve üniversite öğrencilerini bir araya getiren manevi seyahat ve ziyaret programları.",
    },
    {
      icon: "🤝",
      renk: "#15803D",
      bg: "#DCFCE7",
      baslik: "Sosyal Faaliyetler",
      aciklama: "Gençlerin toplumsal bilincini geliştiren sosyal sorumluluk ve dayanışma projeleri.",
    },
    {
      icon: "📚",
      renk: "#9D174D",
      bg: "#FFE4E6",
      baslik: "Eğitim Programları",
      aciklama: "Hafta sonu kursları ve ilim halkalarıyla kesintisiz eğitim fırsatları sunuyoruz.",
    },
  ];

  return (
    <section id="faaliyetler" className="py-24" style={{ background: "#fff" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-3"
            style={{ background: "#E8F5EE", color: "#006B3F" }}>Faaliyetlerimiz</span>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "#1F2937" }}>
            Geniş Yelpazeli Hizmet Alanlarımız
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "#6B7280" }}>
            İlköğretimden üniversiteye kadar her kademedeki gençlere ulaşan,
            kapsamlı ve sistematik bir hizmet anlayışıyla çalışıyoruz.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {faaliyetler.map(f => (
            <div key={f.baslik}
              className="rounded-2xl p-5 border transition hover:-translate-y-1 hover:shadow-lg duration-200 cursor-default"
              style={{ background: "#F7F8F4", borderColor: "#E2EBE7" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl"
                style={{ background: f.bg }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-sm mb-2" style={{ color: "#1F2937" }}>{f.baslik}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{f.aciklama}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PROJELER
═══════════════════════════════════════════ */
function Projeler() {
  const projeler = [
    {
      emoji: "🌱",
      renk: "#006B3F",
      bg: "linear-gradient(135deg, #E8F5EE, #C8E6D5)",
      baslik: "Nesil Yetiştirilmesi Projesi",
      durum: "Devam Ediyor",
      durumRenk: "#006B3F",
      durumBg: "#E8F5EE",
      aciklama: "Türkiye genelinde 81 ilde ilköğretimden üniversiteye kadar her kademedeki öğrenciyi kapsayan sistematik eğitim programı.",
    },
    {
      emoji: "🏡",
      renk: "#7C3AED",
      bg: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
      baslik: "Öğrenci Barınma Ağı",
      durum: "Devam Ediyor",
      durumRenk: "#7C3AED",
      durumBg: "#EDE9FE",
      aciklama: "Üniversite öğrencileri için sağlıklı, güvenli ve manevi açıdan destekleyici barınma ortamları oluşturma projesi.",
    },
    {
      emoji: "📱",
      renk: "#0369A1",
      bg: "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
      baslik: "Faaliyet Takip Sistemi",
      durum: "Aktif",
      durumRenk: "#0369A1",
      durumBg: "#E0F2FE",
      aciklama: "Tüm il ve bölgelerin faaliyet verilerini anlık olarak takip eden, raporlayan ve hedef yönetimi yapan dijital sistem.",
    },
    {
      emoji: "🤲",
      renk: "#B45309",
      bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      baslik: "Nezir Burs Programı",
      durum: "Devam Ediyor",
      durumRenk: "#B45309",
      durumBg: "#FEF3C7",
      aciklama: "İhtiyaç sahibi öğrencilere verilen burs desteği ile eğitimde fırsat eşitliği sağlama programı.",
    },
  ];

  return (
    <section id="projeler" className="py-24" style={{ background: "#F7F8F4" }}>
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-3"
            style={{ background: "#E8F5EE", color: "#006B3F" }}>Projelerimiz</span>
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "#1F2937" }}>
            Sürdürdüğümüz Projeler
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "#6B7280" }}>
            Gençliğin geleceğine yatırım yapan, etkisi nesiller boyu sürecek projeler geliştiriyoruz.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {projeler.map(p => (
            <div key={p.baslik}
              className="rounded-2xl border overflow-hidden transition hover:-translate-y-1 hover:shadow-lg duration-200"
              style={{ background: "#fff", borderColor: "#E2EBE7" }}>
              {/* Üst banner */}
              <div className="h-24 flex items-center justify-center text-5xl"
                style={{ background: p.bg }}>
                {p.emoji}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base" style={{ color: "#1F2937" }}>{p.baslik}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: p.durumBg, color: p.durumRenk }}>
                    {p.durum}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{p.aciklama}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   GÖNÜLLÜ CTA
═══════════════════════════════════════════ */
function GonulluCta() {
  return (
    <section id="gonullu" className="py-20"
      style={{ background: "linear-gradient(135deg, #003D24 0%, #006B3F 60%, #00884A 100%)" }}>
      <div className="max-w-3xl mx-auto px-5 text-center">
        <div className="inline-block text-5xl mb-6">🌿</div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Serhendi Gençlik Faaliyetlerinden<br />
          <span style={{ color: "#D9BC4B" }}>Haberdar Olmak İster Misiniz?</span>
        </h2>
        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
          Faaliyetlerimiz, eğitim programlarımız ve gençlik çalışmalarımız hakkında
          düzenli bilgi almak için gönüllü topluluğumuza katılabilirsiniz.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            className="px-8 py-3.5 rounded-2xl text-sm font-bold transition hover:scale-105 shadow-lg"
            style={{ background: "linear-gradient(135deg, #D9BC4B, #C8A830)", color: "#1a0a00" }}>
            Gönüllü Ol
          </button>
          <a href="#faaliyetler"
            className="px-8 py-3.5 rounded-2xl text-sm font-bold transition hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
            Faaliyetleri İncele
          </a>
        </div>
        <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.45)" }}>
          * Gönüllü katılım sistemi yakında aktif hale gelecektir.
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   BAĞIŞ
═══════════════════════════════════════════ */
function Bagis() {
  return (
    <section id="bagis" className="py-20" style={{ background: "#fff" }}>
      <div className="max-w-4xl mx-auto px-5">
        <div className="rounded-3xl p-8 sm:p-12 text-center border"
          style={{ background: "linear-gradient(135deg, #FBF5DC, #FEF3C7)", borderColor: "#FDE68A" }}>
          <div className="text-5xl mb-4">💛</div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "#78350F" }}>
            Geleceğe Yatırım Yapın
          </h2>
          <p className="text-base mb-6 max-w-xl mx-auto" style={{ color: "#92400E" }}>
            Bağışlarınız; öğrenci bursları, dergah faaliyetleri ve eğitim programlarının
            sürdürülmesine doğrudan katkı sağlar.
          </p>
          <button
            className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition hover:scale-105 shadow"
            style={{ background: "linear-gradient(135deg, #D9BC4B, #C8A830)", color: "#1a0a00" }}>
            Bağış Yap
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer id="iletisim" style={{ background: "#0D1F14" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Marka */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Serhendi" className="w-10 h-10" />
              <div>
                <p className="font-bold text-white">Serhendi Gençlik</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Serhendi Vakfı Eğitim Birimi</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
              İlim, ahlâk ve hizmet yolunda yürüyen Serhendi Gençlik,
              Türkiye'nin dört bir yanında nesil yetiştirme misyonunu sürdürmektedir.
            </p>
            {/* Sosyal medya */}
            <div className="flex gap-3">
              {[
                {
                  label: "Twitter/X", href: "#",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                },
                {
                  label: "Instagram", href: "#",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                },
                {
                  label: "YouTube", href: "#",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
                },
              ].map(s => (
                <a key={s.label} href={s.href}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                  aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Hızlı linkler */}
          <div>
            <p className="text-sm font-bold mb-4 text-white">Hızlı Erişim</p>
            <div className="space-y-2">
              {[
                { href: "#hakkimizda",  label: "Hakkımızda"      },
                { href: "#faaliyetler", label: "Faaliyetlerimiz"  },
                { href: "#projeler",    label: "Projelerimiz"     },
                { href: "#gonullu",     label: "Gönüllü Ol"       },
                { href: "#bagis",       label: "Bağış Yap"        },
                { href: "/giris",       label: "Görevli Girişi"   },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="block text-sm transition hover:text-white"
                  style={{ color: "rgba(255,255,255,0.5)" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* İletişim */}
          <div>
            <p className="text-sm font-bold mb-4 text-white">İletişim</p>
            <div className="space-y-3">
              {[
                {
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                  text: "iletisim@serhendi.com",
                },
                {
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  text: "Türkiye Geneli, 81 İl",
                },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: "#D9BC4B" }}>{c.icon}</span>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alt çizgi */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Serhendi Vakfı Eğitim Birimi. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4">
            {["Gizlilik Politikası", "Kullanım Şartları"].map(l => (
              <a key={l} href="#" className="text-xs transition hover:text-white"
                style={{ color: "rgba(255,255,255,0.3)" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   ANA EXPORT
═══════════════════════════════════════════ */
export function HomePage() {
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>
      <Navbar />
      <Hero />
      <Hakkimizda />
      <Faaliyetler />
      <Projeler />
      <GonulluCta />
      <Bagis />
      <Footer />
    </div>
  );
}
