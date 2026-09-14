// Port: สัญญาที่กฎธุรกิจต้องการจากโลกภายนอก — "ฉันต้องการที่เก็บงานที่ทำ 3 อย่างนี้ได้"
// ใครจะมาเป็นที่เก็บ (Postgres, array, SQLite) ไม่ใช่เรื่องของกฎ
import type { Task } from "./domain.js";

export type NewTask = Pick<Task, "storeId" | "title" | "description" | "createdBy">;

export interface TaskRepository {
  listByStore(storeId: number): Promise<Task[]>;
  // หาใน "สาขานี้" เท่านั้น — scope เป็นส่วนหนึ่งของสัญญา ไม่ใช่สิ่งที่ลืมได้
  findInStore(id: number, storeId: number): Promise<Task | null>;
  insert(task: NewTask): Promise<Task>;
  save(task: Task): Promise<Task>;
}
