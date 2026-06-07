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
    h:  dark ? "#F8FAFC" : "#0F172A",
    b:  dark ? "#CBD5E1" : "#475569",
    mu: dark ? "#94A3B8" : "#64748B",
    bg: dark ? "#081C15" : "#F6F8F5",
    sr: dark ? "#142C22" : "#FFFFFF",
    br: dark ? "#1F3D31" : "#E2E8F0",
    bs: dark ? "#193328" : "#EEF2F7",
  };
}

export default function FaaliyetlerPage() {
  const c = useColors();

  const birimler = [
    {
      no: "01", renk: BRAND.green, baslik: "İlköğretim Birimi",
      desc: "Elif-Ba'dan Kur'an-ı Kerim'e uzanan haftalık kurslar. Deneyimli eğitmen kadrosu ile çocuklara sistematik eğitim.",
      liste: ["Elif-Ba Kursları", "Kur'an-ı Kerim Eğitimi", "Haftalık Dersler", "Sınav Hazırlık Desteği"],
    },
    {
      no: "02", renk: "#1D4ED8", baslik: "Lise Birimi",
      desc: "Sabah namazı buluşmaları, ilim halkaları ve kafile programlarıyla lise gençliğine kapsamlı destek.",
      liste: ["Sabah Namazı Buluşmaları", "İlim Dersleri", "Kafile Programları", "Sosyal Faaliyetler"],
    },
    {
      no: "03", renk: "#7C3AED", baslik: "Üniversite Birimi",
      desc: "KYK buluşmaları, dergah programları ve ilim halkaları ile üniversite öğrencilerine derinlikli topluluk ortamı.",
      liste: ["KYK Buluşmaları", "Dergah Programları", "İlim Halkaları", "Mezun Takibi"],
    },
    {
      no: "04", renk: "#92400E", baslik: "Barınma Hizmetleri",
      desc: "Öğrenci evleri, apart ve yurtlarda şeffaf yönetim. Güvenli, değerli ve sistematik barınma ortamları.",
      liste: ["Öğrenci Evleri", "Apart Yönetimi", "Yurt Koordinasyonu", "Ziyaret Takibi"],
    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20">

        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-px" style={{ background: BRAND.gold }} />
            <span className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: BRAND.gold }}>Faaliyetler</span>
          </div>
          <h1
            className="font-extrabold leading-[1.06] mb-5"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: c.h, letterSpacing: "-0.025em" }}
          >
            Geniş Bir Hizmet Yelpazemiz
          </h1>
          <p className="text-[16px] leading-[1.80]" style={{ color: c.b }}>
            İlköğretimden üniversiteye, barınmadan burs programlarına kadar gençliğin
            her ihtiyacına yanıt veren sistematik ve kararlı bir hizmet anlayışı.
          </p>
        </div>

        {/* Birim kartları */}
        <div className="grid md:grid-cols-2 gap-px mb-16" style={{ background: c.br }}>
          {birimler.map(bm => (
            <div key={bm.no} className="p-8" style={{ background: c.sr }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: bm.renk }}>{bm.no}</span>
                <span className="flex-1 h-px" style={{ background: c.br }} />
              </div>
              <h2
                className="font-bold text-[1.15rem] mb-3"
                style={{ color: c.h, letterSpacing: "-0.015em" }}
              >
                {bm.baslik}
              </h2>
              <p className="text-[14px] leading-[1.70] mb-5" style={{ color: c.b }}>{bm.desc}</p>
              <div className="space-y-2">
                {bm.liste.map(l => (
                  <div key={l} className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 8l4 4 7-7" stroke={bm.renk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[13px] font-medium" style={{ color: c.b }}>{l}</span>
                  </div>
                ))}
              </div>
              <div className="w-8 h-[3px] mt-6" style={{ background: bm.renk }} />
            </div>
          ))}
        </div>

        {/* Etiketler */}
        <div className="flex flex-wrap gap-2">
          {["Nezir Burs Programı","Kafile Programları","Sabah Namazı Buluşmaları","Sosyal Faaliyetler","Eğitim Materyalleri","KYK Koordinasyonu"].map(e => (
            <span
              key={e}
              className="px-4 py-2 text-[13px] font-medium rounded-lg border"
              style={{ background: c.bg, borderColor: c.br, color: c.b }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
