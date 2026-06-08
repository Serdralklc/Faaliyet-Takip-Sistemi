"use client";

import { useState } from "react";
import type { Sistem } from "@/app/generated/prisma/client";

interface Sorumlu {
  adSoyad: string;
  email: string;
}

interface SonFaaliyet {
  yil: number;
  donem: string;
  createdAt: string;
}

interface Il {
  id: string;
  ad: string;
  sorumlu: Sorumlu | null;
  sonFaaliyet: SonFaaliyet | null;
}

interface Bolge {
  id: string;
  no: number;
  ad: string;
  iller: Il[];
}

interface SistemVeri {
  sistem: Sistem;
  bolgeler: Bolge[];
}

const SISTEM_CONFIG: Record<Sistem, { label: string; color: string; lightBg: string }> = {
  EGITIMCI:  { label: "Eğitimci",          color: "#0B6B3A", lightBg: "#DCFCE7" },
  UNIVERSITE:{ label: "Üniversite Gençlik", color: "#1D4ED8", lightBg: "#DBEAFE" },
  LISE:      { label: "Lise Gençlik",       color: "#7C3AED", lightBg: "#EDE9FE" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Bugün";
  if (d === 1) return "Dün";
  if (d < 30) return `${d} gün önce`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} ay önce`;
  return `${Math.floor(m / 12)} yıl önce`;
}

function computeStats(bolgeler: Bolge[]) {
  const iller = bolgeler.flatMap(b => b.iller);
  return {
    toplamIl: iller.length,
    veriGirilmis: iller.filter(il => il.sonFaaliyet !== null).length,
    sorumluAtanmis: iller.filter(il => il.sorumlu !== null).length,
  };
}

function hasVeri(il: Il): boolean {
  return il.sonFaaliyet !== null;
}

export function BolgelerClient({ sistemVerileri, lockedSistem }: { sistemVerileri: SistemVeri[]; lockedSistem?: Sistem | null }) {
  const [aktifSistem, setAktifSistem] = useState<Sistem>(lockedSistem ?? "EGITIMCI");
  const [acikBolgeler, setAcikBolgeler] = useState<Set<string>>(new Set());

  const veri = sistemVerileri.find(s => s.sistem === aktifSistem)!;
  const cfg  = SISTEM_CONFIG[aktifSistem];
  const stats = computeStats(veri.bolgeler);

  function toggleBolge(id: string) {
    setAcikBolgeler(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Başlık */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
          COĞRAFİ YAPI
        </p>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Bölge & İl Yönetimi
        </h1>
      </div>

      {/* Sistem sekmeleri — lockedSistem varsa tek sekme göster */}
      {!lockedSistem && (
        <div className="flex gap-1 p-1 rounded-xl border w-fit"
          style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
          {(["EGITIMCI", "UNIVERSITE", "LISE"] as Sistem[]).map(s => {
            const c = SISTEM_CONFIG[s];
            const aktif = aktifSistem === s;
            return (
              <button key={s}
                onClick={() => { setAktifSistem(s); setAcikBolgeler(new Set()); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={aktif
                  ? { background: c.color, color: "#fff" }
                  : { color: "var(--text-muted)" }
                }>
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* İstatistik kartları */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam İl",        value: stats.toplamIl,      icon: "🗺️" },
          { label: "Veri Girilmiş",    value: stats.veriGirilmis,  icon: "✅" },
          { label: "Sorumlu Atanmış",  value: stats.sorumluAtanmis,icon: "👤" },
        ].map(s => (
          <div key={s.label} className="sv-section p-5 flex items-center gap-4">
            <div className="text-3xl">{s.icon}</div>
            <div>
              <p className="text-3xl font-black" style={{ color: cfg.color }}>{s.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bölge + il tablosu */}
      <div className="space-y-3">
        {veri.bolgeler.map(bolge => {
          const acik = acikBolgeler.has(bolge.id);
          const bolgeVeri  = bolge.iller.filter(il => il.sonFaaliyet).length;
          const bolgeSorumlu = bolge.iller.filter(il => il.sorumlu).length;
          return (
            <div key={bolge.id} className="sv-section overflow-hidden">
              {/* Bölge başlığı */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[color:var(--bg-hover)] transition"
                onClick={() => toggleBolge(bolge.id)}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: cfg.color }}>
                    {bolge.no}
                  </span>
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {bolge.ad}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: cfg.lightBg, color: cfg.color }}>
                    {bolge.iller.length} İl
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>✅ {bolgeVeri} veri</span>
                  <span>👤 {bolgeSorumlu} sorumlu</span>
                  <span className="ml-2 text-lg">{acik ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* İl tablosu */}
              {acik && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["İl", "Sorumlu Ad Soyad", "Sorumlu E-posta", "Son Faaliyet", "Durum"].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)", background: "var(--bg-th)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bolge.iller.map(il => {
                        const veriVar = hasVeri(il);
                        return (
                          <tr key={il.id}
                            className="border-t hover:bg-[color:var(--bg-hover)] transition"
                            style={{ borderColor: "var(--border)" }}>
                            <td className="px-5 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                              {il.ad}
                            </td>
                            <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                              {il.sorumlu ? il.sorumlu.adSoyad : (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
                                  Atanmamış
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                              {il.sorumlu ? il.sorumlu.email : "—"}
                            </td>
                            <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                              {il.sonFaaliyet ? (
                                <div>
                                  <div className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {il.sonFaaliyet.yil} / {il.sonFaaliyet.donem}
                                  </div>
                                  <div>{timeAgo(il.sonFaaliyet.createdAt)}</div>
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                style={{
                                  background: veriVar ? cfg.lightBg : "#F1F5F9",
                                  color:      veriVar ? cfg.color   : "#94A3B8",
                                }}>
                                {veriVar ? "Veri Var" : "Veri Yok"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
