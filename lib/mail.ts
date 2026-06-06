import nodemailer from "nodemailer";

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
