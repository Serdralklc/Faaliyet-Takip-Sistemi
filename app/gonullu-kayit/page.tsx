"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";

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
  };
}

const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];

export default function GonulluKayitPage() {
  const router = useRouter();
  const c = useColors();

  const [form, setForm] = useState({
    adSoyad: "", telefon: "", email: "", sifre: "", sifreTekrar: "",
    ogrenim: "", ogrenimTuru: "", bolum: "", okul: "", il: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inputSt = {
    background:       c.sr,
    border:           `1px solid ${c.br}`,
    borderRadius:     "0.75rem",
    padding:          "0.625rem 1rem",
    width:            "100%",
    fontSize:         "14px",
    color:            c.h,
    outline:          "none",
    WebkitBoxShadow:  `0 0 0 1000px ${c.sr} inset`,
    WebkitTextFillColor: c.h,
  } as React.CSSProperties;

  const labelSt = { color: c.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" } as React.CSSProperties;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.sifre !== form.sifreTekrar) { setError("Şifreler eşleşmiyor."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/gonullu/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adSoyad:    form.adSoyad,
          telefon:    form.telefon,
          email:      form.email,
          sifre:      form.sifre,
          ogrenim:    form.ogrenim,
          ogrenimTuru: form.ogrenimTuru || undefined,
          bolum:      form.bolum || undefined,
          okul:       form.okul  || undefined,
          il:         form.il   || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Kayıt başarısız."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/gonullu/giris"), 2000);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: c.bg }} className="flex items-center justify-center px-4 py-12">
      <div style={{ background: c.sr, border: `1px solid ${c.br}`, borderRadius: "1.5rem", padding: "2.5rem", width: "100%", maxWidth: "560px" }}>

        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl" style={{ background: BRAND.green + "18" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style={{ color: BRAND.green, fontSize: "12px", fontWeight: 700 }}>Gönüllü Kaydı</span>
          </div>
          <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>Serhendi Gençlik</h1>
          <p style={{ color: c.b, fontSize: "14px", marginTop: "4px" }}>Gönüllü sistemine kayıt olun</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: BRAND.green + "20" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p style={{ color: c.h, fontWeight: 700, fontSize: "1.1rem" }}>Kayıt Başarılı!</p>
            <p style={{ color: c.b, fontSize: "14px", marginTop: "6px" }}>Giriş sayfasına yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px" }}>
                <p style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</p>
              </div>
            )}

            {/* Ad Soyad */}
            <div>
              <label style={labelSt}>Ad Soyad *</label>
              <input type="text" required placeholder="Adınız Soyadınız" style={inputSt}
                value={form.adSoyad} onChange={e => set("adSoyad", e.target.value)}
                onFocus={e => (e.target.style.border = `1px solid ${BRAND.green}`)}
                onBlur={e  => (e.target.style.border = `1px solid ${c.br}`)} />
            </div>

            {/* Telefon */}
            <div>
              <label style={labelSt}>Telefon *</label>
              <input type="tel" required placeholder="05xx xxx xxxx" style={inputSt}
                value={form.telefon} onChange={e => set("telefon", e.target.value)}
                onFocus={e => (e.target.style.border = `1px solid ${BRAND.green}`)}
                onBlur={e  => (e.target.style.border = `1px solid ${c.br}`)} />
            </div>

            {/* E-posta */}
            <div>
              <label style={labelSt}>E-posta *</label>
              <div
                style={{ display: "flex", alignItems: "center", background: c.sr, border: `1px solid ${c.br}`, borderRadius: "0.75rem", transition: "border-color 0.15s" }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = BRAND.green)}
                onBlurCapture={e  => (e.currentTarget.style.borderColor = c.br)}
              >
                <input type="email" required placeholder="ornek@email.com"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "0.625rem 1rem", fontSize: "14px", color: c.h, minWidth: 0, WebkitBoxShadow: `0 0 0 1000px ${c.sr} inset`, WebkitTextFillColor: c.h } as React.CSSProperties}
                  value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>

            {/* Öğrenim Durumu */}
            <div>
              <label style={labelSt}>Öğrenim Durumu *</label>
              <select required style={{ ...inputSt, cursor: "pointer" }}
                value={form.ogrenim} onChange={e => set("ogrenim", e.target.value)}
                onFocus={e => (e.target.style.border = `1px solid ${BRAND.green}`)}
                onBlur={e  => (e.target.style.border = `1px solid ${c.br}`)}>
                <option value="">Seçiniz...</option>
                <option value="ILKOKUL">İlkokul</option>
                <option value="ORTAOKUL">Ortaokul</option>
                <option value="LISE">Lise</option>
                <option value="UNIVERSITE">Üniversite</option>
              </select>
            </div>

            {/* Üniversite ek alanları */}
            {form.ogrenim === "UNIVERSITE" && (
              <>
                <div>
                  <label style={labelSt}>Öğrenim Türü</label>
                  <select style={{ ...inputSt, cursor: "pointer" }}
                    value={form.ogrenimTuru} onChange={e => set("ogrenimTuru", e.target.value)}
                    onFocus={e => (e.target.style.borderColor = BRAND.green)}
                    onBlur={e  => (e.target.style.borderColor = c.br)}>
                    <option value="">Seçiniz...</option>
                    <option value="ONLISANS">Ön Lisans</option>
                    <option value="LISANS">Lisans</option>
                    <option value="YUKSEK_LISANS">Yüksek Lisans</option>
                    <option value="DOKTORA">Doktora</option>
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Bölüm</label>
                  <input type="text" placeholder="Bölümünüz" style={inputSt}
                    value={form.bolum} onChange={e => set("bolum", e.target.value)}
                    onFocus={e => (e.target.style.borderColor = BRAND.green)}
                    onBlur={e  => (e.target.style.borderColor = c.br)} />
                </div>
                <div>
                  <label style={labelSt}>Okul</label>
                  <input type="text" placeholder="Üniversite adı" style={inputSt}
                    value={form.okul} onChange={e => set("okul", e.target.value)}
                    onFocus={e => (e.target.style.borderColor = BRAND.green)}
                    onBlur={e  => (e.target.style.borderColor = c.br)} />
                </div>
              </>
            )}

            {/* İl */}
            <div>
              <label style={labelSt}>İkamet Edilen İl</label>
              <select style={{ ...inputSt, cursor: "pointer" }}
                value={form.il} onChange={e => set("il", e.target.value)}
                onFocus={e => (e.target.style.border = `1px solid ${BRAND.green}`)}
                onBlur={e  => (e.target.style.border = `1px solid ${c.br}`)}>
                <option value="">Seçiniz...</option>
                {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
              </select>
            </div>

            {/* Şifre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelSt}>Şifre *</label>
                <input type="password" required placeholder="En az 6 karakter" style={inputSt}
                  value={form.sifre} onChange={e => set("sifre", e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
              <div>
                <label style={labelSt}>Şifre Tekrar *</label>
                <input type="password" required placeholder="Şifreyi tekrar girin" style={inputSt}
                  value={form.sifreTekrar} onChange={e => set("sifreTekrar", e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: BRAND.green, color: BRAND.gold, width: "100%", padding: "12px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", marginTop: "8px" }}
            >
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", color: c.mu, fontSize: "13px", marginTop: "20px" }}>
          Zaten hesabınız var mı?{" "}
          <Link href="/gonullu/giris" style={{ color: BRAND.green, fontWeight: 600 }}>Giriş yapın</Link>
        </p>
      </div>
    </div>
  );
}
