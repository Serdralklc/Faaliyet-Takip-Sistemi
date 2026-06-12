"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface HousingUnit {
  id: string; ilId: string; tip: string; ad: string; konum: string | null; aktif: boolean;
}

const TIP_LABEL: Record<string, string> = { EV: "Ev", APART: "Apart", YURT: "Yurt" };
const TIP_COLOR: Record<string, string> = {
  EV:    "#006B3F",
  APART: "#0369A1",
  YURT:  "#7C3AED",
};

function UnitCard({ unit, onEdit, onDelete }: {
  unit: HousingUnit;
  onEdit: (u: HousingUnit) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border group transition hover:shadow-sm"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TIP_COLOR[unit.tip] }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{unit.ad}</p>
        {unit.konum && (
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>📍 {unit.konum}</p>
        )}
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: `${TIP_COLOR[unit.tip]}18`, color: TIP_COLOR[unit.tip] }}>
        {TIP_LABEL[unit.tip]}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onEdit(unit)}
          className="p-1.5 rounded-lg hover:bg-[color:var(--bg-hover)] transition">
          <Pencil size={13} style={{ color: "var(--text-muted)" }} />
        </button>
        <button onClick={() => onDelete(unit.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 transition">
          <Trash2 size={13} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

function AddUnitForm({ ilId, tip, onAdd, onCancel }: {
  ilId: string; tip: string; onAdd: (u: HousingUnit) => void; onCancel: () => void;
}) {
  const [ad, setAd] = useState("");
  const [konum, setKonum] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    setLoading(true);
    const res = await fetch("/api/housing-units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ilId, tip, ad: ad.trim(), konum: konum.trim() || null }),
    });
    if (res.ok) { onAdd(await res.json()); }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-center px-4 py-3 rounded-xl border"
      style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
      <input autoFocus value={ad} onChange={e => setAd(e.target.value)}
        placeholder="Birim adı (örn: Kızılay Evi)"
        className="flex-1 text-sm rounded-lg px-3 py-1.5 border focus:outline-none"
        style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
      />
      <input value={konum} onChange={e => setKonum(e.target.value)}
        placeholder="Konum (mahalle, cadde vb.)"
        className="flex-1 text-sm rounded-lg px-3 py-1.5 border focus:outline-none"
        style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}
      />
      <button type="submit" disabled={loading}
        className="p-1.5 rounded-lg text-white" style={{ background: TIP_COLOR[tip] }}>
        <Check size={15} />
      </button>
      <button type="button" onClick={onCancel}
        className="p-1.5 rounded-lg" style={{ background: "var(--bg-hover)" }}>
        <X size={15} style={{ color: "var(--text-muted)" }} />
      </button>
    </form>
  );
}

