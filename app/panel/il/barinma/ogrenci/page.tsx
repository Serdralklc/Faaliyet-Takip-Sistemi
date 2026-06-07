"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface HousingUnit { id: string; ad: string; tip: string }
interface Student {
  id: string; housingUnitId: string; adSoyad: string;
  bolum: string | null; sinif: string | null;
  bursMu: boolean; disiplinSayisi: number; iliskiKesme: boolean; notlar: string | null;
}

const TIP_COLOR: Record<string, string> = { EV: "#006B3F", APART: "#0369A1", YURT: "#7C3AED" };

const SINIF_SECENEKLERI = [
  "", "Hazırlık", "1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "Uzatma", "Yüksek Lisans",
];

function SinifSelect({ value, onChange, className, style }: {
  value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className} style={style}>
      <option value="">Sınıf seçin</option>
      {SINIF_SECENEKLERI.filter(Boolean).map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

function StudentRow({ student, units, onSave, onDelete }: {
  student: Student;
  units: HousingUnit[];
  onSave: (s: Partial<Student> & { id: string }) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...student });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ ...form, id: student.id });
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr style={{ background: "var(--bg-th)" }}>
        <td className="px-3 py-2">
          <select value={form.housingUnitId} onChange={e => setForm(p => ({ ...p, housingUnitId: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
            {units.map(u => <option key={u.id} value={u.id}>{u.ad}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <input value={form.adSoyad} onChange={e => setForm(p => ({ ...p, adSoyad: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
        </td>
        <td className="px-3 py-2">
          <input value={form.bolum ?? ""} onChange={e => setForm(p => ({ ...p, bolum: e.target.value }))}
            className="w-full text-xs border rounded px-2 py-1"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
        </td>
        <td className="px-3 py-2">
          <SinifSelect value={form.sinif ?? ""}
            onChange={v => setForm(p => ({ ...p, sinif: v }))}
            className="w-full text-xs border rounded px-2 py-1"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
        </td>
        <td className="px-3 py-2 text-center">
          <input type="checkbox" checked={form.bursMu}
            onChange={e => setForm(p => ({ ...p, bursMu: e.target.checked }))} />
        </td>
        <td className="px-3 py-2">
          <input type="number" min={0} value={form.disiplinSayisi}
            onChange={e => setForm(p => ({ ...p, disiplinSayisi: Number(e.target.value) }))}
            className="w-16 text-xs border rounded px-2 py-1"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
        </td>
        <td className="px-3 py-2 text-center">
          <input type="checkbox" checked={form.iliskiKesme}
            onChange={e => setForm(p => ({ ...p, iliskiKesme: e.target.checked }))} />
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <button onClick={save} disabled={saving}
              className="p-1 rounded text-white text-xs" style={{ background: "#006B3F" }}>
              <Check size={12} />
            </button>
            <button onClick={() => setEditing(false)}
              className="p-1 rounded text-xs" style={{ background: "var(--bg-hover)" }}>
              <X size={12} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const unit = units.find(u => u.id === student.housingUnitId);
  return (
    <tr className="hover:bg-[color:var(--bg-hover)] transition group">
      <td className="px-3 py-2.5">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${TIP_COLOR[unit?.tip ?? "EV"]}18`, color: TIP_COLOR[unit?.tip ?? "EV"] }}>
          {unit?.ad ?? "—"}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{student.adSoyad}</td>
      <td className="px-3 py-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>{student.bolum ?? "—"}</td>
      <td className="px-3 py-2.5 text-sm text-center" style={{ color: "var(--text-secondary)" }}>{student.sinif ?? "—"}</td>
      <td className="px-3 py-2.5 text-center">
        {student.bursMu
          ? <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>Evet</span>
          : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-th)", color: "var(--text-muted)" }}>Hayır</span>}
      </td>
      <td className="px-3 py-2.5 text-center text-sm" style={{ color: student.disiplinSayisi > 0 ? "#DC2626" : "var(--text-muted)" }}>
        {student.disiplinSayisi}
      </td>
      <td className="px-3 py-2.5 text-center">
        {student.iliskiKesme
          ? <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>Var</span>
          : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-th)", color: "var(--text-muted)" }}>Yok</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => setEditing(true)}
            className="p-1 rounded hover:bg-[color:var(--bg-hover)]">
            <Pencil size={12} style={{ color: "var(--text-muted)" }} />
          </button>
          <button onClick={() => onDelete(student.id)}
            className="p-1 rounded hover:bg-red-50">
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddStudentRow({ units, onAdd }: { units: HousingUnit[]; onAdd: (s: Student) => void }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    housingUnitId: units[0]?.id ?? "",
    adSoyad: "", bolum: "", sinif: "",
    bursMu: false, disiplinSayisi: 0, iliskiKesme: false,
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.adSoyad.trim() || !form.housingUnitId) return;
    setLoading(true);
    const res = await fetch("/api/housing-students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { onAdd(await res.json()); setShow(false); }
    setLoading(false);
  }

  if (!show) {
    return (
      <tr>
        <td colSpan={8} className="px-3 py-2">
          <button onClick={() => setShow(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ color: "var(--green-primary)", background: "var(--green-light)" }}>
            <Plus size={13} /> Öğrenci Ekle
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ background: "var(--bg-th)" }}>
      <td className="px-3 py-2">
        <select value={form.housingUnitId} onChange={e => setForm(p => ({ ...p, housingUnitId: e.target.value }))}
          className="w-full text-xs border rounded px-2 py-1"
          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
          {units.map(u => <option key={u.id} value={u.id}>{u.ad}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input autoFocus value={form.adSoyad} onChange={e => setForm(p => ({ ...p, adSoyad: e.target.value }))}
          placeholder="Ad Soyad" className="w-full text-xs border rounded px-2 py-1"
          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
      </td>
      <td className="px-3 py-2">
        <input value={form.bolum} onChange={e => setForm(p => ({ ...p, bolum: e.target.value }))}
          placeholder="Bölüm" className="w-full text-xs border rounded px-2 py-1"
          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
      </td>
      <td className="px-3 py-2">
        <SinifSelect value={form.sinif}
          onChange={v => setForm(p => ({ ...p, sinif: v }))}
          className="w-full text-xs border rounded px-2 py-1"
          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={form.bursMu}
          onChange={e => setForm(p => ({ ...p, bursMu: e.target.checked }))} />
      </td>
      <td className="px-3 py-2">
        <input type="number" min={0} value={form.disiplinSayisi}
          onChange={e => setForm(p => ({ ...p, disiplinSayisi: Number(e.target.value) }))}
          className="w-16 text-xs border rounded px-2 py-1"
          style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={form.iliskiKesme}
          onChange={e => setForm(p => ({ ...p, iliskiKesme: e.target.checked }))} />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <button onClick={submit} disabled={loading}
            className="p-1 rounded text-white" style={{ background: "#006B3F" }}>
            <Check size={12} />
          </button>
          <button onClick={() => setShow(false)}
            className="p-1 rounded" style={{ background: "var(--bg-hover)" }}>
            <X size={12} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OgrenciBilgiPage() {
  const { data: session } = useSession();
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const ilId = session?.user?.activeIlId;

  async function load() {
    if (!ilId) return;
    const units = await fetch(`/api/housing-units?ilId=${ilId}`).then(r => r.json());
    setUnits(units);
    const allStudents = units.flatMap((u: any) => u.ogrenciler ?? []);
    setStudents(allStudents);
  }

  useEffect(() => { load(); }, [ilId]);

  async function handleSave(data: Partial<Student> & { id: string }) {
    await fetch("/api/housing-students", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu öğrenciyi silmek istiyor musunuz?")) return;
    await fetch(`/api/housing-students?id=${id}`, { method: "DELETE" });
    setStudents(p => p.filter(s => s.id !== id));
  }

  const bursCount = students.filter(s => s.bursMu).length;
  const iliskiCount = students.filter(s => s.iliskiKesme).length;
  const disiplinCount = students.filter(s => s.disiplinSayisi > 0).reduce((s, o) => s + o.disiplinSayisi, 0);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="sv-page-header">
        <h1>Öğrenci Bilgi Sistemi</h1>
        <p>Ev, apart ve yurtlardaki öğrenci bilgilerini yönetin</p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="sv-stat-card">
          <div className="card-bar" style={{ background: "#006B3F" }} />
          <p className="card-label">Toplam Öğrenci</p>
          <p className="card-value" style={{ color: "#006B3F" }}>{students.length}</p>
        </div>
        <div className="sv-stat-card">
          <div className="card-bar" style={{ background: "#D9BC4B" }} />
          <p className="card-label">Burs Alan</p>
          <p className="card-value" style={{ color: "#D9BC4B" }}>{bursCount}</p>
        </div>
        <div className="sv-stat-card">
          <div className="card-bar" style={{ background: "#DC2626" }} />
          <p className="card-label">İlişki Kesme</p>
          <p className="card-value" style={{ color: "#DC2626" }}>{iliskiCount}</p>
        </div>
        <div className="sv-stat-card">
          <div className="card-bar" style={{ background: "#EA580C" }} />
          <p className="card-label">Toplam Disiplin</p>
          <p className="card-value" style={{ color: "#EA580C" }}>{disiplinCount}</p>
        </div>
      </div>

      {/* Tablo */}
      <div className="sv-section overflow-x-auto">
        <div className="sv-section-header">
          <h2>Öğrenci Listesi</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
            {students.length} öğrenci
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--bg-th)" }}>
              {["Ev/Apart/Yurt", "Adı Soyadı", "Okuduğu Bölüm", "Sınıf",
                "Nezir Bursu", "Disiplin Ceza", "İlişki Kesme Talebi", ""].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {students.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  Henüz öğrenci eklenmemiş
                </td>
              </tr>
            )}
            {students.map(s => (
              <StudentRow key={s.id} student={s} units={units}
                onSave={handleSave} onDelete={handleDelete} />
            ))}
            {units.length > 0 && (
              <AddStudentRow units={units} onAdd={s => { setStudents(p => [...p, s]); }} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
