import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Üniversite faaliyet foto/dosya eki — il sorumlusu (kendi ili), bölge (kendi illeri), yönetici */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const tip = new URL(req.url).searchParams.get("tip") === "dosya" ? "dosya" : "foto";

  const f = await prisma.universiteFaaliyet.findUnique({
    where: { id },
    select: {
      ilId: true,
      fotoKey: true, fotoUrl: true, fotoMime: true,
      dosyaKey: true, dosyaUrl: true, dosyaMime: true, dosyaAd: true,
      il: { select: { bolgeId: true } },
    },
  });
  if (!f) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });

  const { role, activeIlId, activeBolgeId } = session.user;
  const yonetici = YONETICI_ROLLERI.includes(role as Role);
  const izin =
    yonetici ||
    (role === "IL_SORUMLUSU" && activeIlId === f.ilId) ||
    (role === "BOLGE_SORUMLUSU" && activeBolgeId === f.il.bolgeId);
  if (!izin) return NextResponse.json({ error: "Bu dosyaya erişiminiz yok." }, { status: 403 });

  const key = tip === "dosya" ? f.dosyaKey : f.fotoKey;
  const url = tip === "dosya" ? f.dosyaUrl : f.fotoUrl;
  const mime = (tip === "dosya" ? f.dosyaMime : f.fotoMime) ?? "application/octet-stream";
  if (!key) return NextResponse.json({ error: "Ek bulunamadı." }, { status: 404 });

  if (!key.startsWith("local:")) {
    if (url) return NextResponse.redirect(url);
    return NextResponse.json({ error: "Dosya URL'i yok." }, { status: 404 });
  }

  const buffer = await readLocalFile(key);
  if (!buffer) return NextResponse.json({ error: "Dosya depolamada yok." }, { status: 404 });

  const indir = tip === "dosya";
  const ad = tip === "dosya" ? (f.dosyaAd ?? "dosya") : "foto";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `${indir ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(ad)}`,
    },
  });
}
