// =====================================================
//  ไฟล์ test แรก — สอนเขียน Unit Test
//  สิ่งที่ต้องรู้ก่อน:
//
//  1. require = import ไฟล์อื่นมาใช้
//     คล้าย import ใน Angular
//     require('../src/services/leave.service')
//     = "ขอเอา LeaveService จาก path นี้มาใช้"
//
//  2. describe = รวม test หัวข้อเดียวกัน
//     คล้ายโฟลเดอร์รวม test หลายๆอัน
//
//  3. it(ชื่อ, fn) = 1 test case
//     = 1 checklist ที่อยากตรวจ
//
//  4. expect( จริง ).toBe( คาด )
//     Jest เทียบให้อัตโนมัติ ว่า จริง === คาด หรือเปล่า
//     - ถ้าเท่ากัน → PASS ✅
//     - ถ้าไม่เท่ากัน → FAIL ❌ (Jest บอกค่าที่ได้ vs ค่าที่คาด)
// =====================================================

// STEP 1: require — import ฟังก์ชัน calcLeaveDays จาก leave.service.js
const LeaveService = require('../src/services/leave.service');

// STEP 2: describe — ตั้งชื่อกลุ่ม test
describe('calcLeaveDays — คำนวณจำนวนวันลา', () => {

  // STEP 3: it(ชื่อ, fn) — เขียน test แต่ละอัน
  it('วันเดียวกัน (29-29) → ควรได้ 1 วัน', () => {
    // เรียกใช้ฟังก์ชัน
    const result = LeaveService.calcLeaveDays('2026-07-29', '2026-07-29');

    // ตรวจ: result ต้องเท่ากับ 1
    // Jest จะเทียบให้: result === 1 ?
    expect(result).toBe(1);
  });

  it('27-29 ก.ค. → ควรได้ 3 วัน (รวมหัวท้าย)', () => {
    const result = LeaveService.calcLeaveDays('2026-07-27', '2026-07-29');

    expect(result).toBe(3);
    // ถ้า result === 3 → PASS
    // ถ้า result !== 3 → FAIL พร้อมข้อความ:
    //   Expected: 3
    //   Received: (ค่าที่ได้จริง)
  });

  it('ข้ามเดือน 30 ก.ค. - 1 ส.ค. → ควรได้ 3 วัน', () => {
    const result = LeaveService.calcLeaveDays('2026-07-30', '2026-08-01');

    expect(result).toBe(3);
  });

});
