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

type BadgeStatus = "Devam Ediyor" | "Planlanıyor" | "Tamamlandı";

interface Project {
  title: string;
  image: string;
  status: BadgeStatus;
  desc: string;
}

const statusStyles: Record<BadgeStatus, { bg: string; color: string }> = {
  "Devam Ediyor": { bg: "#D1FAE5", color: "#065F46" },
  "Planlanıyor":  { bg: "#FEF3C7", color: "#92400E" },
  "Tamamlandı":   { bg: "#DBEAFE", color: "#1E40AF" },
};

const projects: Project[] = [
  {
    title: "Faaliyet Takip Sistemi",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    status: "Devam Ediyor",
    desc: "81 ilde görevlilerin faaliyetlerini dijital ortamda kayıt altına aldığı kapsamlı yönetim sistemi.",
  },
  {
    title: "Nezir Burs Programı",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    status: "Devam Ediyor",
    desc: "Maddi imkânı kısıtlı üniversite öğrencilerine burs desteği sağlayan yardım programı.",
  },
  {
    title: "Öğrenci Barınma Ağı",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    status: "Devam Ediyor",
    desc: "Şehir dışından gelen öğrencilere güvenli ve değerlerine uygun barınma imkânı sunan ağ.",
  },
  {
    title: "Gençlik Eğitim Programları",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    status: "Devam Ediyor",
    desc: "İlköğretimden üniversiteye kadar her kademede sistematik eğitim ve rehberlik programları.",
  },
  {
    title: "Dijital Gönüllü Platformu",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    status: "Devam Ediyor",
    desc: "Gönüllülerin kayıt, burs başvurusu ve geri bildirim süreçlerini yönettiği platform.",
  },
  {
    title: "Kafile Organizasyon Sistemi",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    status: "Planlanıyor",
    desc: "Manevi şehirlere düzenlenen kafile programlarının dijital yönetim ve kayıt sistemi.",
  },
];

function ProjectCard({ project }: { project: Project }) {
  const c = useColors();
  const [hovered, setHovered] = useState(false);
  const badge = statusStyles[project.status];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.sr,
        border: `1px solid ${c.br}`,
        borderRadius: 20,
        overflow: "hidden",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column" as const,
      }}
    >
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img
          src={project.image}
          alt={project.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.04)" : "scale(1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: badge.bg,
            color: badge.color,
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          {project.status}
        </div>
      </div>
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: 17, color: c.h, margin: 0 }}>{project.title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: c.b, margin: 0, flex: 1 }}>{project.desc}</p>
        <div style={{ paddingTop: 8 }}>
          <button
            style={{
              background: BRAND.green,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "0.5rem 1.25rem",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            İncele
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjelerPage() {
  const c = useColors();

  return (
    <PublicLayout>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          minHeight: "60vh",
          backgroundImage: "url(https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,28,21,0.70)" }} />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-10 py-20" style={{ zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ width: 32, height: 1, background: BRAND.gold, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              Projeler
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
            Projelerimiz
          </h1>
          <p style={{ maxWidth: 560, fontSize: 18, lineHeight: 1.7, color: "rgba(248,250,252,0.82)" }}>
            Gençliğe hizmet eden dijital ve sosyal projelerimiz.
          </p>
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{ background: BRAND.green, padding: "1.5rem 0" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center", alignItems: "center" }}>
            {[
              { n: "6", l: "Aktif Proje" },
              { n: "81", l: "İl Kapsamı" },
              { n: "10.000+", l: "Faydalanan Genç" },
              { n: "2012", l: "Kuruluş Yılı" },
            ].map((s) => (
              <div key={s.l} style={{ textAlign: "center", padding: "0 1.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "#FFFFFF", letterSpacing: "-0.03em" }}>
                  {s.n}
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "block" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECT CARDS */}
      <section style={{ background: c.bg, padding: "5rem 0" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              Tüm Projeler
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
              Devam Eden ve Planlanan Projelerimiz
            </h2>
            <p style={{ fontSize: 15, color: c.b, marginTop: 12, maxWidth: 560, margin: "12px auto 0" }}>
              Her proje, gençliğin ilmî, manevî ve sosyal gelişimine katkı sağlamak amacıyla tasarlanmıştır.
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40, justifyContent: "center" }}>
            {(Object.entries(statusStyles) as [BadgeStatus, { bg: string; color: string }][]).map(([key, val]) => (
              <span
                key={key}
                style={{
                  background: val.bg,
                  color: val.color,
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "4px 14px",
                }}
              >
                {key}
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: c.su, padding: "5rem 0" }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-10 text-center">
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
              color: c.h,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Projelere Katkıda Bulunmak İster misiniz?
          </h2>
          <p style={{ fontSize: 15, color: c.b, lineHeight: 1.8, marginBottom: 32 }}>
            Gönüllü olarak veya bağış yoluyla gençliğe hizmet eden projelerimize destek olabilirsiniz.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/gonullu-kayit"
              style={{
                background: BRAND.green,
                color: "#FFFFFF",
                borderRadius: 12,
                padding: "0.75rem 2rem",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Gönüllü Ol
            </a>
            <a
              href="/bagis"
              style={{
                background: "transparent",
                color: BRAND.green,
                border: `2px solid ${BRAND.green}`,
                borderRadius: 12,
                padding: "0.75rem 2rem",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Bağış Yap
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
