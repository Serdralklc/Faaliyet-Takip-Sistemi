# Faaliyet Takip Sistemi — Kurulum

## Gereksinimler
- Node.js 18+
- PostgreSQL (yerel veya uzak)

## Adımlar

### 1. .env dosyasını düzenle
```
DATABASE_URL="postgresql://KULLANICI:SIFRE@localhost:5432/faaliyet_takip"
NEXTAUTH_SECRET="rastgele-uzun-bir-anahtar"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="email@gmail.com"
SMTP_PASS="uygulama-sifresi"
SMTP_FROM="Faaliyet Takip <email@gmail.com>"
```

### 2. Veritabanı oluştur
PostgreSQL'de `faaliyet_takip` adında bir veritabanı oluştur.

### 3. Migration çalıştır
```bash
npm run db:migrate
```

### 4. Başlangıç verilerini yükle (bölgeler + admin hesabı)
```bash
npx ts-node --esm prisma/seed.ts
```

### 5. Geliştirme sunucusunu başlat
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışır.

**Admin Girişi:**
- E-posta: admin@sistem.com
- Şifre: Admin123!

> İlk girişten sonra şifrenizi değiştirin.
