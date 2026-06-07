"use client";
import { PublicLayout } from "@/components/PublicLayout";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useIsDark() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m && resolvedTheme === "dark";
}

export default function ProjelerPage() {
  const dark = useIsDark();
  const h  = dark ? "#F5F0E8" : "#0A3520";
  const b  = dark ? "#E8E2D6" : "#1C5232";
  const mu = dark ? "#B8B0A0" : "#38694E";
  const sr = dark ? "#0F241C" : "#FFFFFF";
  const br = dark ? "#1F3D31" : "#D4C9B0";
  const bs = dark ? "#193328" : "#E8E2D5";

  const projeler = [
    {
      no: "01", renk: BRAND.green, durum: "Devam Ediyor",
      baslik: "Nesil Yetiştirilmesi",
      desc: "İlköğretimden üniversiteye sistematik eğitim programı. Türkiye geneli kapsam ile her kademedeki genci kucaklayan uzun vadeli nesil yetiştirme misyonu.",
      detaylar: ["81 ilde eş zamanlı faaliyet", "Kademeli müfredat sistemi", "Yıllık dönem planlaması", "Türkiye geneli koordinasyon"],
    },
    {
      no: "02", renk: "#7C3AED", durum: "Devam Ediyor",
      baslik: "Öğrenci Barınma Ağı",
      desc: "Üniversite öğrencileri için değer odaklı güvenli barınma ortamları. Ev, apart ve yurt koordinasyonuyla şeffaf yönetim anlayışı.",
      detaylar: ["Öğrenci ev ve apart ağı", "Düzenli ziyaret takibi", "Burs desteğiyle entegrasyon", "Disiplin ve takip sistemi"],
    },
    {
      no: "03", renk: BRAND.gold, durum: "Devam Ediyor",
      baslik: "Nezir Burs Programı",
      desc: "İhtiyaç sahibi öğrencilere burs desteği ile eğitimde fırsat eşitliği. Türkiye genelinde yüzlerce öğrenciye kesintisiz eğitim imkânı.",
      detaylar: ["İhtiyaç bazlı burs dağıtımı", "Yıllık burs planlaması", "Öğrenci takip sistemi", "Hayır sahipleri koordinasyonu"],
    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20">

        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-px" style={{ background: BRAND.gold }} />
            <span className="text-[11px] font-black uppercase tracking-[0.20em]" style={{ color: BRAND.gold }}>Projeler</span>
          </div>
          <h1 className="font-black leading-[1.04]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: h, letterSpacing: "-0.025em" }}>
            Uzun Vadeli Projelerimiz
          </h1>
        </div>

        {/* Liste */}
        <div style={{ borderTop: `1px solid ${br}` }}>
          {projeler.map(p => (
            <div key={p.no} className="py-10 border-b" style={{ borderColor: bs }}>
              <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
                <div className="lg:col-span-1 flex items-start pt-1">
                  <span className="text-[11px] font-black" style={{ color: br }}>{p.no}</span>
                </div>
                <div className="lg:col-span-3">
                  <h2 className="font-black text-[1.1rem] mb-2" style={{ color: h }}>{p.baslik}</h2>
                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: p.renk + "18", color: p.renk }}>{p.durum}</span>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-[14px] leading-[1.70]" style={{ color: b }}>{p.desc}</p>
                </div>
                <div className="lg:col-span-3">
                  <div className="space-y-2">
                    {p.detaylar.map(d => (
                      <div key={d} className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                          <path d="M2.5 8l4 4 7-7" stroke={p.renk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[12.5px]" style={{ color: mu }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
