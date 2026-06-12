/**
 * Panel içi 404 sayfası — panel segmentinde notFound() çağrılırsa gösterilir.
 */
export default function PanelNotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-md">
        <p
          className="font-black leading-none mb-4"
          style={{
            fontSize: "clamp(64px, 16vw, 104px)",
            color: "#0B6B3A",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </p>

        <h1
          className="text-[20px] font-black mb-2"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Sayfa bulunamadı
        </h1>
        <p
          className="text-[13.5px] mb-7 leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Bu sayfa mevcut değil. Ana sayfaya dönerek devam edebilirsiniz.
        </p>

        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-[14px] font-semibold transition-colors"
          style={{ background: "#0B6B3A", color: "#FFFFFF" }}
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}
