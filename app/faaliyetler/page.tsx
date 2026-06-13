"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { PublicLayout } from "@/components/PublicLayout";
import { Reveal } from "@/components/Reveal";
import { HoverReveal, staggerContainer, staggerItem } from "@/components/motion";
import { BRAND, useColors } from "@/lib/theme";

interface ActivityDef {
  title: string;
  desc: string;
  iconPath: string;
}

const activities: ActivityDef[] = [
  {
    title: "İlköğretim Çalışmaları",
    desc: "Elif-Ba'dan Kur'an-ı Kerim'e uzanan haftalık kurslar ve değer eğitimi programları.",
    iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    title: "Lise Çalışmaları",
    desc: "Sabah namazı buluşmaları, ilim halkaları ve kariyer rehberliğiyle lise gençliğine kapsamlı destek.",
    iconPath: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  },
  {
    title: "Üniversite Çalışmaları",
    desc: "KYK buluşmaları, dergah programları ve ilim halkaları ile üniversite öğrencilerine derinlikli topluluk.",
    iconPath: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
  },
  {
    title: "Barınma Hizmetleri",
    desc: "Öğrenci evleri, apartlar ve yurtlarda şeffaf yönetim. Güvenli, değerli ortamlar.",
    iconPath: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
  {
    title: "Sabah Namazı Programları",
    desc: "Türkiye genelinde camilerden başlayan gençlik halkası buluşmaları. Her hafta, her şehir.",
    iconPath: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
  },
  {
    title: "Kafile Programları",
    desc: "Manevi şehirlere düzenlenen anlamlı ziyaret ve yolculuk programları.",
    iconPath: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  },
  {
    title: "Sosyal Faaliyetler",
    desc: "Spor turnuvaları, kültürel geziler ve topluluk buluşmalarıyla güçlü bağlar.",
    iconPath: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  },
  {
    title: "Eğitim Programları",
    desc: "Haftalık sistematik ilim dersleri, seminerler ve atölyelerle derinlikli bilgi.",
    iconPath: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  },
];

interface FeatureSection {
  title: string;
  body: string;
  img: string;
  reverse: boolean;
}

const features: FeatureSection[] = [
  {
    title: "Haftalık İlim Halkası",
    body: "Her hafta düzenli olarak gerçekleştirilen ilim dersleri, gençlerin sistematik bir şekilde dini ve ahlaki bilgi edinmesini sağlar. Deneyimli hocalar eşliğinde, Türkiye'nin her şehrinde eş zamanlı yürütülen bu programlar...",
    img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    reverse: false,
  },
  {
    title: "Kafile Yolculukları",
    body: "Manevi değer taşıyan şehirlere düzenlenen kafile programları, gençlerin hem tarihî hem de manevî bir yolculuk yaşamasını sağlar. Eyüp Sultan, Konya, Edirne gibi kutlu mekânlara...",
    img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    reverse: true,
  },
  {
    title: "Sabah Namazı Buluşmaları",
    body: "Güne anlamlı bir başlangıç yapmak için camilerden başlayan gençlik halkası buluşmaları. Her şehirde, her hafta, binlerce gencin ortak ritmi...",
    img: "https://images.unsplash.com/photo-1531498860502-7035613b5f29?w=800&q=80",
    reverse: false,
  },
];

const stats = [
  { n: "8", l: "Farklı Program" },
  { n: "81", l: "İl" },
  { n: "Haftalık", l: "Programlar" },
  { n: "12+", l: "Yıl Tecrübe" },
];

export default function FaaliyetlerPage() {
  const c = useColors();
  const [btn1Hovered, setBtn1Hovered] = useState(false);
  const [btn2Hovered, setBtn2Hovered] = useState(false);
  const [ctaBtn1Hovered, setCtaBtn1Hovered] = useState(false);
  const [ctaBtn2Hovered, setCtaBtn2Hovered] = useState(false);

  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          minHeight: "65vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "url('https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(6,78,42,0.85) 0%, rgba(8,28,21,0.72) 100%)",
          }}
        />
        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "5rem 2.5rem",
          }}
        >
          {/* Badge pill */}
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                display: "inline-block",
                background: "rgba(8,28,21,0.7)",
                color: BRAND.gold,
                border: `1px solid ${BRAND.gold}`,
                borderRadius: 999,
                padding: "6px 20px",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
              }}
            >
              FAALİYETLERİMİZ
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: 720,
            }}
          >
            Gençliği Buluşturan Programlar
          </h1>

          <p
            style={{
              maxWidth: 560,
              fontSize: 18,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.80)",
              marginBottom: 36,
            }}
          >
            İlköğretimden üniversiteye, barınmadan maneviyata uzanan kapsamlı hizmet ağımız.
          </p>

          {/* Two 3D buttons */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button
              onMouseEnter={() => setBtn1Hovered(true)}
              onMouseLeave={() => setBtn1Hovered(false)}
              style={{
                background: BRAND.gold,
                color: "#064E2A",
                fontWeight: 800,
                fontSize: 15,
                border: "none",
                borderRadius: 12,
                padding: "14px 32px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                transform: btn1Hovered ? "translateY(2px)" : "translateY(0)",
                boxShadow: btn1Hovered
                  ? "0 4px 0 #92660A, 0 6px 15px rgba(0,0,0,0.3)"
                  : "0 6px 0 #92660A, 0 8px 20px rgba(0,0,0,0.3)",
              }}
            >
              Faaliyetleri Keşfet
            </button>
            <Link
              href="/gonullu-kayit"
              onMouseEnter={() => setBtn2Hovered(true)}
              onMouseLeave={() => setBtn2Hovered(false)}
              style={{
                background: btn2Hovered ? "rgba(255,255,255,0.15)" : "transparent",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 15,
                border: "2px solid white",
                borderRadius: 12,
                padding: "14px 32px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Gönüllü Ol
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: "#064E2A", padding: "2rem 0" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 2.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: 0,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.l}
              style={{
                textAlign: "center",
                padding: "0.75rem 2.5rem",
                borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVITY CARDS GRID ── */}
      <section style={{ background: c.bg, padding: "5rem 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2.5rem" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: BRAND.gold,
              }}
            >
              Program Alanlarımız
            </span>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                color: c.h,
                letterSpacing: "-0.02em",
                marginTop: 12,
                marginBottom: 12,
              }}
            >
              Tüm Faaliyetlerimiz
            </h2>
            <p style={{ fontSize: 15, color: c.b, maxWidth: 560, margin: "0 auto" }}>
              İlköğretimden üniversiteye, gençliğin her kademesine ulaşan kapsamlı programlarımız.
            </p>
          </div>

          {/* Cards grid */}
          <motion.div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
            variants={staggerContainer(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {activities.map((activity) => (
              <motion.div key={activity.title} variants={staggerItem} style={{ height: "100%" }}>
                <HoverReveal
                  lift={6}
                  restShadow="0 2px 8px rgba(0,0,0,0.06)"
                  hoverShadow="0 20px 60px rgba(0,0,0,0.15)"
                  className="group"
                  style={{
                    background: c.sr,
                    border: `1px solid ${c.br}`,
                    borderRadius: 16,
                    padding: "1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    height: "100%",
                  }}
                >
                  {/* Icon circle */}
                  <motion.div
                    variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.08, rotate: -4 } }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: BRAND.green + "18",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke={BRAND.green}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={activity.iconPath}
                      />
                    </svg>
                  </motion.div>

                  {/* Title */}
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: c.h, margin: 0, lineHeight: 1.3 }}>
                    {activity.title}
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: c.b, margin: 0, flex: 1 }}>
                    {activity.desc}
                  </p>

                  {/* Ghost button */}
                  <div style={{ marginTop: "auto", paddingTop: 4 }}>
                    <span
                      className="group-hover:bg-[var(--bg-subtle)]"
                      style={{
                        display: "inline-block",
                        background: "transparent",
                        border: `1px solid ${BRAND.green}`,
                        color: BRAND.green,
                        borderRadius: 8,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "background 0.15s ease",
                      }}
                    >
                      Detaylar →
                    </span>
                  </div>
                </HoverReveal>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURE SECTIONS (alternating) ── */}
      <section style={{ background: c.su, padding: "5rem 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2.5rem" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: BRAND.gold,
              }}
            >
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
            {features.map((feature, fi) => (
              <Reveal key={feature.title} delay={fi * 80}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "3rem",
                  alignItems: "center",
                }}
              >
                {feature.reverse ? (
                  <>
                    {/* Text left */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 20,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 2,
                            background: BRAND.gold,
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.22em",
                            color: BRAND.gold,
                          }}
                        >
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
                        {feature.title}
                      </h3>
                      <p style={{ fontSize: 15, lineHeight: 1.8, color: c.b }}>
                        {feature.body}
                      </p>
                    </div>
                    {/* Image right */}
                    <div
                      style={{
                        borderRadius: 20,
                        overflow: "hidden",
                        aspectRatio: "4/3",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                      }}
                    >
                      <img
                        src={feature.img}
                        alt={feature.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Image left */}
                    <div
                      style={{
                        borderRadius: 20,
                        overflow: "hidden",
                        aspectRatio: "4/3",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                      }}
                    >
                      <img
                        src={feature.img}
                        alt={feature.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    {/* Text right */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 20,
                        }}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 2,
                            background: BRAND.gold,
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.22em",
                            color: BRAND.gold,
                          }}
                        >
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
                        {feature.title}
                      </h3>
                      <p style={{ fontSize: 15, lineHeight: 1.8, color: c.b }}>
                        {feature.body}
                      </p>
                    </div>
                  </>
                )}
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ background: "#064E2A", padding: "6rem 0" }}>
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 2.5rem",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 3vw, 2.4rem)",
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Serhendi Gençlik'in bir parçası olun
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.8,
              marginBottom: 36,
            }}
          >
            Gönüllü olarak veya bağış yoluyla gençliğe hizmet eden programlarımıza destek olabilirsiniz.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/gonullu-kayit"
              onMouseEnter={() => setCtaBtn1Hovered(true)}
              onMouseLeave={() => setCtaBtn1Hovered(false)}
              style={{
                background: BRAND.gold,
                color: "#064E2A",
                fontWeight: 800,
                fontSize: 15,
                borderRadius: 12,
                padding: "14px 32px",
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.15s ease",
                transform: ctaBtn1Hovered ? "translateY(2px)" : "translateY(0)",
                boxShadow: ctaBtn1Hovered
                  ? "0 4px 0 #92660A, 0 6px 15px rgba(0,0,0,0.3)"
                  : "0 6px 0 #92660A, 0 8px 20px rgba(0,0,0,0.3)",
              }}
            >
              Gönüllü Ol
            </Link>
            <Link
              href="/bagis"
              onMouseEnter={() => setCtaBtn2Hovered(true)}
              onMouseLeave={() => setCtaBtn2Hovered(false)}
              style={{
                background: ctaBtn2Hovered ? "rgba(255,255,255,0.15)" : "transparent",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 15,
                border: "2px solid white",
                borderRadius: 12,
                padding: "14px 32px",
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.15s ease",
              }}
            >
              Bağış Yap
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
