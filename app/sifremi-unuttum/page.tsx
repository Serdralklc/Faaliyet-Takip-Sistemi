"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function SifremiUnuttumForm() {
  const searchParams = useSearchParams();
  const tip = searchParams.get("tip") === "gonullu" ? "gonullu" : "yonetici";

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sifre-unuttum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tip }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "İşlem başarısız. Lütfen tekrar deneyin.");
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  const girisHref = tip === "gonullu" ? "/gonullu/giris" : "/giris";

  return (
    <AuthCard
      title="Şifremi Unuttum"
      subtitle={
        tip === "gonullu"
          ? "Gönüllü hesabınıza kayıtlı e-posta adresinizi girin; size şifre sıfırlama bağlantısı gönderelim."
          : "Hesabınıza kayıtlı e-posta adresinizi girin; size şifre sıfırlama bağlantısı gönderelim."
      }
      backHref={girisHref}
      backLabel="Giriş sayfasına dön"
    >
      {done ? (
        <div
          role="status"
          className="rounded-xl px-4 py-4 text-[14px] leading-relaxed"
          style={{ background: "var(--green-light)", color: "var(--accent)", border: "1px solid var(--green-muted)" }}
        >
          <p className="font-bold mb-1">Talebiniz alındı.</p>
          <p>Bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı birkaç dakika içinde gelen kutunuza ulaşacaktır. Spam klasörünü de kontrol edin.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="E-posta Adresi"
            placeholder="ornek@eposta.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            error={error || undefined}
          />
          <Button type="submit" loading={sending} className="w-full" size="lg">
            Sıfırlama Bağlantısı Gönder
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function SifremiUnuttumPage() {
  return (
    <Suspense fallback={null}>
      <SifremiUnuttumForm />
    </Suspense>
  );
}
