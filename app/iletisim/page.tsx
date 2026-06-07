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

export default function IletisimPage() {
  const dark = useIsDark();
  const h  = dark ? "#F5F0E8" : "#0A3520";
  const b  = dark ? "#E8E2D6" : "#1C5232";
  const mu = dark ? "#B8B0A0" : "#38694E";
  const sr = dark ? "#0F241C" : "#FFFFFF";
  const br = dark ? "#1F3D31" : "#D4C9B0";
  const bg = dark ? "#081C15" : "#EDE9DF";

  const inputCls = "w-full border-2 rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none transition"
  const inputSt  = { background: sr, borderColor: br, color: h } as React.CSSProperties;
  const labelCls = "block text-[12px] font-bold mb-1.5 uppercase tracking-wide";

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-20">

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Sol */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-px" style={{ background: BRAND.gold }} />
              <span className="text-[11px] font-black uppercase tracking-[0.20em]" style={{ color: BRAND.gold }}>İletişim</span>
            </div>
            <h1 className="font-black leading-[1.04] mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: h, letterSpacing: "-0.025em" }}>
              Bize Ulaşın
            </h1>
            <p className="text-[15px] leading-[1.80] mb-10" style={{ color: b }}>
              Serhendi Gençlik faaliyetleri, gönüllülük veya bağış hakkında bilgi almak için
              bizimle iletişime geçebilirsiniz.
            </p>

            <div className="space-y-6">
              {[
                { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "E-posta", val: "iletisim@serhendi.com" },
                { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Konum", val: "Türkiye Geneli, 81 İl" },
              ].map(c => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: BRAND.green + "15" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={c.icon}/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wide mb-0.5" style={{ color: mu }}>{c.label}</p>
                    <p className="text-[15px] font-semibold" style={{ color: h }}>{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ — form */}
          <div className="rounded-2xl p-8 border" style={{ background: sr, borderColor: br }}>
            <h2 className="font-black text-[1.1rem] mb-6" style={{ color: h }}>Mesaj Gönderin</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ color: mu }}>Ad</label>
                  <input type="text" placeholder="Adınız" className={inputCls} style={inputSt}
                    onFocus={e => (e.target.style.borderColor = BRAND.green)}
                    onBlur={e  => (e.target.style.borderColor = br)} />
                </div>
                <div>
                  <label className={labelCls} style={{ color: mu }}>Soyad</label>
                  <input type="text" placeholder="Soyadınız" className={inputCls} style={inputSt}
                    onFocus={e => (e.target.style.borderColor = BRAND.green)}
                    onBlur={e  => (e.target.style.borderColor = br)} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ color: mu }}>E-posta</label>
                <input type="email" placeholder="ornek@email.com" className={inputCls} style={inputSt}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = br)} />
              </div>
              <div>
                <label className={labelCls} style={{ color: mu }}>Konu</label>
                <input type="text" placeholder="Mesajınızın konusu" className={inputCls} style={inputSt}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = br)} />
              </div>
              <div>
                <label className={labelCls} style={{ color: mu }}>Mesaj</label>
                <textarea rows={4} placeholder="Mesajınızı buraya yazın..." className={inputCls} style={{ ...inputSt, resize: "none" }}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = br)} />
              </div>
              <button type="submit"
                className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition hover:opacity-90 active:scale-[0.98]"
                style={{ background: BRAND.green }}>
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
