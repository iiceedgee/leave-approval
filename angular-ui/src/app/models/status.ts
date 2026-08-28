/**
 * แทน cms_status EEC แบบ in-code
 * Single Source of Truth สำหรับ Angular
 *
 * Centralized leave-request status definitions.
 * เดิมเก็บในตาราง `cms_status` (EEC) — ย้ายมาเป็น in-code เพื่อให้
 *  - เป็น Single Source of Truth ฝั่ง Frontend
 *  - ได้ Type-safety ผ่าน `StatusCode`
 *  - ลดการ query DB สำหรับสถานะที่คงที่ตาม workflow
 *
 * Workflow หลัก (ย่อเหลือ 4 ขั้น — VC ถูกรวมเข้ากับ DC): SU -> DC -> MA -> AP
 *                DC/MA -> SB (ส่งกลับแก้ไข) -> SU
 *                SU/DC/MA -> CX/RJ (ยกเลิก/ไม่อนุมัติ)
 */

export const STATUS = {
  SU: { code: 'SU', th: 'ยื่นคำขอ', en: 'Submitted', desc: 'emp ยื่นคำขอ -> DC' },
  DC: { code: 'DC', th: 'รอตรวจสอบเอกสาร', en: 'DocCheck', desc: 'รอตรวจสอบเอกสาร (รวม VC) -> MA/SU/RJ' },
  MA: { code: 'MA', th: 'รอหัวหน้าอนุมัติ', en: 'ManagerApproval', desc: 'รอหัวหน้าอนุมัติ' },
  AP: { code: 'AP', th: 'อนุมัติแล้ว', en: 'Approved', desc: 'อนุมัติแล้ว' },
  SB: { code: 'SB', th: 'ส่งกลับแก้ไข', en: 'SendBack', desc: 'ส่งกลับแก้ไข' },
  CX: { code: 'CX', th: 'ยกเลิก', en: 'Cancelled', desc: 'ยกเลิกคำขอ' },
  RJ: { code: 'RJ', th: 'ไม่อนุมัติ', en: 'Rejected', desc: 'ไม่อนุมัติ' },
} as const;

export type StatusCode = keyof typeof STATUS;

/**
 * FLOW การเปลี่ยนสถานะ — ย่อเหลือ 4 ขั้น (VC ถูกรวมเข้ากับ DC)
 * SU -> DC, CX | DC -> MA, SU, RJ | MA -> AP, SB, RJ
 */
export const FLOW: Record<string, StatusCode[]> = {
  SU: ['DC', 'CX'],
  DC: ['MA', 'SU', 'RJ'],
  MA: ['AP', 'SB', 'RJ'],
};

/**
 * คืน label ภาษาไทยของสถานะ — fallback เป็น code เดิมถ้าไม่พบ
 */
export function getStatusThai(code: string): string {
  if (!code) return code;
  const entry = STATUS[code as StatusCode];
  return entry ? entry.th : code;
}

/**
 * คืน label ภาษาอังกฤษของสถานะ — fallback เป็น code เดิมถ้าไม่พบ
 */
export function getStatusEn(code: string): string {
  if (!code) return code;
  const entry = STATUS[code as StatusCode];
  return entry ? entry.en : code;
}

/**
 * คืนคำอธิบาย workflow ของสถานะ — fallback เป็น code เดิมถ้าไม่พบ
 */
export function getStatusDesc(code: string): string {
  if (!code) return code;
  const entry = STATUS[code as StatusCode];
  return entry ? entry.desc : code;
}

/**
 * Map สำหรับ UI โดยตรง: code -> label ไทย
 * ใช้แทนการ hard-code Record<string,string> ซ้ำในหลาย component
 */
export const STATUS_LABELS: Record<StatusCode, string> = {
  SU: STATUS.SU.th,
  DC: STATUS.DC.th,
  MA: STATUS.MA.th,
  AP: STATUS.AP.th,
  SB: STATUS.SB.th,
  CX: STATUS.CX.th,
  RJ: STATUS.RJ.th,
};
