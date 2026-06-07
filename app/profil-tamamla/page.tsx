"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Il    { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

type SistemKey = "EGITIMCI" | "UNIVERSITE" | "LISE";

const SISTEM_LABELS: Record<SistemKey, { bolge: string; il: string; baslik: string; renk: string }> = {
  EGITIMCI:   {
    bolge:  "Bölge Eğitimcisi",
    il:     "İl Eğitimcisi",
    baslik: "Eğitimci Kadrosu",
    renk:   "#0B6B3A",
  },
  UNIVERSITE: {
    bolge:  "Bölge Üniversite Gençlik Sorumlusu",
    il:     "İl Üniversite Gençlik Sorumlusu",
    baslik: "Üniversite Gençlik",
    renk:   "#1D4ED8",
  },
  LISE: {
    bolge:  "Bölge Lise Gençlik Sorumlusu",
    il:     "İl Lise Gençlik Sorumlusu",
    baslik: "Lise Gençlik",
    renk:   "#7C3AED",
  },
};

export default function ProfilTamamlaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bolgeler, setBolgeler] = useState<Bolge[]>([]);
  const [form, setForm] = useState({
    gorev: "" as "" | "IL_SORUMLUSU" | "BOLGE_SORUMLUSU",
    bolgeId: "", ilId: "", telefon: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/bolgeler?public=1").then(r => r.json()).then(setBolgeler);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "BEKLEYEN") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") return null;
  if (!session?.user) { router.push("/giris"); return null; }

  const sistemKey = (session.user.sistem ?? "EGITIMCI") as SistemKey;
  const sl        = SISTEM_LABELS[sistemKey] ?? SISTEM_LABELS.EGITIMCI;
  const seciliBolge = bolgeler.find(b => b.id === form.bolgeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.gorev)                                          { setError("Başvurulan görevi seçiniz."); return; }
    if (!form.bolgeId)                                        { setError("Bölge seçiniz."); return; }
    if (form.gorev === "IL_SORUMLUSU" && !form.ilId)          { setError("İl seçiniz."); return; }

    setLoading(true);
    const res  = await fetch("/api/profil-tamamla", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setSuccess(true);
    else setError(data.error || "Hata oluştu.");
  }

  /* ── Başarı ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F6F8F5" }}>
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border" style={{ borderColor: "#E2E8F0" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: sl.renk + "15" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sl.renk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <h2 className="text-[20px] font-black mb-2" style={{ color: "#0F172A" }}>Başvurunuz Alındı!</h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: "#64748B" }}>
            Yönetici inceleyip onayladıktan sonra{" "}
            <span className="font-semibold" style={{ color: sl.renk }}>{sl.baslik}</span>{" "}
            sistemine giriş yapabilirsiniz.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/giris" })}
            className="mt-6 text-[13px] font-bold hover:underline"
            style={{ color: sl.renk }}
          >
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border-2 rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none transition bg-white"
    + " border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]";
  const labelCls = "block text-[12px] font-bold mb-1.5 uppercase tracking-wide text-[#64748B]";

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4" style={{ background: "#F6F8F5" }}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-xl border"
        style={{ background: "#fff", borderColor: "#E2E8F0" }}
      >
        {/* Header */}
        <div
          className="px-8 py-7"
          style={{ background: `linear-gradient(135deg, ${sl.renk}E8, ${sl.renk})` }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
            {sl.baslik} · Başvuru
          </p>
          <h1 className="text-[20px] font-black text-white" style={{ letterSpacing: "-0.02em" }}>
            Başvuru Bilgilerini Tamamla
          </h1>
          <p className="text-[13px] mt-1.5" style={{ color: "rgba(255,255,255,0.70)" }}>
            Hoş geldin, <span className="font-bold">{session.user.ad} {session.user.soyad}</span>
          </p>
        </div>

        <div className="px-8 py-7">
          <p className="text-[13px] leading-[1.65] mb-6" style={{ color: "#64748B" }}>
            Google hesabınızla kaydoldunuz. Hangi görev için başvurduğunuzu seçin.
            Yönetici onayından sonra sisteme erişebilirsiniz.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Telefon */}
            <div>
              <label className={labelCls}>
                Telefon <span className="font-normal normal-case tracking-normal text-[#94A3B8]">(opsiyonel)</span>
              </label>
              <input
                type="tel" value={form.telefon}
                onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                placeholder="05xx xxx xx xx"
                className={inputCls}
                onFocus={e => (e.target.style.borderColor = sl.renk)}
                onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* ── Görev seçimi — Bölge SOL / İl SAĞ ── */}
            <div>
              <label className={labelCls}>
                Başvurulan Görev <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "BOLGE_SORUMLUSU", label: sl.bolge, side: "Bölge Yetkilisi" },
                  { val: "IL_SORUMLUSU",    label: sl.il,    side: "İl Yetkilisi"    },
                ].map(({ val, label, side }) => (
                  <label
                    key={val}
                    className="relative flex flex-col gap-1.5 border-2 rounded-2xl px-4 py-4 cursor-pointer transition"
                    style={{
                      borderColor: form.gorev === val ? sl.renk : "#E2E8F0",
                      background:  form.gorev === val ? sl.renk + "08" : "#fff",
                    }}
                  >
                    <input
                      type="radio" name="gorev" value={val}
                      checked={form.gorev === val}
                      onChange={() => setForm(p => ({ ...p, gorev: val as typeof form.gorev, bolgeId: "", ilId: "" }))}
                      className="sr-only"
                    />
                    <div
                      className="absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition"
                      style={{
                        borderColor: form.gorev === val ? sl.renk : "#CBD5E1",
                        background:  form.gorev === val ? sl.renk : "transparent",
                      }}
                    >
                      {form.gorev === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: form.gorev === val ? sl.renk : "#94A3B8" }}>
                      {side}
                    </span>
                    <span className="text-[13px] font-bold leading-tight pr-4" style={{ color: form.gorev === val ? "#0F172A" : "#475569" }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bölge */}
            {form.gorev && (
              <div>
                <label className={labelCls}>Bölge <span className="text-red-500">*</span></label>
                <select
                  value={form.bolgeId}
                  onChange={e => setForm(p => ({ ...p, bolgeId: e.target.value, ilId: "" }))}
                  className={inputCls}
                  onFocus={e => (e.target.style.borderColor = sl.renk)}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                >
                  <option value="">Bölge seçiniz</option>
                  {bolgeler.map(b => <option key={b.id} value={b.id}>{b.ad}</option>)}
                </select>
              </div>
            )}

            {/* İl */}
            {form.gorev === "IL_SORUMLUSU" && seciliBolge && (
              <div>
                <label className={labelCls}>İl <span className="text-red-500">*</span></label>
                <select
                  value={form.ilId}
                  onChange={e => setForm(p => ({ ...p, ilId: e.target.value }))}
                  className={inputCls}
                  onFocus={e => (e.target.style.borderColor = sl.renk)}
                  onBlur={e  => (e.target.style.borderColor = "#E2E8F0")}
                >
                  <option value="">İl seçiniz</option>
                  {seciliBolge.iller.map(il => <option key={il.id} value={il.id}>{il.ad}</option>)}
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-3 border" style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
                <p className="text-[13px] font-bold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-[14px] font-black text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: sl.renk }}
            >
              {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
