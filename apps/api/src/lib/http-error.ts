// error ที่ตั้งใจส่งกลับ client พร้อม status code
// แยกจาก Error ธรรมดา (bug) ซึ่งต้องกลายเป็น 500 และไม่เปิดเผยรายละเอียด
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}
