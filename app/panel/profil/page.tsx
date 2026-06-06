"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";

const inputCls = "w-full border-2 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

export default function ProfilPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [sifreForm, setSifreForm] = useState({ eskiSifre: "", yeniSifre: "", tekrar: "" });
  const [sifreStatus, setSifreStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sifreMsg, setSifreMsg] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSifreDegistir(e: React.FormEvent) {
    e.preventDefault();
    if (sifreForm.yeniSifre.length < 8) {
      setSifreMsg("Yeni şifre en az 8 karakter olmalıdır.");
      setSifreStatus("error");
      return;
    }
    if (sifreForm.yeniSifre !== sifreForm.tekrar) {
      setSifreMsg("Yeni şifreler eşleşmiyor.");
      setSifreStatus("error");
      return;
    }
    setSifreStatus("loading");
    const res = await fetch("/api/profil/sifre-degistir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eskiSifre: sifreForm.eskiSifre, yeniSifre: sifreForm.yeniSifre }),
    });
    const data = await res.json();
    if (res.ok) {
      setSifreStatus("success");
      setSifreMsg("Şifreniz başarıyla güncellendi.");
      setSifreForm({ eskiSifre: "", yeniSifre: "", tekrar: "" });
    } else {
      setSifreStatus("error");
      setSifreMsg(data.error || "Hata oluştu.");
    }
    setTimeout(() => { setSifreStatus("idle"); setSifreMsg(""); }, 4000);
  }

  if (!user) return null;

  const konum = user.activeIlAd
    ? `${user.activeIlAd} İl Sorumlusu`
    : user.activeBolgeAd
    ? `${user.activeBolgeAd} Bölge Sorumlusu`
    : ROLE_LABELS[user.role as Role];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Hesabım</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Profil bilgileriniz ve şifre yönetimi</p>
      </div>

      {/* Profil kartı */}
      <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-th)" }}>
          <User size={18} className="text-blue-500" />
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Profil Bilgileri</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0">
              {user.ad?.[0]}{user.soyad?.[0]}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{user.ad} {user.soyad}</p>
              <p className="text-sm font-semibold text-blue-600">{konum}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: "Ad", value: user.ad },
              { label: "Soyad", value: user.soyad },
              { label: "E-posta", value: user.email },
              { label: "Görev", value: konum },
            ].map(f => (
              <div key={f.label} className="rounded-lg p-3" style={{ background: "var(--bg-page)" }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Şifre değiştir */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-th)" }}>
          <Lock size={18} className="text-orange-500" />
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Şifre Değiştir</h2>
        </div>
        <form onSubmit={handleSifreDegistir} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              Mevcut Şifre
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required value={sifreForm.eskiSifre}
                onChange={e => setSifreForm(p => ({ ...p, eskiSifre: e.target.value }))}
                className={inputCls + " pr-20"}
                placeholder="••••••••"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                style={{ color: "var(--text-muted)" }}>
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              Yeni Şifre <span className="normal-case">(min 8 karakter)</span>
            </label>
            <input
              type={showPass ? "text" : "password"}
              required value={sifreForm.yeniSifre}
              onChange={e => setSifreForm(p => ({ ...p, yeniSifre: e.target.value }))}
              className={inputCls}
              placeholder="••••••••"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              Yeni Şifre Tekrar
            </label>
            <input
              type={showPass ? "text" : "password"}
              required value={sifreForm.tekrar}
              onChange={e => setSifreForm(p => ({ ...p, tekrar: e.target.value }))}
              className={inputCls}
              placeholder="••••••••"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
            />
          </div>

          {sifreMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
              sifreStatus === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {sifreStatus === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {sifreMsg}
            </div>
          )}

          <button type="submit" disabled={sifreStatus === "loading"}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm">
            {sifreStatus === "loading" ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Güncelleniyor...</>
            ) : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
