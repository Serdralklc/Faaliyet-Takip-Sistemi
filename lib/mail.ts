import nodemailer from "nodemailer";

/** Kullanıcı girdisini e-posta HTML'ine gömmeden önce kaçışla */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvitationEmail(
  email: string,
  adSoyad: string,
  token: string
) {
  const url = `${process.env.NEXTAUTH_URL}/davet/${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Faaliyet Takip Sistemi - Hesabınız Oluşturuldu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Faaliyet Takip Sistemi</h2>
        <p>Sayın ${adSoyad},</p>
        <p>Hesabınız oluşturulmuştur. Şifrenizi belirlemek için aşağıdaki bağlantıya tıklayın.</p>
        <a href="${url}" style="
          display: inline-block;
          background-color: #1e40af;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        ">Şifremi Belirle</a>
        <p style="color: #6b7280; font-size: 14px;">Bu bağlantı 48 saat geçerlidir.</p>
        <p style="color: #6b7280; font-size: 14px;">Eğer bu daveti siz talep etmediyseniz bu e-postayı görmezden gelebilirsiniz.</p>
      </div>
    `,
  });
}

/** Ortak kurumsal e-posta çerçevesi */
function mailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0B6B3A;">${title}</h2>
      ${bodyHtml}
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Serhendi Gençlik — Faaliyet Takip Sistemi</p>
    </div>
  `;
}

function mailButton(url: string, label: string): string {
  return `<a href="${url}" style="display: inline-block; background-color: #0B6B3A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: bold;">${label}</a>`;
}

/** Şifre sıfırlama bağlantısı gönderir (yönetici veya gönüllü) */
export async function sendPasswordResetEmail(email: string, adSoyad: string, url: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Şifre Sıfırlama Talebi — Faaliyet Takip Sistemi",
    html: mailShell(
      "Şifre Sıfırlama",
      `
        <p>Sayın ${escapeHtml(adSoyad)},</p>
        <p>Hesabınız için bir şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki bağlantıya tıklayın.</p>
        ${mailButton(url, "Şifremi Sıfırla")}
        <p style="color: #6b7280; font-size: 14px;">Bu bağlantı 1 saat geçerlidir ve tek kullanımlıktır.</p>
        <p style="color: #6b7280; font-size: 14px;">Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz; şifreniz değişmez.</p>
      `
    ),
  });
}

/** Gönüllü e-posta doğrulama bağlantısı gönderir */
export async function sendEmailVerification(email: string, adSoyad: string, url: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "E-posta Adresinizi Doğrulayın — Serhendi Gençlik",
    html: mailShell(
      "E-posta Doğrulama",
      `
        <p>Sayın ${escapeHtml(adSoyad)},</p>
        <p>Serhendi Gençlik gönüllü kaydınız alındı. E-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın.</p>
        ${mailButton(url, "E-postamı Doğrula")}
        <p style="color: #6b7280; font-size: 14px;">Bu bağlantı 3 gün geçerlidir.</p>
      `
    ),
  });
}

/** Bildirim Merkezi — duyuru/bilgilendirme e-postası */
export async function sendBildirimEmail(email: string, aliciAd: string, baslik: string, mesaj: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `${baslik} — Serhendi Gençlik`,
    html: mailShell(
      escapeHtml(baslik),
      `
        <p>Sayın ${escapeHtml(aliciAd)},</p>
        <div style="margin: 16px 0; padding: 16px; background: #F9FAFB; border-radius: 8px; font-size: 15px; line-height: 1.7;">
          ${escapeHtml(mesaj).replace(/\n/g, "<br/>")}
        </div>
        <p style="color: #6b7280; font-size: 13px;">Detaylar için panelinizdeki Bildirim Merkezi'ne bakabilirsiniz.</p>
      `
    ),
  });
}

/** İletişim formundan gelen mesajı kurum adresine iletir */
export async function sendContactMessage(data: {
  adSoyad: string;
  eposta: string;
  telefon?: string;
  mesaj: string;
}) {
  const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
  if (!to) throw new Error("CONTACT_EMAIL veya SMTP_USER tanımlı değil.");

  const adSoyad = escapeHtml(data.adSoyad);
  const eposta = escapeHtml(data.eposta);
  const telefon = data.telefon ? escapeHtml(data.telefon) : "—";
  const mesaj = escapeHtml(data.mesaj).replace(/\n/g, "<br/>");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    replyTo: data.eposta,
    subject: `İletişim Formu — ${data.adSoyad}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0B6B3A;">Yeni İletişim Mesajı</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 8px; color: #6b7280; width: 110px;">Ad Soyad</td><td style="padding: 6px 8px;"><strong>${adSoyad}</strong></td></tr>
          <tr><td style="padding: 6px 8px; color: #6b7280;">E-posta</td><td style="padding: 6px 8px;">${eposta}</td></tr>
          <tr><td style="padding: 6px 8px; color: #6b7280;">Telefon</td><td style="padding: 6px 8px;">${telefon}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #F9FAFB; border-radius: 8px; font-size: 15px; line-height: 1.7;">
          ${mesaj}
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Bu mesaj web sitesindeki iletişim formundan gönderildi. Yanıtlamak için doğrudan "Yanıtla" kullanabilirsiniz.</p>
      </div>
    `,
  });
}
