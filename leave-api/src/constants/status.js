/**
 * Central Status Constants — แทน cms_status ของระบบ EEC
 * ============================================================================
 * ไฟล์นี้เป็น Single Source of Truth สำหรับสถานะใบลา
 * แทนตาราง cms_status ของระบบ EEC แต่เป็น in-code ไม่ต้อง JOIN
 * ไม่ต้องสร้างตาราง DB จริง — ใช้ constants เพื่อลดความซับซ้อนและเพิ่ม performance
 *
 * FLOW การเปลี่ยนสถานะ:
 *   SU (Submitted/ยื่นคำขอ)              -> DC, CX
 *   DC (DocCheck/รอตรวจสอบเอกสาร)        -> VC, SU
 *   VC (VerifyCheck/รอตรวจสอบความถูกต้อง)-> MA, SU, RJ
 *   MA (ManagerApproval/รอหัวหน้าอนุมัติ)-> AP, SB, RJ
 *   AP (Approved) / SB (SendBack) / CX (Cancelled) / RJ (Rejected) = ปลายทาง
 *
 * การใช้งาน:
 *   const { STATUS, FLOW, getStatusThai, getStatusEn, getStatusDesc } = require('../constants/status');
 *   STATUS.SU.code          // 'SU'
 *   getStatusThai('SU')     // 'ยื่นคำขอ'
 *   FLOW[STATUS.SU.code]    // ['DC','CX']
 *
 * หมายเหตุ: ใช้ CommonJS (module.exports) เพื่อให้เข้ากับ codebase ปัจจุบัน
 * ============================================================================
 */

'use strict';

const STATUS = {
  SU: { code: 'SU', th: 'ยื่นคำขอ', en: 'Submitted', desc: 'emp ยื่นคำขอ -> DC' },
  DC: { code: 'DC', th: 'รอตรวจสอบเอกสาร', en: 'DocCheck', desc: 'รอ pretemp ตรวจครบถ้วน -> VC/SU' },
  VC: { code: 'VC', th: 'รอตรวจสอบความถูกต้อง', en: 'VerifyCheck', desc: 'รอ temp ตรวจถูกต้อง -> MA/SU' },
  MA: { code: 'MA', th: 'รอหัวหน้าอนุมัติ', en: 'ManagerApproval', desc: 'รอ mgr อนุมัติ -> AP/SB/RJ' },
  AP: { code: 'AP', th: 'อนุมัติแล้ว', en: 'Approved', desc: 'เสร็จสิ้น' },
  SB: { code: 'SB', th: 'ส่งกลับแก้ไข', en: 'SendBack', desc: 'ถูกส่งกลับ -> SU' },
  CX: { code: 'CX', th: 'ยกเลิก', en: 'Cancelled', desc: 'ยกเลิกคำขอ' },
  RJ: { code: 'RJ', th: 'ไม่อนุมัติ', en: 'Rejected', desc: 'ไม่อนุมัติ' },
};

const FLOW = {
  SU: ['DC', 'CX'],
  DC: ['VC', 'SU'],
  VC: ['MA', 'SU', 'RJ'],
  MA: ['AP', 'SB', 'RJ'],
};

/**
 * ดึงชื่อภาษาไทยของสถานะ
 * @param {string} code - รหัสสถานะ เช่น 'SU'
 * @returns {string} ชื่อไทย หรือ code เดิมถ้าไม่พบ
 */
function getStatusThai(code) {
  if (!code || typeof code !== 'string') return code;
  const entry = STATUS[code];
  return entry ? entry.th : code;
}

/**
 * ดึงชื่อภาษาอังกฤษของสถานะ
 * @param {string} code - รหัสสถานะ เช่น 'SU'
 * @returns {string} ชื่ออังกฤษ หรือ code เดิมถ้าไม่พบ
 */
function getStatusEn(code) {
  if (!code || typeof code !== 'string') return code;
  const entry = STATUS[code];
  return entry ? entry.en : code;
}

/**
 * ดึงคำอธิบายของสถานะ
 * @param {string} code - รหัสสถานะ เช่น 'SU'
 * @returns {string} คำอธิบาย หรือ code เดิมถ้าไม่พบ
 */
function getStatusDesc(code) {
  if (!code || typeof code !== 'string') return code;
  const entry = STATUS[code];
  return entry ? entry.desc : code;
}

module.exports = {
  STATUS,
  FLOW,
  getStatusThai,
  getStatusEn,
  getStatusDesc,
};
