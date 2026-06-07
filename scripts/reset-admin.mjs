import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:yGuqoBIaufZSvklDsLAgXAvUzwabCHSR@acela.proxy.rlwy.net:53083/railway",
  ssl: { rejectUnauthorized: false },
});

const email = "Srdralkilic@gmail.com";
const password = "Ser53-";

const hash = await bcrypt.hash(password, 12);

const res = await pool.query(
  `UPDATE "User" SET email = $1, "passwordHash" = $2 WHERE role = 'SISTEM_ADMIN' RETURNING id, email, role`,
  [email, hash]
);

if (res.rowCount === 0) {
  console.log("❌ SISTEM_ADMIN bulunamadı! Tüm kullanıcılar:");
  const all = await pool.query(`SELECT id, email, role, status FROM "User"`);
  console.table(all.rows);
} else {
  console.log("✅ Admin güncellendi:", res.rows[0]);
  console.log("   E-posta:", email);
  console.log("   Şifre:", password);
}

await pool.end();