function TipSection({ tip, units, ilId, onChange }: {
  tip: string; units: HousingUnit[]; ilId: string; onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Bu birimi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/housing-units?id=${id}`, { method: "DELETE" });
    onChange();
  }

  function handleEdit(u: HousingUnit) {
    const yeniAd = prompt("Yeni ad:", u.ad);
    if (!yeniAd) return;
    const yeniKonum = prompt("Yeni konum:", u.konum ?? "");
    fetch("/api/housing-units", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, ad: yeniAd.trim(), konum: yeniKonum?.trim() || null, aktif: true }),
    }).then(() => onChange());
  }

  return (
    <div className="sv-section overflow-hidden">
      <div className="sv-section-header">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: TIP_COLOR[tip] }} />
          <h2>{TIP_LABEL[tip]}ler</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${TIP_COLOR[tip]}18`, color: TIP_COLOR[tip] }}>
            {units.length} adet
          </span>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
          style={{ background: TIP_COLOR[tip] }}>
          <Plus size={13} /> Ekle
        </button>
      </div>

      <div className="p-4 space-y-2">
        {units.length === 0 && !adding && (
          <p className="text-center text-sm py-4" style={{ color: "var(--text-muted)" }}>
            Henüz {TIP_LABEL[tip].toLowerCase()} eklenmemiş
          </p>
        )}
        {units.map(u => (
          <UnitCard key={u.id} unit={u} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
        {adding && (
          <AddUnitForm ilId={ilId} tip={tip} onCancel={() => setAdding(false)}
            onAdd={u => { onChange(); setAdding(false); }} />
        )}
      </div>
    </div>
  );
}

export default function BarinmaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session?.user?.sistem === "LISE") router.replace("/panel/il/lise-faaliyet");
  }, [session, router]);
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [barinmaYok, setBarinmaYok] = useState(false);

  const ilId = session?.user?.activeIlId;

  function load() {
    if (!ilId) return;
    fetch(`/api/housing-units?ilId=${ilId}`)
      .then(r => r.json())
      .then(d => setUnits(Array.isArray(d) ? d : []));
    fetch(`/api/barinma-muafiyet?ilId=${ilId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBarinmaYok(!!d.barinmaYok); });
  }

  useEffect(() => { load(); }, [ilId]);

  async function toggleMuaf(yeni: boolean) {
    if (!ilId) return;
    setBarinmaYok(yeni); // iyimser güncelleme
    const res = await fetch("/api/barinma-muafiyet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ilId, barinmaYok: yeni }),
    });
    if (!res.ok) setBarinmaYok(!yeni); // başarısızsa geri al
  }

  const evler   = units.filter(u => u.tip === "EV");
  const apartlar = units.filter(u => u.tip === "APART");
  const yurtlar = units.filter(u => u.tip === "YURT");

  if (!ilId) return null;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="sv-page-header">
        <h1>Ev / Apart / Yurt Takibi</h1>
        <p>İlinize ait barınma birimlerini buradan yönetin</p>
      </div>

      {/* Barınma muafiyeti — "ilimizde ev/apart/yurt yoktur" (il-bazlı, kalıcı) */}
      <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition select-none"
        style={barinmaYok
          ? { background: "#FEF3C7", borderColor: "#F59E0B" }
          : { background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <input type="checkbox" checked={barinmaYok}
          onChange={e => toggleMuaf(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold" style={{ color: barinmaYok ? "#92400E" : "var(--text-primary)" }}>
            İlimizde ev / apart / yurt bulunmamaktadır
          </p>
          <p className="text-xs mt-0.5" style={{ color: barinmaYok ? "#B45309" : "var(--text-muted)" }}>
            İşaretlerseniz iliniz barınmadan <strong>muaf</strong> sayılır; bölge eğitimcisi ekranında
            “veri girilmedi” yerine <strong>“ev/apart/yurt yok”</strong> görünür. İleride ev/apart/yurt açılırsa
            işareti kaldırıp birim ekleyebilirsiniz.
          </p>
        </div>
      </label>

      {barinmaYok ? (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-3xl mb-2">🚫</p>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            İliniz barınmadan muaf işaretlendi
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Ev/apart/yurt bölümleri gizlendi. Birim eklemek için yukarıdaki işareti kaldırın.
          </p>
        </div>
      ) : (
      <>
      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { tip: "EV", count: evler.length },
          { tip: "APART", count: apartlar.length },
          { tip: "YURT", count: yurtlar.length },
        ].map(({ tip, count }) => (
          <div key={tip} className="sv-stat-card">
            <div className="card-bar" style={{ background: TIP_COLOR[tip] }} />
            <p className="card-label">{TIP_LABEL[tip]} Sayısı</p>
            <p className="card-value" style={{ color: TIP_COLOR[tip] }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Bölümler */}
      <TipSection tip="EV"    units={evler}    ilId={ilId} onChange={load} />
      <TipSection tip="APART" units={apartlar} ilId={ilId} onChange={load} />
      <TipSection tip="YURT"  units={yurtlar}  ilId={ilId} onChange={load} />
      </>
      )}
    </div>
  );
}
