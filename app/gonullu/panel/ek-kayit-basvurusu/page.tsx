"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BRAND  = { green: "#0B6B3A", gold: "#D4AF37" };
const COLORS = { card: "#FFFFFF", br: "#E2E8F0", h: "#0F172A", b: "#475569", mu: "#64748B", inp: "#FFFFFF" };

const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];

const inputSt: React.CSSProperties = {
  background: COLORS.inp, border: `1px solid ${COLORS.br}`, borderRadius: "0.75rem",
  padding: "0.625rem 1rem", width: "100%", fontSize: "14px", color: COLORS.h, outline: "none",
  boxSizing: "border-box",
};
const labelSt: React.CSSProperties = {
  color: COLORS.mu, fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.06em", display: "block", marginBottom: "6px",
};

function Section({ title }: { title: string }) {
  return (
    <div style={{ borderBottom: `2px solid ${BRAND.green}20`, marginBottom: "20px", paddingBottom: "6px" }}>
      <p style={{ color: BRAND.green, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{title}</p>
    </div>
  );
}

export default function EkKayitBasvurusuPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    ogrenciAd: "", ogrenciSoyad: "", telefon: "",
    geldigiUlke: "", geldigiIl: "", geldigiIlce: "",
    gidecegiBolge: "", gidecegiIl: "", gidecegiIlce: "",
    universite: "", fakulte: "", bolum: "", kayitTipi: "",
    veliAdSoyad: "", veliTelefon: "",
    referansAdSoyad: "", referansTelefon: "", referansGorev: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inp = (k: keyof typeof form, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => ({
    style: inputSt, value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = BRAND.green),
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = COLORS.br),
    ...extra,
  });
  const sel = (k: keyof typeof form) => ({
    style: { ...inputSt, cursor: "pointer" } as React.CSSProperties,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => set(k, e.target.value),
    onFocus: (e: React.FocusEvent<HTMLSelectElement>) => (e.target.style.borderColor = BRAND.green),
    onBlur:  (e: React.FocusEvent<HTMLSelectElement>) => (e.target.style.borderColor = COLORS.br),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gonullu/ek-kayit", {
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
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Serhendi Vakfı</p>
        <h1 style={{ color: COLORS.h, fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.025em" }}>Öğrenci Evi / Apart / Yurt Başvurusu</h1>
        <p style={{ color: COLORS.b, fontSize: "14px", marginTop: "6px" }}>
          Formu eksiksiz doldurun. Başvurunuzun durumunu "Başvurularım" sayfasından takip edebilirsiniz.
        </p>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.br}`, borderRadius: "1.25rem", padding: "28px" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: BRAND.green + "20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p style={{ color: COLORS.h, fontWeight: 700, fontSize: "1.1rem" }}>Başvurunuz Alındı!</p>
            <p style={{ color: COLORS.b, fontSize: "14px", marginTop: "6px" }}>Başvurularım sayfasına yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "12px 16px", marginBottom: "20px" }}>
                <p style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</p>
              </div>
            )}

            {/* Öğrenci Bilgileri */}
            <Section title="Öğrenci Bilgileri" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Öğrenci Adı *</label>
                <input required placeholder="Ad" {...inp("ogrenciAd")} />
              </div>
              <div>
                <label style={labelSt}>Öğrenci Soyadı *</label>
                <input required placeholder="Soyad" {...inp("ogrenciSoyad")} />
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>Cep Telefonu *</label>
              <input required type="tel" placeholder="05xx xxx xxxx" {...inp("telefon")} />
            </div>

            {/* Geldiği Yer */}
            <Section title="Geldiği Yer" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Ülke</label>
                <input placeholder="Türkiye" {...inp("geldigiUlke")} />
              </div>
              <div>
                <label style={labelSt}>İl</label>
                <select {...sel("geldigiIl")}>
                  <option value="">Seçiniz...</option>
                  {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>İlçe</label>
                <input placeholder="İlçe / Merkez" {...inp("geldigiIlce")} />
              </div>
            </div>

            {/* Gideceği Yer */}
            <Section title="Gideceği Yer" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Bölge</label>
                <input placeholder="Bölge adı" {...inp("gidecegiBolge")} />
              </div>
              <div>
                <label style={labelSt}>İl</label>
                <select {...sel("gidecegiIl")}>
                  <option value="">Seçiniz...</option>
                  {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>İlçe</label>
                <input placeholder="İlçe / Merkez" {...inp("gidecegiIlce")} />
              </div>
            </div>

            {/* Üniversite Bilgileri */}
            <Section title="Üniversite Bilgileri" />
            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>Kazandığı Üniversite *</label>
              <input required placeholder="Üniversite adı" {...inp("universite")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Fakülte *</label>
                <input required placeholder="Fakülte" {...inp("fakulte")} />
              </div>
              <div>
                <label style={labelSt}>Bölüm *</label>
                <input required placeholder="Bölüm" {...inp("bolum")} />
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>Kayıt Tipi *</label>
              <select required {...sel("kayitTipi")}>
                <option value="">Seçiniz...</option>
                <option value="Yurt">Yurt</option>
                <option value="Apart">Apart</option>
                <option value="Öğrenci Evi">Öğrenci Evi</option>
                <option value="Aile Yanı">Aile Yanı</option>
              </select>
            </div>

            {/* Veli Bilgileri */}
            <Section title="Veli Bilgileri" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Velinin Adı Soyadı</label>
                <input placeholder="Ad Soyad" {...inp("veliAdSoyad")} />
              </div>
              <div>
                <label style={labelSt}>Velinin Cep Telefonu</label>
                <input type="tel" placeholder="05xx xxx xxxx" {...inp("veliTelefon")} />
              </div>
            </div>

            {/* Referans Bilgileri */}
            <Section title="Referans Bilgileri" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelSt}>Referans Adı Soyadı</label>
                <input placeholder="Ad Soyad" {...inp("referansAdSoyad")} />
              </div>
              <div>
                <label style={labelSt}>Referans Cep Telefonu</label>
                <input type="tel" placeholder="05xx xxx xxxx" {...inp("referansTelefon")} />
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelSt}>Referansın Vakıftaki Görevi</label>
              <input placeholder="Vakıftaki görevi" {...inp("referansGorev")} />
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
