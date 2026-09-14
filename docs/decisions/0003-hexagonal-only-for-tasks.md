# 0003 — Hexagonal เฉพาะโมดูล tasks, auth เป็น layered

**Requirement / ปัญหา:** tasks มีกฎหลายข้อ (สิทธิ์ตามสาขา, role, ownership, state machine) ที่ต้องพิสูจน์ว่าถูกและจะมีทางเข้าเพิ่ม (event consumer ใน P2) ส่วน auth มีกฎน้อยและผูกกับ HTTP (cookie) โดยธรรมชาติ
**ทางเลือก:** A) layered ทุกโมดูล  B) hexagonal ทุกโมดูล  C) hexagonal เฉพาะโมดูลที่มีกฎ
**เลือก:** C
**เพราะ:** กฎของ tasks ทดสอบได้ 12 กรณีใน 240ms โดยไม่ต้องมี DB (in-memory adapter) และ use case เดียวกันจะถูกเรียกจากทั้ง HTTP และ event consumer; auth ทำ hexagonal ได้แต่ได้แค่ interface ครอบ SELECT/INSERT เพิ่ม 3 ไฟล์โดยไม่มีกฎให้ test
**ข้อเสียที่ยอมรับ:** tasks มี 6 ไฟล์แทน 2; สองโมดูลใช้คนละสไตล์ คนใหม่ต้องรู้ว่าทำไม (ไฟล์นี้คือคำตอบ); DomainError ต้องมี mapping → HTTP status ที่ app.ts
**หลักฐาน:** `pnpm test` ผ่านขณะ Postgres ปิด; curl smoke test หลัง refactor ได้ผลเท่าเดิม (201/404/409/200/200/409)
**จะเปลี่ยนใจเมื่อ:** auth เริ่มมีกฎเช่น lockout หลังผิดหลายครั้ง, SSO หลายแบบ → ย้าย auth เป็น hexagonal ด้วย; หรือถ้าทีมเห็นว่าสองสไตล์สับสนกว่าประโยชน์ที่ได้ → เลือกทางเดียว
