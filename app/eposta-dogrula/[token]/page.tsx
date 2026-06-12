"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/Button";

/**
 * Gönüllü e-posta doğrulama sayfası.
 * Token, sayfa açılır açılmaz değil butona basılınca tüketilir —
 * e-posta tarayıcılarının link ön-yüklemesi token'ı yakmasın diye.
 */
export default function EpostaDogrulaPage() {
  const { token } = useParams<{ token: string }>();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const [message, setMessage] = useState("");

  async function handleVerify() {
    setSending(true);
    try {
      const res = await fetch("/api/gonullu/eposta-dogrula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok) {
        setResult("ok");
      } else {
        setResult("fail");
        setMessage(d?.error ?? "Doğrulama başarısız.");
      }
    } catch {
      setResult("fail");
      setMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthCard
      title="E-posta Doğrulama"
      subtitle={result === null ? "E-posta adresinizi doğrulamak için aşağıdaki butona tıklayın." : undefined}
      backHref="/gonullu/giris"
      backLabel="Gönüllü girişine dön"
    >
      {result === "ok" ? (
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-xl px-4 py-4 text-[14px] leading-relaxed"
            style={{ background: "var(--green-light)", color: "var(--accent)", border: "1px solid var(--green-muted)" }}
          >
            <p className="font-bold mb-1">E-posta adresiniz doğrulandı. ✓</p>
            <p>Hesabınızı tüm özellikleriyle kullanabilirsiniz.</p>
          </div>
          <Link href="/gonullu/giris" className="block">
            <Button className="w-full" size="lg">Giriş Yap</Button>
          </Link>
        </div>
      ) : result === "fail" ? (
        <div
          role="alert"
          className="rounded-xl px-4 py-4 text-[14px] leading-relaxed bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900"
        >
          <p className="font-bold mb-1">Doğrulama başarısız.</p>
          <p>{message}</p>
        </div>
      ) : (
        <Button onClick={handleVerify} loading={sending} className="w-full" size="lg">
          E-postamı Doğrula
        </Button>
      )}
    </AuthCard>
  );
}
