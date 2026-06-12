"use client";
import { useState } from "react";
import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";
import { Reveal } from "@/components/Reveal";
import { BRAND, useColors } from "@/lib/theme";

type BadgeStatus = "Devam Ediyor" | "Planlanıyor" | "Tamamlandı";

interface Project {
  title: string;
  image: string;
  status: BadgeStatus;
  desc: string;
  year: string;
}

const statusStyles: Record<BadgeStatus, { bg: string; color: string; border: string }> = {
  "Devam Ediyor": { bg: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
  "Planlanıyor":  { bg: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" },
  "Tamamlandı":   { bg: "#DBEAFE", color: "#1E40AF", border: "1px solid #BFDBFE" },
};

const projects: Project[] = [
  {
    title: "Faaliyet Takip Sistemi",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    status: "Devam Ediyor",
    desc: "81 ilde görevlilerin faaliyetlerini dijital ortamda kayıt altına aldığı kapsamlı yönetim sistemi.",
    year: "2023",
  },
  {
    title: "Nezir Burs Programı",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    status: "Devam Ediyor",
    desc: "Maddi imkânı kısıtlı üniversite öğrencilerine burs desteği sağlayan yardım programı.",
    year: "2015",
  },
  {
    title: "Öğrenci Barınma Ağı",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    status: "Devam Ediyor",
    desc: "Şehir dışından gelen öğrencilere güvenli ve değerlerine uygun barınma imkânı sunan ağ.",
    year: "2014",
  },
  {
    title: "Gençlik Eğitim Programları",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    status: "Devam Ediyor",
    desc: "İlköğretimden üniversiteye kadar her kademede sistematik eğitim ve rehberlik programları.",
    year: "2012",
  },
  {
    title: "Dijital Gönüllü Platformu",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    status: "Devam Ediyor",
    desc: "Gönüllülerin kayıt, burs başvurusu ve geri bildirim süreçlerini yönettiği platform.",
    year: "2024",
  },
  {
    title: "Kafile Organizasyon Sistemi",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    status: "Planlanıyor",
    desc: "Manevi şehirlere düzenlenen kafile programlarının dijital yönetim ve kayıt sistemi.",
    year: "2025",
  },
];

const stats = [
  { n: "6", l: "Aktif Proje" },
  { n: "81", l: "İl" },
  { n: "2012'den Beri", l: "Kuruluş" },
  { n: "10.000+", l: "Genç" },
];

export default function ProjelerPage() {
  const c = useColors();
  const [hoveredIndex, setHoveredIndex] = useState(-1);
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
              "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80')",
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
              "linear-gradient(135deg, rgba(6,78,42,0.88) 0%, rgba(8,28,21,0.75) 100%)",
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
              PROJELERİMİZ
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
            Gençliğe Hizmet Eden Projeler
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
            Dijital sistemler, burs programları ve eğitim ağlarıyla sürdürülebilir kalkınma.
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
              Projelerimizi İncele
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

      {/* ── PROJECT CARDS GRID ── */}
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
              Tüm Projeler
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
              Devam Eden ve Planlanan Projelerimiz
            </h2>
            <p style={{ fontSize: 15, color: c.b, maxWidth: 560, margin: "0 auto" }}>
              Her proje, gençliğin ilmî, manevî ve sosyal gelişimine katkı sağlamak amacıyla tasarlanmıştır.
            </p>
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "2rem",
            }}
          >
            {projects.map((project, idx) => {
              const badge = statusStyles[project.status];
              const isHovered = hoveredIndex === idx;
              return (
                <Reveal key={project.title} delay={(idx % 3) * 80}>
                <div
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                  style={{
                    background: c.sr,
                    border: `1px solid ${c.br}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                    transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                    boxShadow: isHovered
                      ? "0 20px 60px rgba(0,0,0,0.15)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {/* Card image */}
                  <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                    <img
                      src={project.image}
                      alt={project.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                        transform: isHovered ? "scale(1.06)" : "scale(1)",
                        display: "block",
                      }}
                    />
                  </div>

                  {/* Card body */}
                  <div
                    style={{
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      flex: 1,
                    }}
                  >
                    {/* Status badge */}
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 999,
                          padding: "3px 12px",
                        }}
                      >
                        {project.status}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: c.h,
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {project.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: c.b,
                        margin: 0,
                        flex: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {project.desc}
                    </p>

                    {/* Bottom row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 8,
                        borderTop: `1px solid ${c.br}`,
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          color: BRAND.green,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        İncele →
                      </span>
                      <span style={{ fontSize: 13, color: c.mu }}>{project.year}</span>
                    </div>
                  </div>
                </div>
                </Reveal>
              );
            })}
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
            Gönüllü olarak veya bağış yoluyla gençliğe hizmet eden projelerimize destek olabilirsiniz.
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
