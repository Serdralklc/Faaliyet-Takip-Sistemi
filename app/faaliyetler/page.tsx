"use client";
import { PublicLayout } from "@/components/PublicLayout";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Link from "next/link";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useIsDark() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m && resolvedTheme === "dark";
}

export default function FaaliyetlerPage() {
  const dark = useIsDark();
  const h  = dark ? "#F5F0E8" : "#0A3520";
  const b  = dark ? "#E8E2D6" : "#1C5232";
  const mu = dark ? "#B8B0A0" : "#38694E";
  const sr = dark ? "#0F241C" : "#FFFFFF";
  const bg = dark ? "#081C15" : "#EDE9DF";
  const br = dark ? "#1F3D31" : "#D4C9B0";

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
            <span className="w-7 h-px" style={{ background: BRAND.gold }} />
            <span className="text-[11px] font-black uppercase tracking-[0.20em]" style={{ color: BRAND.gold }}>Faaliyetler</span>
          </div>
          <h1 className="font-black leading-[1.04] mb-5"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: h, letterSpacing: "-0.025em" }}>
            Geniş Bir Hizmet Yelpazesi
          </h1>
          <p className="text-[16px] leading-[1.80]" style={{ color: b }}>
            İlköğretimden üniversiteye, barınmadan burs programlarına kadar gençliğin
            her ihtiyacına yanıt veren sistematik ve kararlı bir hizmet anlayışı.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px mb-16" style={{ background: br }}>
          {birimler.map(bm => (
            <div key={bm.no} className="p-8" style={{ background: sr }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: bm.renk }}>{bm.no}</span>
                <span className="flex-1 h-px" style={{ background: br }} />
              </div>
              <h2 className="font-black text-[1.15rem] mb-3" style={{ color: h, letterSpacing: "-0.015em" }}>{bm.baslik}</h2>
              <p className="text-[14px] leading-[1.65] mb-5" style={{ color: b }}>{bm.desc}</p>
              <div className="space-y-2">
                {bm.liste.map(l => (
                  <div key={l} className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 8l4 4 7-7" stroke={bm.renk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[13px] font-medium" style={{ color: mu }}>{l}</span>
                  </div>
                ))}
              </div>
              <div className="w-8 h-[3px] mt-6" style={{ background: bm.renk }} />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["Nezir Burs Programı","Kafile Programları","Sabah Namazı Buluşmaları","Sosyal Faaliyetler","Eğitim Materyalleri","KYK Koordinasyonu"].map(e => (
            <span key={e} className="px-4 py-2 text-[13px] font-medium rounded-lg border"
              style={{ background: bg, borderColor: br, color: b }}>{e}</span>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
