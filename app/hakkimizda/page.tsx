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

export default function HakkimizdaPage() {
  const dark = useIsDark();
  const h  = dark ? "#F5F0E8" : "#0A3520";
  const b  = dark ? "#E8E2D6" : "#1C5232";
  const mu = dark ? "#B8B0A0" : "#38694E";
  const bg = dark ? "#081C15" : "#EDE9DF";
  const sr = dark ? "#0F241C" : "#FFFFFF";
  const br = dark ? "#1F3D31" : "#D4C9B0";

  const degerler = [
    { n: "01", t: "İlim",     d: "Kur'an-ı Kerim'den temel İslam ilimlerine uzanan kapsamlı ve sistematik eğitim programları." },
    { n: "02", t: "Ahlak",    d: "Güçlü karakter, dürüstlük ve toplumsal sorumluluk bilinci taşıyan nesiller yetiştirmek." },
    { n: "03", t: "Hizmet",   d: "Türkiye'nin her köşesinde sahaya inen gönüllü kadrosuyla kesintisiz hizmet anlayışı." },
    { n: "04", t: "Kardeşlik",d: "Farklı şehirlerden gelen gençleri bir araya getiren kafile ve buluşma programları." },
  ];

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20">

        {/* Başlık */}
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-px" style={{ background: BRAND.gold }} />
            <span className="text-[11px] font-black uppercase tracking-[0.20em]" style={{ color: BRAND.gold }}>
              Hakkımızda
            </span>
          </div>
          <h1 className="font-black leading-[1.04] mb-6"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: h, letterSpacing: "-0.025em" }}>
            Gençliğe Değer,<br />Geleceğe Yatırım
          </h1>
          <p className="text-[16px] leading-[1.80]" style={{ color: b }}>
            Serhendi Vakfı bünyesindeki Gençlik Eğitim Birimi olarak 12 yılı aşkın tecrübemizle
            Türkiye'nin her köşesinde ilköğretimden üniversiteye kadar gençleri kucaklayan
            kapsamlı programlar yürütüyoruz.
          </p>
        </div>

        {/* İki sütun */}
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 mb-20">
          <div>
            <p className="text-[15px] leading-[1.85] mb-5" style={{ color: b }}>
              Amacımız yalnızca bilgi aktarmak değil; güçlü karakter, derin inanç ve
              toplumsal sorumluluk taşıyan nesiller yetiştirmektir. Kuruluşumuzdan bu yana
              binlerce genci eğitim, barınma ve manevi destek programlarıyla kucakladık.
            </p>
            <p className="text-[15px] leading-[1.85]" style={{ color: b }}>
              Türkiye'nin 81 ilinde faaliyet gösteren yapımız; il ve bölge sorumluları,
              eğitmenler ve gönüllülerden oluşan köklü bir teşkilat ağına dayanmaktadır.
            </p>
          </div>

          {/* Değerler listesi */}
          <div style={{ borderTop: `1px solid ${br}` }}>
            {degerler.map(d => (
              <div key={d.n} className="flex gap-4 py-5 border-b" style={{ borderColor: br }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: BRAND.green + "15", color: BRAND.green }}>{d.n}</span>
                <div>
                  <p className="font-bold text-[15px] mb-1" style={{ color: h }}>{d.t}</p>
                  <p className="text-[14px] leading-[1.65]" style={{ color: b }}>{d.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: br }}>
          {[
            { n: "81",    l: "İlde Aktif Yapılanma" },
            { n: "500+",  l: "Aktif Gönüllü"        },
            { n: "10.000+",l: "Öğrenciye Ulaşıldı"  },
            { n: "12+",   l: "Yıllık Tecrübe"       },
          ].map(s => (
            <div key={s.l} className="px-8 py-10 text-center" style={{ background: sr }}>
              <p className="font-black leading-none mb-2"
                style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", color: h, letterSpacing: "-0.04em" }}>{s.n}</p>
              <p className="text-[13px] font-medium" style={{ color: mu }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
