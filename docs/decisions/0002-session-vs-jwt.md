# 0002 — Server-side session (cookie) แทน JWT สำหรับ P1

**Requirement / ปัญหา:** หลัง login server ต้องรู้ว่า request ถัดไปเป็นใคร และ "พนักงานลาออก/ย้ายสาขา" ต้องมีผลทันที
**ทางเลือก:** A) server-side session: random id ใน DB + HttpOnly cookie  B) JWT เซ็นข้อมูล user ให้ client ถือ
**เลือก:** A
**เพราะ:** logout/ถอดสิทธิ์ = ลบแถวเดียว มีผลทันที (พิสูจน์แล้ว: cookie เก่าหลัง logout ได้ 401); server เดียวไม่ต้องแชร์ secret ข้าม service; cookie HttpOnly ทำให้ JS ในหน้าเว็บขโมย token ไม่ได้; ไม่ต้องจัดการ refresh token
**ข้อเสียที่ยอมรับ:** ทุก request query DB 1 ครั้งเพื่อ lookup session; ถ้ามี API หลายตัวต้องแชร์ DB/session store; mobile app ต้องจัดการ cookie เอง (หรือใช้ header แทน)
**หลักฐาน:** curl: login → cookie HttpOnly → /me 200 → logout → cookie เดิม 401
**จะเปลี่ยนใจเมื่อ:** มีหลาย service ที่ต้องตรวจสิทธิ์โดยไม่อยากแชร์ session store, หรือ session lookup กลายเป็นคอขวดที่วัดได้ → พิจารณา JWT อายุสั้น + refresh token หรือ session cache ใน Redis
