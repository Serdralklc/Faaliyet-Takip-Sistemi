/**
 * TEK KAYNAK TEMA MODÜLÜ
 *
 * Renkler CSS değişkeni referansı ("var(--token)") olarak döner; gerçek değerler
 * app/globals.css'teki :root (açık) ve .dark (koyu) bloklarında tanımlıdır.
 * Böylece inline style kullanan tüm bileşenler, JS'e ve mount durumuna bağlı
 * olmadan (hydration flash'sız) aktif temayı otomatik takip eder.
 *
 * NOT: BRAND sabitleri hex kalır — `BRAND.green + "20"` gibi alpha birleştirme
 * yapan kodlarla uyum için. Saydam marka tonu gerekiyorsa --brand-soft kullanın.
 */

/** Marka paleti (hex — alpha birleştirme güvenli) */
export const BRAND = {
  green:     "#0B6B3A",
  greenDark: "#064E2A",
  gold:      "#D4AF37",
} as const;

/**
 * useColors() anahtar süperseti — kopya hook'lardaki tüm anahtar adlarını kapsar.
 * (h=başlık, b=gövde, mu=soluk, sr/card=kart, br=kenarlık, bg=zemin,
 *  su/bg2=ikincil zemin, inp/inpBr=input, sidebar/hover/active=panel)
 */
export const COLORS = {
  h:       "var(--text-primary)",
  b:       "var(--text-secondary)",
  mu:      "var(--text-muted)",
  sr:      "var(--bg-card)",
  card:    "var(--bg-card)",
  br:      "var(--border)",
  bg:      "var(--bg-page)",
  su:      "var(--bg-subtle)",
  bg2:     "var(--bg-subtle)",
  inp:     "var(--bg-input)",
  inpBr:   "var(--border-input)",
  sidebar: "var(--bg-sidebar)",
  hover:   "var(--bg-hover)",
  active:  "var(--bg-active)",
} as const;

export type Colors = typeof COLORS;

/** Eski kopya hook'larla birebir uyumlu imza — artık mount/resolvedTheme gerekmez */
export function useColors(): Colors {
  return COLORS;
}

/**
 * PublicLayout / HomePage token süperseti.
 * imgFilter dahil tüm değerler CSS değişkenine taşındı.
 */
export const TOKENS = {
  bg:           "var(--bg-page)",
  surface:      "var(--bg-subtle)",
  card:         "var(--bg-card)",
  navbar:       "var(--nav-bg)",
  border:       "var(--border)",
  borderSubtle: "var(--border-subtle)",
  heading:      "var(--text-primary)",
  body:         "var(--text-secondary)",
  muted:        "var(--text-muted)",
  accent:       "var(--accent)",
  gold:         BRAND.gold,
  heroBg:       "var(--bg-page)",
  heroBorder:   "var(--hero-border)",
  heroHeading:  "var(--text-primary)",
  heroBody:     "var(--text-secondary)",
  heroMuted:    "var(--text-muted)",
  heroStat:     "var(--text-primary)",
  imgFilter:    "var(--img-filter)",
  navLink:      "var(--nav-link)",
  navLinkHover: "var(--nav-link-hover)",
  toggleBg:     "var(--toggle-bg)",
  toggleBorder: "var(--border)",
  toggleColor:  "var(--text-secondary)",
  dropBg:       "var(--bg-card)",
  dropSurface:  "var(--bg-subtle)",
} as const;

export type Tokens = typeof TOKENS;

/** Eski useTokens() ile uyumlu imza */
export function useTokens(): Tokens {
  return TOKENS;
}
