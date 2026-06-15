import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";
import { talepKarsilayanMi } from "@/lib/istisare";
import type { TalepBirim } from "@/lib/istisare";

export const dynamic = "force-dynamic";

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

// GET: yerel depolanan talep dosyasını servis et (blob yoksa). Giriş yapan herkese.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const ad = searchParams.get("ad") ?? "dosya";
  if (!key) return NextResponse.json({ error: "Anahtar gerekli" }, { status: 400 });

  // Talep izolasyonu: bu dosya anahtarı yalnızca ilgili talebin tarafları (oluşturan
  // veya karşılayan birim) tarafından indirilebilir. dosyalar[] içinde URL'ler key'i
  // encode edilmiş olarak saklar; literal alt-dize araması (strpos) ile sahip talebi bul.
  const encodedKey = encodeURIComponent(key);
  const rows = await prisma.$queryRaw<{ olusturanId: string; birim: string }[]>`
    SELECT t."olusturanId", t."birim"::text AS birim
    FROM "TalepMesaj" m
    JOIN "Talep" t ON t.id = m."talepId"
    WHERE EXISTS (
      SELECT 1 FROM unnest(m."dosyalar") AS d WHERE strpos(d, ${encodedKey}) > 0
    )
    LIMIT 1
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });

  const { olusturanId, birim } = rows[0];
  const erisim =
    olusturanId === session.user.id ||
    talepKarsilayanMi(birim as TalepBirim, session.user.role, session.user.yanRoller);
  if (!erisim) return NextResponse.json({ error: "Bu dosyaya erişiminiz yok" }, { status: 403 });

  const buf = await readLocalFile(key);
  if (!buf) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });

  const ext = (ad.split(".").pop() ?? "").toLowerCase();
  const mime = EXT_MIME[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(ad)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
