"use client";
import { PublicLayout } from "@/components/PublicLayout";
import { BRAND, useColors } from "@/lib/theme";

export default function BagisPage() {
  const c = useColors();

  const alanlar = [
    { baslik: "Öğrenci Bursu",    aciklama: "Eğitime kesintisiz devam eden öğrencilere doğrudan burs desteği.",     renk: BRAND.green  },
    { baslik: "Dergah Desteği",   aciklama: "Haftalık ilim dersleri ve faaliyet programlarının sürdürülmesi.",        renk: "#1D4ED8"    },
    { baslik: "Kafile Programı",  aciklama: "Gençleri birleştiren manevi seyahat ve buluşma programları.",            renk: "#7C3AED"    },
    { baslik: "Kitap & Materyal", aciklama: "Eğitim kaynakları, müfredat materyalleri ve öğrencilere kitap temini.", renk: "#92400E"    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Sol */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-6 h-px" style={{ background: BRAND.gold }} />
              <span className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: BRAND.gold }}>Bağış</span>
            </div>
            <h1
              className="font-extrabold leading-[1.06] mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: c.h, letterSpacing: "-0.025em" }}
            >
              Geleceğe Yatırım Yapın
            </h1>
            <p className="text-[16px] leading-[1.80] mb-10" style={{ color: c.b }}>
              Bağışlarınız öğrenci bursları, dergah faaliyetleri ve eğitim programlarının
              sürdürülmesine doğrudan katkı sağlar. Her katkı bir gencin geleceğine yatırımdır.
            </p>

            <div
              className="flex items-start gap-4 p-5 rounded-2xl border mb-8"
              style={{ background: BRAND.gold + "0D", borderColor: BRAND.gold + "40" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[14px] leading-[1.70]" style={{ color: c.b }}>
                Bağış işlemleri için lütfen bizimle doğrudan iletişime geçin.
                En kısa sürede size banka hesap bilgilerimizi ileteceğiz.
              </p>
            </div>

            <a
              href="/iletisim"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[14px] font-bold transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: BRAND.green, color: BRAND.gold }}
            >
              İletişime Geç
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          {/* Sağ — alan kartları */}
          <div className="grid grid-cols-2 gap-3">
            {alanlar.map(a => (
              <div
                key={a.baslik}
                className="p-6 rounded-2xl border"
                style={{ background: c.sr, borderColor: c.br }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: a.renk + "18" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.renk} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <p className="font-bold text-[14px] mb-2" style={{ color: c.h }}>{a.baslik}</p>
                <p className="text-[13px] leading-[1.65]" style={{ color: c.b }}>{a.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
