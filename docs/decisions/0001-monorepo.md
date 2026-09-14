# 0001 — Monorepo สำหรับทุก product

**Requirement / ปัญหา:** P1–P4 ต่อยอดระบบเดียวกัน (ใช้ auth, DB, API ร่วมกัน) และคนทำมีคนเดียว
**ทางเลือก:** A) monorepo `apps/*` + pnpm workspace  B) repo แยกต่อ service  C) Next.js full-stack ก้อนเดียว
**เลือก:** A
**เพราะ:** เปลี่ยน API contract แล้วแก้ทั้ง api/web/mobile ใน commit เดียว; setup CI/Docker ครั้งเดียว; ไม่มีเหตุผลเรื่องทีม/release แยกที่ทำให้ต้องแยก repo; C ผูก API กับ Next ทำให้ mobile (P4) ใช้ API ร่วมยากขึ้น
**ข้อเสียที่ยอมรับ:** ถ้าอนาคตแยกทีมดูแล จะต้องแยก release pipeline ภายใน repo เอง
**หลักฐาน:** ยังไม่มี — เป็นการเลือกจาก constraint ทีม ไม่ใช่จากการวัด
**จะเปลี่ยนใจเมื่อ:** มีหลายทีมที่ต้องการ release cadence ต่างกัน หรือ product ใหม่ไม่แชร์ domain เดิมเลย (เช่นจองตั๋ว → repo ใหม่)
