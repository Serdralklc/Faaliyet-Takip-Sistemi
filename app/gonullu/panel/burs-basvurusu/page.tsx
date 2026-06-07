"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const BRAND = { green: "#0B6B3A", gold: "#D4AF37" };

function useColors() {
  const { resolvedTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const dark = m && resolvedTheme === "dark";
  return {
    card: dark ? "#142C22" : "#FFFFFF",
    br:   dark ? "#1F3D31" : "#E2E8F0",
    h:    dark ? "#F8FAFC" : "#0F172A",
    b:    dark ? "#CBD5E1" : "#475569",
    mu:   dark ? "#94A3B8" : "#64748B",
    inp:  dark ? "#0F241C" : "#FFFFFF",
  };
}

const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];

export default function BursBasvurusuPage() {
  const router = useRouter();
  const c = useColors();
  const [form, setForm] = useState({
    adSoyad: "", telefon: "", email: "", universite: "",
    fakulteBolum: "", sinif: "", il: "", madiDurum: "", aciklama: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inputSt = {
    background: c.inp, border: `1px solid ${c.br}`, borderRadius: "0.75rem",
    padding: "0.625rem 1rem", width: "100%", fontSize: "14px", color: c.h, outline: "none",
  } as React.CSSProperties;
  const labelSt = { color: c.mu, fontSize: "12px", fontWeight: 700 as const, textTransform: "uppercase" as const, letterSpacing: "0.06em", display: "block" as const, marginBottom: "6px" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gonullu/burs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Başvuru gönderilemedi."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/gonullu/panel/basvurularim"), 2000);
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Nezir Burs Programı</p>
        <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.025em" }}>Burs Başvurusu</h1>
        <p style={{ color: c.b, fontSize: "14px", marginTop: "6px" }}>
          Burs başvurunuzu eksiksiz doldurarak gönderin. Başvurunuzun durumunu "Başvurularım" sayfasından takip edebilirsiniz.
        </p>
      </div>

      <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "28px" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: BRAND.green + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p style={{ color: c.h, fontWeight: 700, fontSize: "1.1rem" }}>Başvurunuz Alındı!</p>
            <p style={{ color: c.b, fontSize: "14px", marginTop: "6px" }}>Başvurularım sayfasına yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "20px" }}>
                <p style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Ad Soyad *</label>
                <input required style={inputSt} placeholder="Adınız Soyadınız"
                  value={form.adSoyad} onChange={e => set("adSoyad", e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
              <div>
                <label style={labelSt}>Telefon *</label>
                <input required type="tel" style={inputSt} placeholder="05xx xxx xxxx"
                  value={form.telefon} onChange={e => set("telefon", e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>E-posta</label>
              <input type="email" style={inputSt} placeholder="ornek@email.com"
                value={form.email} onChange={e => set("email", e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>Üniversite *</label>
              <input required style={inputSt} placeholder="Üniversite adı"
                value={form.universite} onChange={e => set("universite", e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Fakülte / Bölüm *</label>
                <input required style={inputSt} placeholder="Bölümünüz"
                  value={form.fakulteBolum} onChange={e => set("fakulteBolum", e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)} />
              </div>
              <div>
                <label style={labelSt}>Sınıf *</label>
                <select required style={{ ...inputSt, cursor: "pointer" }}
                  value={form.sinif} onChange={e => set("sinif", e.target.value)}
                  onFocus={e => (e.target.style.borderColor = BRAND.green)}
                  onBlur={e  => (e.target.style.borderColor = c.br)}>
                  <option value="">Seçiniz...</option>
                  <option value="Hazırlık">Hazırlık</option>
                  <option value="1. Sınıf">1. Sınıf</option>
                  <option value="2. Sınıf">2. Sınıf</option>
                  <option value="3. Sınıf">3. Sınıf</option>
                  <option value="4. Sınıf">4. Sınıf</option>
                  <option value="5. Sınıf+">5. Sınıf+</option>
                  <option value="Yüksek Lisans">Yüksek Lisans</option>
                  <option value="Doktora">Doktora</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>İkamet Edilen İl *</label>
              <select required style={{ ...inputSt, cursor: "pointer" }}
                value={form.il} onChange={e => set("il", e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)}>
                <option value="">Seçiniz...</option>
                {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>Maddi Durum Açıklaması *</label>
              <textarea required rows={3} style={{ ...inputSt, resize: "none" }}
                placeholder="Ailenizin gelir durumu, kardeş sayısı vb. hakkında kısa bilgi verin."
                value={form.madiDurum} onChange={e => set("madiDurum", e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelSt}>Başvuru Açıklaması *</label>
              <textarea required rows={4} style={{ ...inputSt, resize: "none" }}
                placeholder="Neden burs başvurusunda bulunuyorsunuz? Akademik başarılarınız, hedefleriniz..."
                value={form.aciklama} onChange={e => set("aciklama", e.target.value)}
                onFocus={e => (e.target.style.borderColor = BRAND.green)}
                onBlur={e  => (e.target.style.borderColor = c.br)} />
            </div>

            <div style={{ background: BRAND.gold + "0D", border: `1px solid ${BRAND.gold}40`, borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "24px", display: "flex", gap: "10px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ color: c.b, fontSize: "13px" }}>Öğrenci belgesi ve destekleyici diğer belgelerinizi yöneticiye ayrıca iletebilirsiniz. Belge yükleme özelliği yakında eklenecektir.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: BRAND.green, color: BRAND.gold, width: "100%", padding: "13px", borderRadius: "0.75rem", fontWeight: 700, fontSize: "14px", cursor: loading ? "wait" : "pointer", border: "none" }}
            >
              {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
