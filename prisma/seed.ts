import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BOLGELER = [
  {
    no: 1,
    ad: "1. Bölge",
    iller: [
      "Adıyaman", "Batman", "Diyarbakır Kayapınar", "Diyarbakır Sur",
      "Elazığ", "Malatya", "Mardin", "Şanlıurfa Akçakale",
      "Şanlıurfa Birecik", "Şanlıurfa Eyyübiye", "Şanlıurfa Haliliye",
      "Şanlıurfa Harran", "Şanlıurfa Viranşehir",
    ],
  },
  {
    no: 2,
    ad: "2. Bölge",
    iller: ["Bitlis", "Hakkari", "Muş", "Siirt", "Şırnak", "Van"],
  },
  {
    no: 3,
    ad: "3. Bölge",
    iller: ["Ağrı", "Ardahan", "Bingöl", "Erzurum", "Iğdır", "Kars"],
  },
  {
    no: 4,
    ad: "4. Bölge",
    iller: ["Artvin", "Bayburt", "Gümüşhane", "Rize", "Trabzon"],
  },
  {
    no: 5,
    ad: "5. Bölge",
    iller: ["Amasya", "Giresun", "Ordu", "Samsun", "Samsun Bafra", "Sinop"],
  },
  {
    no: 6,
    ad: "6. Bölge",
    iller: [
      "Erzincan", "Kayseri Kocasinan", "Kayseri Melikgazi",
      "Nevşehir", "Sivas Merkez", "Sivas Suşehri", "Tokat", "Yozgat",
    ],
  },
  {
    no: 7,
    ad: "7. Bölge",
    iller: [
      "Adana Çukurova", "Adana Yüreğir", "Gaziantep", "Hatay",
      "Hatay İskenderun", "Kahramanmaraş", "Kilis", "Mersin",
      "Mersin Silifke", "Osmaniye",
    ],
  },
  {
    no: 8,
    ad: "8. Bölge",
    iller: [
      "Aksaray", "Karaman", "Konya Karatay",
      "Konya Meram", "Konya Selçuklu", "Niğde",
    ],
  },
  {
    no: 9,
    ad: "9. Bölge",
    iller: ["Ankara 1", "Ankara 2", "Ankara 3", "Kırıkkale", "Kırşehir"],
  },
  {
    no: 10,
    ad: "10. Bölge",
    iller: [
      "Bartın", "Çankırı", "Çorum", "Karabük",
      "Kastamonu", "Kastamonu Bozkurt", "Zonguldak",
    ],
  },
  {
    no: 11,
    ad: "11. Bölge",
    iller: [
      "Bilecik", "Bolu", "Düzce", "Kocaeli",
      "Sakarya", "Yalova", "Zonguldak Karadeniz Ereğli",
    ],
  },
  {
    no: 12,
    ad: "12. Bölge",
    iller: [
      "Balıkesir", "Balıkesir Bandırma", "Balıkesir Körfez",
      "Bilecik Bozüyük", "Bursa Nilüfer", "Bursa Osmangazi",
      "Bursa Yıldırım", "Eskişehir", "Kütahya", "Kütahya Tavşanlı",
    ],
  },
  {
    no: 13,
    ad: "13. Bölge",
    iller: ["Afyon", "Antalya", "Burdur", "Isparta", "Uşak"],
  },
  {
    no: 14,
    ad: "14. Bölge",
    iller: [
      "Aydın", "Denizli", "İzmir Güney", "İzmir Kuzey",
      "Manisa", "Muğla Bodrum", "Muğla Fethiye",
    ],
  },
  {
    no: 15,
    ad: "15. Bölge",
    iller: [
      "Çanakkale", "Edirne", "Kırklareli", "Kırklareli Lüleburgaz",
      "Tekirdağ", "Tekirdağ Çerkezköy", "Tekirdağ Çorlu",
    ],
  },
  {
    no: 16,
    ad: "16. Bölge",
    iller: [
      "Arnavutköy", "Bağcılar", "Bahçelievler", "Başakşehir",
      "Bayrampaşa", "Esenler", "Güngören", "Zeytinburnu",
    ],
  },
  {
    no: 17,
    ad: "17. Bölge",
    iller: [
      "Beyoğlu", "Eyüpsultan", "Fatih", "Gaziosmanpaşa",
      "Kağıthane", "Sarıyer", "Sultangazi", "Şişli",
    ],
  },
  {
    no: 18,
    ad: "18. Bölge",
    iller: [
      "Avcılar", "Beylikdüzü", "Büyükçekmece", "Esenyurt",
      "Halkalı", "Küçükçekmece", "Selimpaşa", "Silivri",
    ],
  },
  {
    no: 19,
    ad: "19. Bölge",
    iller: [
      "Ataşehir", "Beykoz", "Çekmeköy", "Çengelköy",
      "Dudullu", "Kadıköy", "Ümraniye", "Üsküdar",
    ],
  },
  {
    no: 20,
    ad: "20. Bölge",
    iller: [
      "Kartal", "Kurtköy", "Maltepe", "Pendik",
      "Sancaktepe", "Sultanbeyli", "Tuzla",
    ],
  },
];

async function main() {
  console.log("Seed başlıyor...");

  // Bölge ve illeri oluştur
  for (const bolgeData of BOLGELER) {
    const bolge = await prisma.bolge.upsert({
      where: { no: bolgeData.no },
      update: { ad: bolgeData.ad },
      create: { no: bolgeData.no, ad: bolgeData.ad },
    });

    for (const ilAd of bolgeData.iller) {
      const mevcut = await prisma.il.findFirst({
        where: { ad: ilAd, bolgeId: bolge.id },
      });
      if (!mevcut) {
        await prisma.il.create({ data: { ad: ilAd, bolgeId: bolge.id } });
      }
    }
  }

  // Admin kullanıcısı
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@sistem.com" },
    update: {},
    create: {
      ad: "Sistem",
      soyad: "Admin",
      email: "admin@sistem.com",
      passwordHash,
      role: "SISTEM_ADMIN",
      status: "AKTIF",
    },
  });

  console.log("Seed tamamlandı.");
  console.log("Admin: admin@sistem.com / Admin123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
