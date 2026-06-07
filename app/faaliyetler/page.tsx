"use client";

import { PublicLayout } from "@/components/PublicLayout";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useColors() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const dark = m && resolvedTheme === "dark";
  return {
    bg:  dark ? "#081C15" : "#F6F8F5",
    sr:  dark ? "#142C22" : "#FFFFFF",
    br:  dark ? "#1F3D31" : "#E2E8F0",
    h:   dark ? "#F8FAFC" : "#0F172A",
    b:   dark ? "#CBD5E1" : "#475569",
    mu:  dark ? "#94A3B8" : "#64748B",
    su:  dark ? "#0F241C" : "#F1F5F9",
  };
}

interface ActivityDef {
  title: string;
  desc: string;
  iconPath: string;
}

const activities: ActivityDef[] = [
  {
    title: "İlköğretim Çalışmaları",
    desc: "İlkokul ve ortaokul öğrencilerine yönelik değer eğitimi ve rehberlik programları.",
    iconPath: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
  {
    title: "Lise Çalışmaları",
    desc: "Lise gençliğine özel motivasyon, kimlik gelişimi ve kariyer rehberliği çalışmaları.",
    iconPath: "M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c3 3 9 3 12 0v-5",
  },
  {
    title: "Üniversite Çalışmaları",
    desc: "Üniversite öğrencilerine yönelik ilmî tartışma ortamları ve akran destek grupları.",
    iconPath: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z",
  },
  {
    title: "Barınma Hizmetleri",
    desc: "Şehir dışından gelen öğrenciler için güvenli ve destekleyici yurt imkânları.",
    iconPath: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  },
  {
    title: "Sabah Namazı Programları",
    desc: "Türkiye genelinde camilerden başlayan gençlik halkası buluşmaları.",
    iconPath: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M17 12a5 5 0 11-10 0 5 5 0 0110 0z",
  },
  {
    title: "Kafile Programları",
    desc: "Manevi şehirlere düzenlenen anlamlı ziyaret ve yolculuk programları.",
    iconPath: "M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8zM12 13a3 3 0 100-6 3 3 0 000 6z",
  },
  {
    title: "Sosyal Faaliyetler",
    desc: "Spor turnuvaları, kültürel geziler ve topluluk buluşmaları.",
    iconPath: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  },
  {
    title: "Eğitim Programları",
    desc: "Haftalık sistematik ilim dersleri, seminerler ve atölyeler.",
    iconPath: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  },
];

interface HighlightDef {
  title: string;
  desc: string;
  img: string;
  reverse: boolean;
}

const highlights: HighlightDef[] = [
  {
    title: "Haftalık İlim Halkası",
    desc: "Her hafta düzenli olarak toplanan ilim halkalarında gençler birlikte okuyup tartışıyor. Bu ortam; fikrî derinlik, eleştirel düşünce ve manevî gelişimi bir arada sunuyor.",
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    reverse: false,
  },
  {
    title: "Kafile Yolculukları",
    desc: "Manevi anlam taşıyan şehirlere düzenlenen kafile programları, gençlere tarihî ve ruhî bir yolculuk sunuyor. Birlik bilinci ve ortak hafıza inşa edilen bu yolculuklar unutulmaz deneyimler bırakıyor.",
    img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    reverse: true,
  },
  {
    title: "Sabah Buluşmaları",
    desc: "Türkiye genelinde camilerden başlayan sabah programları; gençleri günün ilk saatlerinde bir araya getirerek güçlü bir topluluk ruhu ve günlük disiplin kazandırıyor.",
    img: "https://images.unsplash.com/photo-1531498860502-7035613b5f29?w=800&q=80",
    reverse: false,
  },
];

function ActivityCard({ title, desc, iconPath }: ActivityDef) {
  const c = useColors();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.sr,
        border: `1px solid ${c.br}`,
        borderRadius: 16,
        padding: "1.75rem",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column" as const,
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: BRAND.green + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d={iconPath} stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: c.h, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: c.b }}>{desc}</p>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <button
          style={{
            background: "transparent",
            border: `1.5px solid ${BRAND.green}`,
            color: BRAND.green,
            borderRadius: 8,
            padding: "0.4rem 1rem",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Detaylar
        </button>
      </div>
    </div>
  );
}

function HighlightSection({ item, index }: { item: HighlightDef; index: number }) {
  const c = useColors();
  const reverse = item.reverse;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3rem",
        alignItems: "center",
      }}
      className="grid-cols-1 md:grid-cols-2"
    >
      {reverse ? (
        <>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ width: 24, height: 1, background: BRAND.gold }} />
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.22em", color: BRAND.gold }}>
                Öne Çıkan
              </span>
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)",
                color: c.h,
                letterSpacing: "-0.02em",
                marginBottom: 16,
              }}
            >
              {item.title}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: c.b }}>{item.desc}</p>
          </div>
          <img
            src={item.img}
            alt={item.title}
            style={{
              width: "100%",
              height: 320,
              objectFit: "cover",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          />
        </>
      ) : (
        <>
          <img
            src={item.img}
            alt={item.title}
            style={{
              width: "100%",
              height: 320,
              objectFit: "cover",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ width: 24, height: 1, background: BRAND.gold }} />
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.22em", color: BRAND.gold }}>
                Öne Çıkan
              </span>
            </div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)",
                color: c.h,
                letterSpacing: "-0.02em",
                marginBottom: 16,
              }}
            >
              {item.title}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: c.b }}>{item.desc}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function FaaliyetlerPage() {
  const c = useColors();

  return (
    <PublicLayout>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          minHeight: "60vh",
          backgroundImage: "url(https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1600&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,28,21,0.68)" }} />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-10 py-20" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-3 mb-5">
            <span style={{ width: 32, height: 1, background: BRAND.gold, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              Faaliyetler
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 800,
              color: "#F8FAFC",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              marginBottom: 24,
              maxWidth: 700,
            }}
          >
            Faaliyetlerimiz
          </h1>
          <p style={{ maxWidth: 560, fontSize: 18, lineHeight: 1.7, color: "rgba(248,250,252,0.82)" }}>
            Gençliği ilim, ahlâk ve hizmet ekseninde buluşturan programlarımız.
          </p>
        </div>
      </section>

      {/* ACTIVITY CARDS */}
      <section style={{ background: c.bg, padding: "5rem 0" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              Program Alanlarımız
            </span>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                color: c.h,
                letterSpacing: "-0.02em",
                marginTop: 12,
              }}
            >
              Tüm Faaliyetlerimiz
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {activities.map((a) => (
              <ActivityCard key={a.title} {...a} />
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHT SECTIONS */}
      <section style={{ background: c.su, padding: "5rem 0" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              Öne Çıkanlar
            </span>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                color: c.h,
                letterSpacing: "-0.02em",
                marginTop: 12,
              }}
            >
              Özel Programlarımız
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
            {highlights.map((h, i) => (
              <HighlightSection key={h.title} item={h} index={i} />
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
