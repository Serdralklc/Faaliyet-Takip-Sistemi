# Serhendi Gençlik — Faaliyet Takip & Otomasyon Sistemi
## Handoff Dokümanı

**Son güncelleme:** 10 Haziran 2026  
**Deployment:** Vercel (auto-deploy, `main` branch'e her push tetikler)  
**Repo:** `https://github.com/Serdralklc/Faaliyet-Takip-Sistemi`  
**Veritabanı:** Railway PostgreSQL (`acela.proxy.rlwy.net:53083`, db: `railway`)

---

## 1. Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Auth (yönetici) | NextAuth v4 — Credentials + Google OAuth |
| Auth (gönüllü) | Custom JWT cookie (`gonullu-token`, `jose` kütüphanesi) |
| ORM | Prisma 7 (`prisma.config.ts` ile — `schema.prisma` dosyasındaki `output` app/generated/prisma'ya işaret eder) |
| Veritabanı | PostgreSQL (Railway) |
| E-posta | Nodemailer |
| PDF | jsPDF + jspdf-autotable |
| Grafikler | Recharts |
| State | React useState/useEffect (minimal), Zustand (nadiren) |
| Deploy | Vercel |

---

## 2. Proje Yapısı

```
faaliyet-takip/
├── app/
│   ├── layout.tsx              # Root layout — ThemeProvider(forcedTheme="light"), SessionProvider
│   ├── providers.tsx           # ThemeProvider + SessionProvider wrapper
│   ├── globals.css             # Global stiller, panel-layout scope'lu CSS, public-input class
│   ├── page.tsx                # Public landing page
│   │
│   ├── giris/                  # Yönetici giriş sayfası (4 rol kartı: Admin, Eğitimci, Üniversite, Lise)
│   ├── kayit/                  # Yönetici kayıt / davet akışı
│   ├── profil-tamamla/         # İlk girişte profil tamamlama
│   ├── davet/[token]/          # Davet linki kabul sayfası
│   │
│   ├── gonullu/
│   │   ├── giris/              # Gönüllü giriş (JWT cookie auth)
│   │   └── panel/              # Gönüllü paneli (layout.tsx sidebar içerir)
│   │       ├── page.tsx        # Ana sayfa
│   │       ├── burs-basvurusu/ # Nezir Burs başvuru formu
│   │       ├── ek-kayit-basvurusu/ # Öğr. Evi/Apart/Yurt başvuru formu (YENİ)
│   │       ├── basvurularim/   # Burs + EkKayıt başvuruları (tab'lı)
│   │       ├── geri-bildirim/  # Geri bildirim formu
│   │       ├── profil/         # Profil sayfası
│   │       ├── burs-paneli/    # Admin: burs başvuru yönetimi
│   │       └── bildirimler/    # Admin: geri bildirim yönetimi
│   ├── gonullu-kayit/          # Gönüllü kayıt formu (public)
│   │
│   ├── panel/
│   │   ├── layout.tsx          # Yönetici panel layout (Sidebar + MobileLayout)
│   │   ├── admin/              # SISTEM_ADMIN / GENEL_MERKEZ / TURKIYE_* paneli
│   │   │   ├── page.tsx        # Dashboard (bekleyen badge sistem-kısıtlı)
│   │   │   ├── kullanicilar/   # Kullanıcı yönetimi (5 tab: Yetkili/Eğitimci/Üniversite/Lise/Gönüllüler)
│   │   │   ├── gonulluler/     # Gönüllü listesi
│   │   │   ├── burs-basvurulari/ # Burs başvuru yönetimi
│   │   │   ├── hedefler/       # Hedef yönetimi
│   │   │   ├── bolgeler/       # Bölge yönetimi
│   │   │   ├── raporlar/       # Raporlar
│   │   │   └── loglar/         # Denetim logları
│   │   ├── bolge/              # BOLGE_SORUMLUSU paneli
│   │   └── il/                 # IL_SORUMLUSU paneli (faaliyet giriş, barınma, hedefler, raporlar)
│   │
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth endpoint
│       ├── kullanicilar/       # CRUD + onayla/yetkikal/sil/sifre-ata/gorev-devri
│       ├── faaliyetler/        # Faaliyet CRUD
│       ├── bolgeler/           # Bölge listesi
│       ├── hedefler/           # Bölge + il hedef API
│       ├── housing-units/      # Barınma birimi API
│       ├── housing-students/   # Barınma öğrenci API
│       ├── housing-visits/     # Barınma ziyaret API
│       ├── admin/
│       │   ├── burs/           # Admin: tüm burs başvuruları
│       │   ├── burs-basvurulari/[id]/ # Durum güncelleme
│       │   ├── gonulluler/     # Admin: gönüllü listesi
│       │   └── geri-bildirim/  # Admin: geri bildirimler
│       └── gonullu/
│           ├── giris/          # JWT cookie set
│           ├── kayit/          # Yeni gönüllü kaydı
│           ├── cikis/          # Cookie sil
│           ├── me/             # Oturum bilgisi
│           ├── burs/           # Gönüllü: burs başvuru GET/POST
│           ├── ek-kayit/       # Gönüllü: Öğr.Evi/Apart/Yurt başvuru GET/POST
│           ├── geri-bildirim/  # Gönüllü: geri bildirim POST
│           └── profil/         # Gönüllü: profil güncelleme
│
├── components/
│   ├── Sidebar.tsx             # Yönetici sidebar (tüm roller için koşullu nav)
│   ├── MobileLayout.tsx        # Mobil layout wrapper (panel-layout class'ı burada)
│   ├── PublicLayout.tsx        # Public sayfa layout
│   └── HomePage.tsx            # Landing page bileşeni
│
├── lib/
│   ├── auth.ts                 # getSession(), hasRole() yardımcıları
│   ├── gonullu-auth.ts         # JWT cookie helpers (gönüllü sistemi)
│   ├── constants.ts            # Role tipleri, ROLE_LABELS, rol grupları
│   ├── prisma.ts               # Prisma client singleton
│   ├── audit.ts                # Denetim log yazıcı
│   └── mail.ts                 # Nodemailer wrapper
│
└── prisma/
    ├── schema.prisma           # Tüm modeller
    └── seed.ts                 # Seed verisi
```

---

## 3. Veritabanı Modelleri

### Yönetici Tarafı
| Model | Açıklama |
|---|---|
| `User` | Yönetici kullanıcılar. `role`, `sistem`, `status` alanları. Davet akışı için `basvuruGorev/BolgeId/IlId` |
| `RoleAssignment` | Kullanıcı-il/bölge atama geçmişi |
| `Invitation` | Davet token'ları |
| `Bolge` | 19 bölge |
| `Il` | 81 il, `bolgeId` ile bölgeye bağlı |
| `Activity` | Faaliyet kayıtları (Eğitim/Üniversite/Lise/İlköğretim/Ortak kategorili) |
| `BolgeHedef` / `IlHedef` | Dönemlik hedef rakamları |
| `HousingUnit` | Barınma birimi (Yurt/Apart/Ev) |
| `HousingStudent` | Birimde kalan öğrenciler |
| `HousingVisit` | Ziyaret kayıtları |
| `AuditLog` | Tüm kritik işlemlerin log kaydı |

### Gönüllü Tarafı
| Model | Açıklama |
|---|---|
| `Volunteer` | Gönüllü hesabı — `telefon` unique, `email` optional unique |
| `BursBasvuru` | Nezir Burs başvurusu |
| `EkKayitBasvuru` | Öğr.Evi/Apart/Yurt başvurusu (YENİ — Excel formuna göre) |
| `GeriBildirim` | Gönüllü geri bildirimleri |

---

## 4. Roller ve Yetki Sistemi

### Rol Hiyerarşisi
```
SISTEM_ADMIN          → Her şeye tam erişim
GENEL_MERKEZ          → Tam erişim (admin ile eşit, silme hariç bazı kısıtlar)
TURKIYE_EGITIM_SORUMLUSU   → Tüm sistemleri görür, onay/şifre/yetkikal yapabilir
TURKIYE_UNIVERSITE_SORUMLUSU → Sadece UNIVERSITE sistemi
TURKIYE_LISE_SORUMLUSU       → Sadece LISE sistemi
BOLGE_SORUMLUSU       → Kendi bölgesi
IL_SORUMLUSU          → Kendi ili
BEKLEYEN              → Panel erişimi yok, beklemede sayfasında bekler
```

### Sistem Alanı
Her kullanıcının `sistem` alanı vardır: `EGITIMCI | UNIVERSITE | LISE | YONETICI`

### Giriş Sayfaları
- `/giris` → 4 kart: Yönetici (YONETICI), Eğitimci (EGITIMCI), Üniversite Gençlik (UNIVERSITE), Lise Gençlik (LISE)
- Her kart NextAuth credentials ile `sistem` parametresi göndererek login yapar
- `/gonullu/giris` → JWT cookie auth (NextAuth dışı)

---

## 5. Tamamlanan Özellikler

### Yönetici Paneli
- [x] Çok sistemli giriş (4 farklı sistem kartı)
- [x] Kullanıcı yönetimi: davet, onay, yetki alma, silme, şifre atama
- [x] Dashboard: sistem kısıtlı rollere göre filtrelenmiş bekleyen badge
- [x] Faaliyet takip sistemi (İl/Eğitim/Üniversite/Lise/Ortak kategoriler)
- [x] Barınma yönetimi (yurt/apart/ev, öğrenci, ziyaret)
- [x] Hedef yönetimi (bölge/il bazlı dönemlik hedefler)
- [x] Raporlar & PDF export
- [x] Denetim logları
- [x] Koyu/Açık tema (next-themes, `panel-layout` scope'lu CSS)
- [x] Mobil uyumluluk
- [x] Ana Sayfa (eski adı Dashboard)

### Gönüllü Sistemi
- [x] Kayıt formu (`/gonullu-kayit`)
- [x] Giriş/çıkış (JWT cookie)
- [x] Nezir Burs başvurusu
- [x] Öğr. Evi/Apart/Yurt başvurusu (EkKayitBasvuru)
- [x] Başvuru takibi (iki tab: burs + ek kayıt)
- [x] Geri bildirim formu
- [x] Profil düzenleme
- [x] Admin burs paneli (onay/red/not)
- [x] Admin geri bildirim paneli

### Public Sayfalar
- [x] Landing page, Hakkımızda, İletişim, Faaliyetler, Projeler, Bağış
- [x] Tüm sayfalar hero renk düzeltmesi (lacivert başlık → beyaz/uyumlu renk)

---

## 6. Kritik Mimari Kararlar

### CSS Kapsam Stratejisi
**Sorun:** Panel tema CSS'i (`!important` kuralları) public giriş sayfalarını bozuyordu.  
**Çözüm:** Tüm panel-spesifik CSS'i `.panel-layout` class'ına scope'ladı. Bu class `MobileLayout.tsx`'te root div'e ekleniyor.

### Public Input Stili (`public-input` class)
**Sorun:** `app/globals.css`'deki Tailwind Preflight ve diğer kurallar, public giriş formlarındaki input border'larını sayfa yüklendikten 1-2 saniye sonra override ediyordu. React inline style `!important` desteklemediği için etkileniyor.  
**Çözüm:** `globals.css`'e `.public-input` class'ı eklendi — tüm input stilleri `!important` ile tanımlandı. Public form inputları `className="public-input"` kullanır, inline style kullanmaz.

### Gönüllü Auth (NextAuth Dışı)
**Neden:** Gönüllüler farklı bir kimlik tablosunda (`Volunteer`) tutulur, `User` tablosundan ayrıdır.  
**Mekanizma:** `lib/gonullu-auth.ts` — `jose` kütüphanesi ile HS256 JWT, `gonullu-token` httpOnly cookie (7 gün).

### Prisma Output Yolu
`prisma.config.ts` Prisma'ya `app/generated/prisma/` yoluna output almasını söyler. Import şu şekilde: `import { prisma } from "@/lib/prisma"` (singleton, `lib/prisma.ts`).  
**Dikkat:** `@prisma/client` değil `@/app/generated/prisma/client` import'u kullanılır bazı yerlerde.

### Cache Tamamen Kapalı
`next.config.ts`'de tüm route'lar için `Cache-Control: no-store` header'ı set edilmiş. Geliştirme sırasında tarayıcı cache sorunlarını önlemek için alındı.

### ThemeProvider `forcedTheme="light"`
`providers.tsx`'te `forcedTheme="light"` var. Dark mode desteği panel içinde `useColors()` hook'u aracılığıyla implement edilmiş ama public sayfalar sabit light theme'de çalışır. `forcedTheme` kaldırılırsa public sayfalarda hydration flash riskine dikkat et.

### Migration Yerine `db push`
Veritabanı migration geçmişi ile production DB arasında drift oluştu. Yeni schema değişiklikleri `npx prisma db push` ile uygulanıyor.

---

## 7. Ortam Değişkenleri (`.env`)

```
DATABASE_URL=postgresql://...@acela.proxy.rlwy.net:53083/railway
NEXTAUTH_URL=https://...vercel.app
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# E-posta için (Nodemailer):
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## 8. Eksik / Yarım Kalan İşler

### Yüksek Öncelik
- [ ] **EkKayitBasvuru admin paneli:** Öğr.Evi/Apart/Yurt başvuruları için admin görüntüleme/onay sayfası yok. Burs başvuruları için olan `burs-basvurulari/` sayfası model alınabilir. API endpoint: `/api/admin/ek-kayit-basvurulari/` oluşturulmalı.
- [ ] **Kullanıcı yönetimi ilk yükleme:** `kullanicilar/page.tsx`'te `Promise.allSettled` ile paralel fetch yapılıyor ama ilk açılışta verinin görünmesi hâlâ gecikebiliyor. Skeleton loader eklenmeli.

### Orta Öncelik
- [ ] **Belge yükleme:** Burs başvurularında "belge yükleme yakında" notu var. File upload (Vercel Blob veya S3) eklenmeli.
- [ ] **EkKayitBasvuru `generated` modeli:** `db push` yapıldı ama `npx prisma generate` çalıştırılmadı; `app/generated/prisma/models/EkKayitBasvuru.ts` henüz yok. Deploy öncesi `prisma generate` çalıştırılmalı (Vercel build sırasında otomatik yapıyor olabilir).
- [ ] **Gönüllü admin: Ek Kayıt tab'ı:** `burs-paneli` sayfasına benzer bir panel oluşturulmalı.
- [ ] **Migration drift:** `prisma migrate dev` production ile sync değil. Temiz bir migration baseline oluşturulması önerilir.

### Düşük Öncelik
- [ ] **Public sayfalar i18n/SEO:** Meta tag'lar eksik.
- [ ] **Test coverage:** Hiç test yok.
- [ ] **Şifre sıfırlama:** Hem yönetici hem gönüllü tarafında "Şifremi unuttum" akışı yok.
- [ ] **Google OAuth ile giriş:** Kod var (`options.ts`) ama callback URL ve scope tam test edilmemiş olabilir.

---

## 9. Yeni Oturum İçin Hızlı Bağlam

### Çalışma Dizini
```
C:\Masaüstü 2\HizMet\Serhendi Gençlik Faaliye Takip Sistemi - Otomasyon\faaliyet-takip
```

### Deploy Akışı
```
git add . && git commit -m "..." && git push
```
Vercel otomatik deploy eder. **Production URL'yi bookmark'la** — her deploy'da yeni preview URL gelir.

### Schema Değişikliği
```bash
# schema.prisma'yı düzenle, sonra:
npx prisma db push
# Prisma client'ı yenile (Vercel build'de otomatik olur):
npx prisma generate
```

### Yeni API Route Yetki Kontrolü Şablonu (yönetici)
```typescript
import { getSession } from "@/lib/auth";
const session = await getSession();
if (!session || !["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(session.user.role)) {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
}
```

### Yeni API Route Yetki Kontrolü Şablonu (gönüllü)
```typescript
import { getGonulluFromCookie } from "@/lib/gonullu-auth";
const session = await getGonulluFromCookie();
if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
```

### Public Form Input Stili
Tüm public sayfa input'larında (login, kayıt) `className="public-input"` kullan, inline style verme. `.public-input` `globals.css`'de `!important` ile tanımlıdır.

### Panel İçi Input Stili
Panel sayfalarında `inputCls` değişkeni (Tailwind class string) veya inline style kullan. Örnekler `kullanicilar/page.tsx`'te mevcut.

---

## 10. Bilinen Sorunlar ve Çözümleri

| Sorun | Kök Neden | Çözüm |
|---|---|---|
| Public sayfalarda input box'ı 1-2s sonra kayboluyor | Tailwind Preflight / globals.css kuralları inline style'ı override ediyor | `className="public-input"` kullan (`!important` CSS class) |
| Panel CSS public sayfaları bozuyor | Global `!important` kurallar | Panel CSS'i `.panel-layout` class'ına scope'la |
| Hydration flash (input stilleri SSR→client farklı) | `useColors()` hook `useEffect` ile mount sonrası değişiyor | Public sayfalarda `useColors()` kullanma, hardcoded COLORS sabiti kullan |
| Dashboard bekleyen badge tüm sistemleri sayıyor | Fil  tresiz Prisma sorgusu | `getStats()` `userSistem` parametresi alıyor, SISTEM_KISITLI roller için where filtresi uyguluyor |
| Migration history drift | Production DB elle değiştirildi | `prisma db push` kullan |
