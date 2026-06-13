"use client";

import { PublicLayout } from "@/components/PublicLayout";
import { Reveal } from "@/components/Reveal";
import { HoverReveal } from "@/components/motion";
import Link from "next/link";
import { BRAND, useColors } from "@/lib/theme";

const timeline = [
  { year: "2012", title: "Kuruluş", desc: "Küçük bir grup gencin ilim ve hizmet yolculuğu başladı.", side: "left" },
  { year: "2015", title: "İlk Bölgesel Faaliyetler", desc: "Birden fazla şehirde organize programlar düzenlendi.", side: "right" },
  { year: "2018", title: "Türkiye Geneli Yaygınlaşma", desc: "81 ilde aktif faaliyetlere ulaşıldı.", side: "left" },
  { year: "2022", title: "Kurumsal Yapılanma", desc: "Gönüllü ve görevli sistemi dijital platforma taşındı.", side: "right" },
  { year: "2025", title: "Dijital Yönetim Sistemleri", desc: "Faaliyet takip ve burs yönetim sistemleri devreye alındı.", side: "left" },
];

const degerBadges = ["İlim", "Ahlâk", "Hizmet", "Kardeşlik", "Sorumluluk"];

/** Yerel HoverCard — motion HoverReveal'e devreder; aynı {children, style} API'si. */
function HoverCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <HoverReveal
      lift={4}
      restShadow="0 2px 8px rgba(0,0,0,0.06)"
      hoverShadow="0 12px 40px rgba(0,0,0,0.12)"
      style={style}
    >
      {children}
    </HoverReveal>
  );
}

