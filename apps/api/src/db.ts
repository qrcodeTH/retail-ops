import pg from "pg";
import { config } from "./config.js";

// Pool = กลุ่ม connection ที่เปิดค้างไว้ reuse ข้าม request
// เปิด TCP connection ใหม่ทุก request แพง (handshake + auth กับ Postgres)
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // ถ้าต่อ DB ไม่ได้ให้ล้มภายใน 2 วินาที ไม่ปล่อยให้ request รอไม่มีที่สิ้นสุด
  connectionTimeoutMillis: 2_000,
});

// connection ที่ว่างอยู่ใน pool อาจถูก DB ตัดทิ้ง (DB restart, network ขาด)
// ถ้าไม่ดัก event นี้ Node จะถือว่าเป็น unhandled error แล้ว process ตายทั้งตัว
pool.on("error", (err) => {
  console.error("idle db client error (pool will reconnect on next query):", err.message);
});
