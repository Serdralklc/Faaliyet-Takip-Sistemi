"use client";

import { PublicLayout } from "@/components/PublicLayout";
import { useTheme } from "next-themes";
import { useState, useEffect, FormEvent } from "react";

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
    su:  dark ? "#0F241C" : "#F1F5F9",
    inp: dark ? "#193328" : "#FFFFFF",
    inpBr: dark ? "#2A4E3F" : "#D1D5DB",
  };
}

function MapPinIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" stroke={BRAND.green} strokeWidth="2" />
      <circle cx="12" cy="10" r="3" stroke={BRAND.green} strokeWidth="2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={BRAND.green} strokeWidth="2" />
      <path d="M22 6l-10 7L2 6" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" stroke={BRAND.green} strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke={BRAND.green} strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke={BRAND.green} strokeWidth="2" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke={BRAND.green} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

interface InfoCard {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function ContactInfoCard({ icon, title, content }: InfoCard) {
  const c = useColors();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.sr,
        border: `1px solid ${c.br}`,
        borderRadius: 16,
        padding: "1.5rem",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: BRAND.green + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, color: c.mu, marginBottom: 4 }}>{title}</p>
        <div style={{ fontSize: 15, color: c.h, fontWeight: 500 }}>{content}</div>
      </div>
    </div>
  );
}

export default function IletisimPage() {
  const c = useColors();
  const [form, setForm] = useState({ adSoyad: "", eposta: "", telefon: "", mesaj: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: c.inp,
    border: `1.5px solid ${c.inpBr}`,
    borderRadius: 10,
    padding: "0.65rem 1rem",
    fontSize: 15,
    color: c.h,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: c.mu,
    marginBottom: 6,
  };

  return (
    <PublicLayout>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          minHeight: "45vh",
          backgroundImage: "url(https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,28,21,0.72)" }} />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-10 py-16" style={{ zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ width: 32, height: 1, background: BRAND.gold, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              İletişim
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
              fontWeight: 800,
              color: "#F8FAFC",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              marginBottom: 20,
              maxWidth: 600,
            }}
          >
            İletişim
          </h1>
          <p style={{ maxWidth: 500, fontSize: 17, lineHeight: 1.7, color: "rgba(248,250,252,0.82)" }}>
            Sorularınız için bizimle iletişime geçin.
          </p>
        </div>
      </section>

      {/* CONTACT BODY */}
      <section style={{ background: c.bg, padding: "5rem 0" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">

            {/* LEFT: Info Cards */}
            <div>
              <div style={{ marginBottom: 36 }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
                  Bize Ulaşın
                </span>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
                    color: c.h,
                    letterSpacing: "-0.02em",
                    marginTop: 12,
                    marginBottom: 12,
                  }}
                >
                  İletişim Bilgilerimiz
                </h2>
                <p style={{ fontSize: 15, color: c.b, lineHeight: 1.7 }}>
                  Türkiye genelinde 81 ilde faaliyet gösteren yapımızla her zaman ulaşabilirsiniz.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <ContactInfoCard
                  icon={<MapPinIcon />}
                  title="Adres"
                  content={<span>Türkiye Geneli — 81 İl Teşkilatı</span>}
                />
                <ContactInfoCard
                  icon={<MailIcon />}
                  title="E-posta"
                  content={
                    <a href="mailto:iletisim@serhendi.org" style={{ color: BRAND.green, textDecoration: "none" }}>
                      iletisim@serhendi.org
                    </a>
                  }
                />
                <ContactInfoCard
                  icon={<PhoneIcon />}
                  title="Telefon"
                  content={
                    <a href="tel:+902120000000" style={{ color: c.h, textDecoration: "none" }}>
                      +90 (212) 000 00 00
                    </a>
                  }
                />
                <ContactInfoCard
                  icon={<ShareIcon />}
                  title="Sosyal Medya"
                  content={
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      <a href="#" style={{ color: BRAND.green, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                        Instagram
                      </a>
                      <a href="#" style={{ color: BRAND.green, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                        Twitter
                      </a>
                      <a href="#" style={{ color: BRAND.green, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                        YouTube
                      </a>
                    </div>
                  }
                />
              </div>
            </div>

            {/* RIGHT: Contact Form */}
            <div
              style={{
                background: c.sr,
                border: `1px solid ${c.br}`,
                borderRadius: 20,
                padding: "2.5rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              }}
            >
              {submitted ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#D1FAE5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                    }}
                  >
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 20, color: c.h, marginBottom: 12 }}>
                    Mesajınız İletildi
                  </h3>
                  <p style={{ fontSize: 15, color: c.b, lineHeight: 1.7 }}>
                    Mesajınız iletildi. En kısa sürede geri dönüş yapılacaktır.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ adSoyad: "", eposta: "", telefon: "", mesaj: "" }); }}
                    style={{
                      marginTop: 24,
                      background: "transparent",
                      border: `1.5px solid ${BRAND.green}`,
                      color: BRAND.green,
                      borderRadius: 10,
                      padding: "0.5rem 1.5rem",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Yeni Mesaj Gönder
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontWeight: 700, fontSize: 20, color: c.h, marginBottom: 8 }}>
                    Mesaj Gönderin
                  </h3>
                  <p style={{ fontSize: 14, color: c.b, marginBottom: 28 }}>
                    Formu doldurun, en kısa sürede size geri dönelim.
                  </p>
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <label style={labelStyle}>Ad Soyad *</label>
                      <input
                        type="text"
                        name="adSoyad"
                        value={form.adSoyad}
                        onChange={handleChange}
                        required
                        placeholder="Adınız ve soyadınız"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>E-posta *</label>
                      <input
                        type="email"
                        name="eposta"
                        value={form.eposta}
                        onChange={handleChange}
                        required
                        placeholder="ornek@eposta.com"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Telefon (isteğe bağlı)</label>
                      <input
                        type="tel"
                        name="telefon"
                        value={form.telefon}
                        onChange={handleChange}
                        placeholder="+90 5xx xxx xx xx"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Mesaj *</label>
                      <textarea
                        name="mesaj"
                        value={form.mesaj}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Mesajınızı buraya yazın..."
                        style={{ ...inputStyle, resize: "vertical" as const, fontFamily: "inherit" }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      style={{
                        background: sending ? "#4A9F6E" : BRAND.green,
                        color: BRAND.gold,
                        border: "none",
                        borderRadius: 12,
                        padding: "0.85rem 2rem",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: sending ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {sending ? "Gönderiliyor..." : "Mesaj Gönder"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAP */}
      <section style={{ background: c.su }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.22em", color: BRAND.gold }}>
              Konum
            </span>
            <h3
              style={{
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 2vw, 1.6rem)",
                color: c.h,
                letterSpacing: "-0.015em",
                marginTop: 8,
              }}
            >
              Türkiye Geneli Faaliyet Alanı
            </h3>
          </div>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: `1px solid ${c.br}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
              height: 420,
            }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12134839.386260502!2d25.663315!3d39.059929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14b0155c964f2671%3A0x40d9dbd42a625f2a!2zVMO8cmtpeWU!5e0!3m2!1str!2str!4v1699000000000!5m2!1str!2str"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Türkiye Haritası"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