export default function HakkimizdaPage() {
  const c = useColors();

  return (
    <PublicLayout>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          minHeight: "62vh",
          backgroundImage: "url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,28,21,0.72)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-10 py-20" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px" style={{ background: BRAND.gold }} />
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: BRAND.gold }}
            >
              Hakkımızda
            </span>
          </div>
          <h1
            className="font-extrabold leading-tight mb-6 max-w-3xl"
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              color: "#F8FAFC",
              letterSpacing: "-0.025em",
            }}
          >
            Hakkımızda
          </h1>
          <p
            className="max-w-2xl text-lg leading-relaxed"
            style={{ color: "rgba(248,250,252,0.82)" }}
          >
            İlim, ahlâk ve hizmet anlayışıyla gençliğe değer katıyoruz.
          </p>
        </div>
      </section>

      {/* MISSION / VISION / VALUES */}
      <section style={{ background: c.bg }} className="py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {/* Misyon */}
            <Reveal delay={0}>
            <HoverCard
              style={{
                background: c.sr,
                borderRadius: 16,
                padding: "2rem",
                border: `1px solid ${c.br}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: BRAND.green + "18" }}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: c.h }}>Misyon</h3>
              <p className="text-sm leading-relaxed" style={{ color: c.b }}>
                Türkiye'nin her köşesindeki gencin ilmî, ahlâkî ve manevî gelişimine katkı sağlamak.
              </p>
            </HoverCard>
            </Reveal>

            {/* Vizyon */}
            <Reveal delay={80}>
            <HoverCard
              style={{
                background: c.sr,
                borderRadius: 16,
                padding: "2rem",
                border: `1px solid ${c.br}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: BRAND.gold + "20" }}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" stroke={BRAND.gold} strokeWidth="2" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke={BRAND.gold} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: c.h }}>Vizyon</h3>
              <p className="text-sm leading-relaxed" style={{ color: c.b }}>
                İlim ve ahlâk sahibi, ülkesine ve insanlığa faydalı bir nesil yetiştirmek.
              </p>
            </HoverCard>
            </Reveal>

            {/* Temel Değerler */}
            <Reveal delay={160}>
            <HoverCard
              style={{
                background: c.sr,
                borderRadius: 16,
                padding: "2rem",
                border: `1px solid ${c.br}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: BRAND.green + "18" }}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: c.h }}>Temel Değerler</h3>
              <div className="flex flex-wrap gap-2">
                {degerBadges.map((d) => (
                  <span
                    key={d}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: BRAND.green + "18", color: BRAND.green }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </HoverCard>
            </Reveal>
          </div>

          {/* TIMELINE */}
          <Reveal className="mb-20">
            <div className="text-center mb-14">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: BRAND.gold }}>
                Tarihçemiz
              </span>
              <h2
                className="font-extrabold mt-3"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: c.h, letterSpacing: "-0.02em" }}
              >
                Yolculuğumuz
              </h2>
            </div>

            {/* Desktop alternating timeline */}
            <div className="hidden md:block relative">
              {/* Center line */}
              <div
                className="absolute left-1/2 top-0 bottom-0 w-px"
                style={{ background: c.br, transform: "translateX(-50%)" }}
              />
              <div className="flex flex-col gap-12">
                {timeline.map((item, i) => (
                  <div key={item.year} className={`flex items-center gap-8 ${item.side === "right" ? "flex-row-reverse" : ""}`}>
                    <div className="flex-1 flex justify-end">
                      {item.side === "left" ? (
                        <HoverCard
                          style={{
                            background: c.sr,
                            borderRadius: 14,
                            padding: "1.5rem",
                            border: `1px solid ${c.br}`,
                            maxWidth: 360,
                            width: "100%",
                          }}
                        >
                          <span
                            className="text-xs font-black uppercase tracking-widest mb-2 block"
                            style={{ color: BRAND.gold }}
                          >
                            {item.year}
                          </span>
                          <h4 className="font-bold text-base mb-1" style={{ color: c.h }}>{item.title}</h4>
                          <p className="text-sm leading-relaxed" style={{ color: c.b }}>{item.desc}</p>
                        </HoverCard>
                      ) : (
                        <div style={{ maxWidth: 360, width: "100%" }} />
                      )}
                    </div>

                    {/* Dot */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 z-10"
                      style={{ background: BRAND.green, border: `3px solid ${c.bg}`, boxShadow: `0 0 0 3px ${BRAND.green}40` }}
                    />

                    <div className="flex-1">
                      {item.side === "right" ? (
                        <HoverCard
                          style={{
                            background: c.sr,
                            borderRadius: 14,
                            padding: "1.5rem",
                            border: `1px solid ${c.br}`,
                            maxWidth: 360,
                            width: "100%",
                          }}
                        >
                          <span
                            className="text-xs font-black uppercase tracking-widest mb-2 block"
                            style={{ color: BRAND.gold }}
                          >
                            {item.year}
                          </span>
                          <h4 className="font-bold text-base mb-1" style={{ color: c.h }}>{item.title}</h4>
                          <p className="text-sm leading-relaxed" style={{ color: c.b }}>{item.desc}</p>
                        </HoverCard>
                      ) : (
                        <div style={{ maxWidth: 360, width: "100%" }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile timeline */}
            <div className="md:hidden flex flex-col gap-6 relative pl-8">
              <div
                className="absolute left-3 top-0 bottom-0 w-px"
                style={{ background: c.br }}
              />
              {timeline.map((item) => (
                <div key={item.year} className="relative">
                  <div
                    className="absolute -left-5 top-4 w-3 h-3 rounded-full"
                    style={{ background: BRAND.green }}
                  />
                  <div
                    style={{
                      background: c.sr,
                      borderRadius: 12,
                      padding: "1.25rem",
                      border: `1px solid ${c.br}`,
                    }}
                  >
                    <span
                      className="text-xs font-black uppercase tracking-widest mb-1 block"
                      style={{ color: BRAND.gold }}
                    >
                      {item.year}
                    </span>
                    <h4 className="font-bold text-sm mb-1" style={{ color: c.h }}>{item.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: c.b }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#081C15" }} className="py-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "#1F3D31" }}>
            {[
              { n: "81", l: "İl" },
              { n: "500+", l: "Görevli" },
              { n: "10.000+", l: "Genç" },
              { n: "12+", l: "Yıl" },
            ].map((s) => (
              <div key={s.l} className="py-12 text-center" style={{ background: "#081C15" }}>
                <p
                  className="font-black leading-none mb-2"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#F8FAFC", letterSpacing: "-0.04em" }}
                >
                  {s.n}
                </p>
                <p className="text-sm font-medium" style={{ color: BRAND.gold }}>{s.l}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
