import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/jpeg";
}

/** GET — yerel sürücüdeki pop-up görselini servis eder (Blob'da gorselUrl mutlaktır, bu route kullanılmaz) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const popup = await prisma.popup.findUnique({ where: { id }, select: { gorselKey: true } });
  if (!popup?.gorselKey) return new NextResponse("Bulunamadı", { status: 404 });

  const buffer = await readLocalFile(popup.gorselKey);
  if (!buffer) return new NextResponse("Bulunamadı", { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": mimeFromKey(popup.gorselKey), "Cache-Control": "private, max-age=3600" },
  });
}
