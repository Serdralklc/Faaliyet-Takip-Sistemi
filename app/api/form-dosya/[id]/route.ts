import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { readLocalFile } from "@/lib/storage";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET — form yanıt dosyası (yönetici veya yükleyen) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const dosya = await prisma.formYanitDosya.findUnique({ where: { id } });
  if (!dosya) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });

  const yonetici = YONETICI_ROLLERI.includes(session.user.role as Role);
  if (!yonetici && dosya.yukleyenId !== session.user.id) {
    return NextResponse.json({ error: "Bu dosyaya erişim yetkiniz yok." }, { status: 403 });
  }

  if (!dosya.storageKey.startsWith("local:")) {
    return NextResponse.redirect(dosya.url);
  }

  const buffer = await readLocalFile(dosya.storageKey);
  if (!buffer) return NextResponse.json({ error: "Dosya depolamada bulunamadı." }, { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": dosya.mimeTipi,
      "Content-Length": String(dosya.boyut),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(dosya.ad)}`,
    },
  });
}
