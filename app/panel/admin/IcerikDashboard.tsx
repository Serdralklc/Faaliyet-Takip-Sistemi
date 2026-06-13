import Link from "next/link";
import { FileText, Bell, FolderOpen, Archive, ArrowRight } from "lucide-react";

const KARTLAR = [
  {
    href: "/panel/admin/form-yonetimi",
    baslik: "Form Yönetimi",
    aciklama: "Dinamik formlar oluşturun, düzenleyin ve yanıtları görüntüleyin.",
    icon: FileText, renk: "#2563EB",
  },
  {
    href: "/panel/admin/bildirimler-merkezi",
    baslik: "Bildirim Merkezi",
    aciklama: "Duyuru ve bildirim gönderin, geçmiş bildirimleri yönetin.",
    icon: Bell, renk: "#D97706",
  },
  {
    href: "/panel/admin/dokumanlar",
    baslik: "Doküman Merkezi",
    aciklama: "Dokümanları klasörleyin, paylaşın ve yönetin.",
    icon: FolderOpen, renk: "#7C3AED",
  },
  {
    href: "/panel/admin/arsiv",
    baslik: "Veri Arşivi",
    aciklama: "Yıl bazlı arşivlenen verileri görüntüleyin.",
    icon: Archive, renk: "#475569",
  },
];

export function IcerikDashboard({ ad }: { ad: string }) {
  return (
    <div className="p-8">
      <div className="mb-7">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
          İçerik Yönetimi
        </p>
        <h1 className="text-2xl font-bold text-heading">Hoş geldiniz, {ad}</h1>
        <p className="text-muted text-sm mt-1">
          İçerik yönetimi ekranlarına buradan ulaşabilirsiniz. Takip ve kontrol ekranları için
          sol menüden <span className="font-semibold">Merkez Ekip</span> görünümüne geçin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {KARTLAR.map(k => {
          const Icon = k.icon;
          return (
            <Link key={k.href} href={k.href}
              className="group bg-card rounded-2xl border border-border p-5 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: k.renk + "14", color: k.renk }}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <p className="text-[15px] font-bold text-heading mb-1">{k.baslik}</p>
              <p className="text-[12.5px] leading-[1.6] text-muted">{k.aciklama}</p>
              <div className="flex items-center gap-1.5 mt-4 transition-all group-hover:gap-2.5">
                <span className="text-[11px] font-bold" style={{ color: k.renk }}>Aç</span>
                <ArrowRight size={13} style={{ color: k.renk }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
