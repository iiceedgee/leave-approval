# SHEET INTERVIEW — TISCO EEC OSS (Officer + Citizen + Eform) — 15Q ครอบคลุม

> **candidate: ไอซ์ | fullstack 1y9m | Angular 16 / React / .NET C# / Node**
> **stack สอบ: OFFICER-API (.NET 6 + XPO) + OFFICER-UI (Angular16) + CITIZEN-UI/API + EEC-eform light**
> **วันที่ทำชีท: 31 ส.ค. 2026 | สำหรับซ้อมปากเปล่า 20-30 วิ/ข้อ | ไม่มี Q แนะนำตัว | 15Q = 92% ครอบคลุม (Senior Verify)**
> **งานไอซ์จริง: Bell กระดิ่ง + Email (เพิ่มเงื่อนไข) + Consult (เพิ่ม condition + แยก channel) + Master ฝั่ง Officer + Survey Q1-Q6 Google Form + Bugfix citizen/officer**

---

## บริบทโปรเจกต์ที่ต้องจำให้ขึ้นใจ (พูดให้ตรง ไม่โม้)

**EEC OSS = ระบบขออนุญาต One Stop Service ของ EEC** แบ่ง 2 ฝั่ง
- **Officer (เจ้าหน้าที่)** — `eec-oss-officer-api` (.NET 6 + DevExpress XPO 23.2.3) + `eec-oss-officer-ui` (Angular 16.2.12 + DevExtreme 23.1.7)
- **Citizen (ประชาชน)** — `EEC-front/eec-oss-citizen-ui` (Angular 16 + FormIO) + `EEC-back/eec-oss-citizen-api` + `EEC-eform` (ฟอร์มกลาง .NET Core 3.1)

**ไอซ์ทำจริง (พูดได้เต็มปาก):**
- Bell notification (กระดิ่ง) — header polling 30s + VIEW_READ_LIST
- Email notification — เพิ่มเงื่อนไข IsTest/MailRouting/considerEmails + zone 101/102/113
- Consult service — เพิ่ม condition + email แยก 3 ช่องทาง + overlap 4 clauses
- หน้า Master ฝั่ง Officer (CRUD + file filter 5 ไฟล์)
- Survey แบบ Google Form Q1-Q6 (master-question-topic) — master → question → option + HMAC

**ประโยคเซฟ (ใช้ทุกครั้งที่ไม่ได้ทำจาก 0):**
> "ส่วนนี้ระบบวางไว้แล้วครับ mail.ccib.go.th / SmtpClient / โครง XPO ผมมารับช่วงเพิ่มเงื่อนไข-เพิ่ม branch และแก้บั๊กให้ตรง business ครับ พอไล่โค้ดได้ว่าไหลไปทางไหนครับ"

---

## วิธีใช้ชีทนี้

1. อ่าน `senior ถาม:` → ลองตอบปากเปล่า 30 วิ
2. เทียบ `เฉลย — คำตอบผ่าน` → ท่องประโยค 20-30 วิให้คล่อง
3. จำ `ไฟล์:บรรทัด` ไว้ขยี้ต่อ — senior จะถาม "อยู่ไฟล์ไหน บรรทัดไหน"
4. ท้ายชีทมีตารางไฟล์รวม + เช็คลิสต์ 360°

---

### Q1/15 — Master: Cms* vs EecMdm* ต่างกันยังไง ทำไมต้องแยก?

**senior ถาม:** "เห็น Master มีทั้ง CmsOrganize กับ EecMdmConsultType มันต่างกันยังไง? ทำไมไม่รวมเป็น MDM ตัวเดียว?"

**Hint วิธีคิด:** ตอบด้วยที่มา 2 ก้อน — Cms* = CMS ตั้งต้นที่ migrate มา, EecMdm* = MDM ที่ทีมทำใหม่บน XPO/EEC ทำไมแยก = แยก bounded context + ไม่กระทบ CMS เดิม

**ลองตอบมาได้เลยครับ** *(พูด 30 วิ — อัดเสียงแล้วฟัง)*

<details>
<summary>เฉลย Q1 — คำตอบผ่าน (20-30 วิ)</summary>

> "Cms* เป็น master ที่มากับ CMS เดิมครับ เช่น `CmsOrganizeController.cs:21` ดูแลองค์กร/โครงสร้างเดิมครับ ส่วน `EecMdm*` เช่น `EecMdmConsultTypeController.cs` เป็น MDM ที่ทำใหม่เพื่อ EEC โดยเฉพาะ แยกเพราะไม่อยากไปแก้ CMS ตั้งต้นให้กระทบระบบอื่น แล้วให้ officer-ui หน้า `master-consult-type` เรียก EecMdm* โดยตรงผ่าน XPO ครับ"

**ทำไมตอบแบบนี้ผ่าน:** พูดชื่อไฟล์ 2 ฝั่งชัด + เหตุผลแยก bounded context ไม่ใช่แค่ "ตั้งชื่อต่างกัน"
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้ว XPO mapping อยู่ไหน?" → `Entity/CmsOrganize.cs` vs `Entity/EecMdmConsultType.cs` + `AppSetting.cs`
- "ทำไมไม่ทำ MDM เดียวแล้วให้ CMS เรียก?" → จะกระทบ CMS workflow เก่า, แยกเพื่อให้ EEC deploy อิสระ
- "master นี้มี file filter ยังไง?" → ต่อ Q8

**คะแนน:** ผ่าน = พูด Cms vs EecMdm + ยกไฟล์ 2 ตัว + เหตุผลแยก / ตก = ตอบว่า "เหมือนกันแค่ตั้งชื่อต่าง"

**ประโยคเซฟ:** "โครง Cms* พี่ทีมวางไว้ก่อนแล้วครับ ผมมาทำ EecMdm* เพิ่มตาม requirement EEC ครับ"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/CmsOrganizeController.cs:21`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecMdmConsultTypeController.cs:12`
- `eec-oss-officer-ui/src/app/components/pages/master-consult-type/*`

</details>

---

### Q2/15 — Bell Notification: Polling 30 วิ ไหลยังไง ทำไมไม่ใช้ SignalR?

**senior ถาม:** "กระดิ่งแจ้งเตือน ทำ polling ยังไง? ทำไมไม่ใช้ WebSocket/SignalR ไปเลย? ถ้า user 10k คนล่ะ?"

**Hint วิธีคิด:** ไล่ flow = header.component.ts interval → EecTxnNotiController → DB View → EecTxnNotiReadController อัปเดตอ่านแล้ว แล้วตอบ tradeoff polling vs SignalR — ง่าย/เสถียร/พอสำหรับ officer หลักสิบคน ไม่ต้องคุม connection

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q2 — คำตอบผ่าน (20-30 วิ)</summary>

> "ฝั่ง UI `header.component.ts:43` (officer-ui repo แยก) ตั้ง `interval(30000)` ยิง `GET /EecTxnNoti` ทุก 30 วิครับ API `EecTxnNotiController.cs:42` อ่านจาก `VIEW_READ_LIST` ที่ join `EEC_TXN_NOTI + EEC_TXN_NOTI_READ` พอกดอ่านก็ยิง `EecTxnNotiReadController.cs:22` ไปอัปเดต NOTI_READ ครับ ที่ใช้ polling เพราะ officer ไม่ได้เยอะมากและอยากให้ deploy ง่าย ไม่ต้องดูแล SignalR connection ครับ ถ้า 10k คนต้องย้ายเป็น SignalR หรือทำ backoff ครับ"

**ทำไมตอบแบบนี้ผ่าน:** ไล่ UI → API → DB → อัปเดตอ่านครบ + ตอบ tradeoff + scale
**กับดักที่ senior จะขยี้ต่อ:**
- "30 วิถ้า user 1000 คนจะยิงกี่ request/นาที?" → 2000 req/min ถ้าเพิ่มต้องทำ throttle/backoff หรือย้ายไป SignalR/SSE
- "ถ้า polling ชนกัน request ซ้อนทำไง?" → `switchMap` + `takeUntil(destroy$)` ใน header.component
- "VIEW_READ_LIST ทำอะไร?" → view รวมสถานะอ่าน/ยังไม่อ่าน ให้ officer-ui แสดง badge ได้เลย

**คะแนน:** ผ่าน = พูด interval 30000 + 2 controller + VIEW + เหตุผล polling + scale / ตก = ตอบแค่ "มีกระดิ่งแจ้งเตือน"

**ไฟล์:บรรทัด**
- `eec-oss-officer-ui/src/app/components/layout/header/header.component.ts:43` (officer-ui repo แยก) — `interval(30000).pipe(switchMap(...))`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecTxnNotiController.cs:42` — `GetList` จาก `VIEW_READ_LIST`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecTxnNotiReadController.cs:22` — `POST` mark as read

</details>

---

### Q3/15 — Email Routing: ส่งเมลแยกคนตาม IsTest / MailRouting ยังไง?

**senior ถาม:** "เมล Officer ส่งแยกคนยังไง? เห็นมี IsTest กับ MailRouting คืออะไร? แล้ว OfficerCentralEmails คืออะไร?"

**Hint วิธีคิด:** 3 layer = 1) IsTest เช็ค test/prod 2) MailRouting ใน appsettings.json เป็น map 3) ResolveOfficerRecipients 4 params + merge considerEmails → string[] Emails

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q3 — คำตอบผ่าน (25-30 วิ)</summary>

> "เมล officer ผมใช้ `EmailRecipientHelper.cs:10 IsTestMode` เช็คก่อนครับ ถ้า `IsTest=Y` จะล็อคผู้รับตาม `appsettings.json:131 MailRouting` แล้ว merge `considerEmails` กับ `OfficerEmails` ที่ `:58-59` ครับ ถ้า `IsTest=N` ถึงเข้า branch เลือก `OfficerCentralEmails` ตาม `serviceType` ที่ `:65` ครับ เมธอดจริงคือ `ResolveOfficerRecipients(settings, productionRecipients, serviceType=null, considerEmails=null)` ที่ `:42` ครับ ส่วน `OfficerCentralEmails` ใน `AppSetting.cs:69` เป็น `OfficerCentralEmailConfig[] { ServiceType, string[] Emails }` ครับ"

**ทำไมตอบแบบนี้ผ่าน:** พูด 3 layer ครบ + ชี้ merge เฉพาะตอน IsTest=Y ที่เป็นจุดที่ไอซ์เพิ่ม (`:58` concat)
**กับดักที่ senior จะขยี้ต่อ:**
- "considerEmails เป็น null จะส่งไหม?" → ตอน `IsTest=Y` ถ้า null ก็ข้าม concat ส่งแค่ `OfficerEmails` / ตอน `IsTest=N` ไม่ได้ merge เลย จะเลือกตาม `serviceType → OfficerCentralEmails` แทน
- "MailRouting ใน appsettings หน้าตายังไง?" → `"MailRouting": { "IsTest":"Y", "CitizenEmails":[...], "OfficerEmails":[...], "OfficerCentralEmails":[{ "ServiceType":"consult_14", "Emails":[...] }] }` ที่ `:131` (ตอนนี้มี 4 consult_14..17)
- "ทำไมต้องมี OfficerCentralEmails แยก?" → เป็น default fallback ให้ทุก workflow ไม่ต้อง hardcode เมลกลางซ้ำ

**คะแนน:** ผ่าน = พูด IsTest=Y→merge / IsTest=N→central + 4 params + considerEmails / ตก = ตอบแค่ "ส่งเมลผ่าน SmtpClient"

**ประโยคเซฟ:** "โครง SmtpClient + mail.ccib.go.th พี่ทีมวางไว้แล้วครับ ผมมาเพิ่ม logic แยกผู้รับตาม IsTest/MailRouting กับเพิ่ม branch considerEmails เฉพาะตอน IsTest ครับ"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs:10` — `IsTestMode`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs:42` — `ResolveOfficerRecipients(settings, productionRecipients, serviceType, considerEmails)`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs:58-59` — `merged = considerEmails.Concat(testRecipients)` เฉพาะ IsTest
- `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs:65` — `OfficerCentralEmails.FirstOrDefault(ServiceType==)`
- `eec-oss-officer-api/src/EecOss.Officer.Api/appsettings.json:131` — `MailRouting` config (4 consult)
- `eec-oss-officer-api/src/EecOss.Officer.Api/Models/ReadModels/AppSetting.cs:69` — `OfficerCentralEmailConfig { ServiceType, string[] Emails }`

</details>

---

### Q4/15 — Workflow Condition: เพิ่ม branch แยก zone 101/102/113 ยังไง?

**senior ถาม:** "Workflow ส่งเมลตอน Approve Y มีเงื่อนไขอะไร? เห็นบอกเพิ่ม branch 101/102/113 คืออะไร? ยกตัวอย่างให้ฟังหน่อย"

**Hint วิธีคิด:** ตอบ = EvaluateApproveYRouting → เช็ค isSpecificZoneCase (101/102/113) → ถ้าใช่ให้ ShouldSendProgressAssignReviewer ตัดสินใจส่ง/ไม่ส่ง ต้องยกตัวอย่าง 1 เคสที่เพิ่มจริง

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q4 — คำตอบผ่าน (25-30 วิ)</summary>

> "ตอน Officer กด Approve Y จะเข้า `WorkflowEmailRoutingHelper.cs:39 EvaluateApproveYRouting` ครับ ข้างในเช็ค `isSpecificZoneCase` ว่า zone เป็น 101/102/113 ไหม ถ้าใช่จะไป `WorkflowEmailRoutingHelper.cs:120 ShouldSendProgressAssignReviewer` ตัดสินใจว่าจะส่งเมล assign reviewer ไหมครับ (logic เดียวกันมีใน `WorkflowMailDecisionService.cs` ที่ทำไว้ให้เทสได้) ตัวอย่างที่ผมเพิ่มคือ ถ้าเป็น zone 113 แล้วเป็นงานต่ออายุ ให้ข้ามเมล progress ไปรอ reviewer ตอบก่อนครับ"

**ทำไมตอบแบบนี้ผ่าน:** บอก entry point + ตัวแปร zone + `WorkflowEmailRoutingHelper:120` + ยกตัวอย่าง 1 branch ที่เพิ่มจริง (ไม่ใช่พูดลอย)
**กับดักที่ senior จะขยี้ต่อ:**
- "ทำไมต้องแยก 101/102/113 พิเศษ?" → เป็นเขตอุตสาหกรรมพิเศษที่มี flow ต่างจากเขตทั่วไป ต้องรอผลพิจารณาเพิ่ม
- "ถ้า zone ไม่ใช่ 3 ตัวนี้จะไหลไปไหน?" → เข้า default branch ส่งเมลปกติตาม workflow
- "เพิ่ม branch แล้ว test ยังไงให้ไม่พังของเดิม?" → เทส zone ปกติ vs zone พิเศษ + เทส IsTest=true/false

**คะแนน:** ผ่าน = พูด EvaluateApproveYRouting + isSpecificZoneCase 101/102/113 + ShouldSendProgressAssignReviewer + ยกตัวอย่าง 1 / ตก = ตอบแค่ "เพิ่ม if else"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Helpers/WorkflowEmailRoutingHelper.cs:39` — `EvaluateApproveYRouting(...)`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Helpers/WorkflowEmailRoutingHelper.cs:120` — `ShouldSendProgressAssignReviewer` (ตัวจริง)
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/WorkflowMailDecisionService.cs:11` — wrapper เดียวกันไว้ให้ unit test

</details>

---

### Q5/15 — License Notification: หมดอายุ / ใกล้หมดอายุ ทำยังไง?

**senior ถาม:** "ระบบแจ้งเตือนใบอนุญาตหมดอายุกับใกล้หมดอายุต่างกันยังไง? ส่งเมื่อไหร่?"

**Hint วิธีคิด:** 2 งาน = Expired (หมดแล้ว) vs Expiring (ใกล้หมด 30/15/7 วัน) — มาจาก LicenseNotificationService

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q5 — คำตอบผ่าน (20-30 วิ)</summary>

> "`LicenseNotificationService.cs:33 CheckExpiredLicensesAsync` จะเช็ค `CERT_DET_EXPIRE_DATE <= today` ถ้าหมดแล้วสร้าง `NOTI_TYPE EXP` ทั้ง officer+citizen แล้วเรียก `EmailService:2101 SendNotifyExpired` ครับ ส่วน `CheckRenewalRemindersAsync:160` จะเช็ค `EXPIRE_DATE between today..+30` แล้วดู `remindDays 30/15/7` ถ้า `daysRemaining` ตรงถึงส่ง `NOTI_TYPE RNW` แล้วเรียก `SendNotifyExpiring:2130` ครับ"

**ทำไมตอบแบบนี้ผ่าน:** แยก 2 เคสชัด + บอกวัน + NOTI_TYPE + เมธอด
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้ว batch นี้ใครเรียก?" → `EecTxnNotiController.cs:125 expired-license / :142 expiring-license` — cron ยิง `GET /batch/*`
- "ถ้าใบอนุญาตต่ออายุแล้ว noti เก่าจะหายไหม?" → ไม่หาย ต้อง mark read เอง หรือ cron รอบใหม่จะเช็ค `Any(NOTI_TYPE && ...)` กันซ้ำที่ `CreateOfficerNotificationIfNotExists:763`

**คะแนน:** ผ่าน = พูด EXP vs RNW + 30/15/7 + 2 เมธอด / ตก = ตอบแค่ "ส่งเมลแจ้งหมดอายุ"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/LicenseNotificationService.cs:33` — `CheckExpiredLicensesAsync` (EXP)
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/LicenseNotificationService.cs:160` — `CheckRenewalRemindersAsync` (RNW 30/15/7)
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs:2101` — `SendNotifyExpired`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs:2130` — `SendNotifyExpiring`

</details>

---

### Q6/15 — Consult Flow: ค้นหา + สถานะ + Channel 1/2/3 + ทับซ้อน 4 เงื่อนไข

**senior ถาม:** "Consult ปรึกษา ไหลยังไงตั้งแต่ค้นหาจนจบ? สถานะมีอะไรบ้าง? Channel กับเรื่องทับซ้อนคืออะไร?"

**Hint วิธีคิด:** 4 ชั้น = search (TxnRequestConsultController:54) → status W/D/A/O/S/C → Channel 1 Email 2 Teams 3 Office (Constants:28) → overlap 4 clauses (:441)

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q6 — คำตอบผ่าน (30 วิ)</summary>

> "Consult เริ่มที่ `TxnRequestConsultController.cs:54 search` ครับ รับ filter แล้ว query `EEC_TXN_REQUEST_CONSULT` สถานะมี W รอยืนยันนัดหมาย D ส่งงานแล้ว A ยืนยันนัดหมาย O รับงาน S ปิดเรื่อง WC รอปิดเรื่อง C ยกเลิกครับ (`Models/Constants.cs:34`) Channel ใน `Constants.cs:28` คือ 1 Email 2 Conference 3 สำนักงานบูรพา ผมเพิ่ม logic ส่งเมลแยกตาม channel ครับ ส่วนทับซ้อน 4 เงื่อนไขที่ `TxnRequestConsultController.cs:441` คือเช็คว่าช่วงเวลาปรึกษาชนกับคำขออื่นไหมก่อนจอง slot ครับ"

**ทำไมตอบแบบนี้ผ่าน:** ไล่ flow ครบ 4 ชั้น + พูดชื่อ status ถูกตามโค้ด + channel + overlap 4 clauses ไม่ใช่ตอบแค่ CRUD
**กับดักที่ senior จะขยี้ต่อ:**
- "W/D/A/O/S/C ย่อจากอะไร?" → `W=รอยืนยันนัดหมาย D=ส่งงานแล้ว A=ยืนยันนัดหมาย O=รับงาน S=ปิดเรื่อง C=ยกเลิก WC=รอปิดเรื่อง` — ดูใน `Models/Constants.cs:34`
- "overlap 4 clauses คืออะไรบ้าง?" → `TxnRequestConsultController.cs:441-447` 4 OR: `(start<=exStart && end>=exEnd) || (start>=exStart && end<=exEnd) || (start<=exStart && end>=exStart) || (start<=exEnd && end>=exEnd)` → "วันที่และเวลาที่เลือก มีการนัดหมายอยู่ในระบบแล้ว"
- "Channel ต่างกัน ส่งเมลต่างกันยังไง?" → Channel 1/3 → `SendConsultChangeCitizenCh3` / else `SendConsultChangeCitizen` (Email) — ดู `TxnRequestConsultController.cs:641`

**คะแนน:** ผ่าน = พูด search:54 + status W/D/A/O/S/C ตามโค้ด + Channel 1/2/3 + overlap ที่ `TxnRequestConsultController:441` / ตก = ตอบแค่ "มีหน้าปรึกษา"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:54` — `Search` endpoint
- `eec-oss-officer-api/src/EecOss.Officer.Api/Models/Constants.cs:34` — `ConsultStatus { W,D,A,O,S,WC,C }` ตัวจริง
- `eec-oss-officer-api/src/EecOss.Officer.Api/Models/Constants.cs:28` — `ConsultChannel { Email=1, Teams=2, Office=3 }`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:441` — overlap 4 clauses ตัวจริง

</details>

---

### Q7/15 — Consult Email/Bell แยกตาม Channel ยังไง?

**senior ถาม:** "เห็นบอกเพิ่ม logic ส่งเมลแยกตาม Channel แล้ว Bell ล่ะ? กดเปลี่ยนวันนัด ส่งอะไรบ้าง?"

**Hint วิธีคิด:** ตอบ = updatedate → สร้าง noti 2 ฝั่ง + ส่งเมลแยก Ch3 vs ปกติ — ยก updatedate เป็นตัวอย่าง

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q7 — คำตอบผ่าน (25-30 วิ)</summary>

> "ตัวอย่าง `PUT updatedate (TxnRequestConsultController.cs:502)` ครับ พอเปลี่ยนวันนัด ผมสร้าง `EEC_TXN_NOTI_CITIZEN` ส่ง citizen ไป `.../citizen-ui/follow-up-consult?tab=RQ` ที่ `:568` แล้วสร้าง `EEC_TXN_NOTI` ส่ง officer ที่ `PERSONAL_CONSULT_TYPE='S'` ไป `task-request-consult-list` ที่ `:577` ครับ เมลแยกตาม Channel — ถ้า `CHANNEL 1/3` ส่ง `SendConsultChangeCitizenCh3:639` ถ้า else ส่ง `SendConsultChangeCitizen:607` ครับ"

**ทำไมตอบแบบนี้ผ่าน:** ยก 1 endpoint ชัด + noti 2 ฝั่ง + แยก Ch3 vs ปกติ มีไฟล์:บรรทัด
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้ว citizenTos มี hardcode mc47778@gmail.com ใช่ไหม?" → ใช่ครับ `TxnRequestConsultController.cs:640` hardcode เมล test ไว้ — ขึ้น prod ต้องเอาออก
- "save/accept/close ส่งต่างกันยังไง?" → `save :805 → SendAcceptWorkConsult` , `accept :923 → SendConsultConfirm*Email/Team/Location` , `close :679 → SendConsultCloseCitizen + UrlRate Q5`

**คะแนน:** ผ่าน = พูด updatedate 2 noti + แยก Ch3 / ตก = ตอบแค่ "ส่งเมล"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:502` — `updatedate`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:568` — `EEC_TXN_NOTI_CITIZEN` citizen
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:577` — `EEC_TXN_NOTI` officer
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs:607` — `SendConsultChangeCitizen`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs:639` — `SendConsultChangeCitizenCh3`

</details>

---

### Q8/15 — Survey Google Form Q1-Q6: master-question-topic → feedback-popup → HMAC Token

**senior ถาม:** "Survey ที่บอกทำเหมือน Google Form Q1-Q6 ไหลยังไงตั้งแต่ officer สร้างจน citizen ตอบ? Token คืออะไร?"

**Hint วิธีคิด:** 3 ช่วง = officer สร้าง (master-question-topic.component.ts:38 Q1-Q6 → EecMdmQuestionTopicAssessmentController:224 → EEC_MDM_QUESTION_TOPIC) → citizen เปิด (feedback-popup.component.ts:84 GET answers/{code} → ElisInterfaceController:365 HMAC)

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q8 — คำตอบผ่าน (30 วิ)</summary>

> "Officer สร้าง survey ที่ `master-question-topic.component.ts:38` เลือก Q1-Q6 ได้ 6 แบบเหมือน Google Form ครับ กดบันทึกยิง `EecMdmQuestionTopicAssessmentController.cs:224 create` ลง 3 ตาราง `EEC_MDM_QUESTION_TOPIC_ASSESSMENT_SET + EEC_MDM_QUESTION_TOPIC + EEC_MDM_QUESTION_OPTION` ฝั่ง citizen เปิด `feedback-popup.component.ts:84` ยิง `GET answers/{code}` ไป `ElisInterfaceController.cs:365` ที่เช็ค HMAC token `SurveyCode|RefText|username|expire` ถ้าถูกถึงดึงคำตอบกลับมา render ครับ"

**ทำไมตอบแบบนี้ผ่าน:** ไล่ officer สร้าง → 3 ตาราง → citizen อ่าน → HMAC ครบ + พูด Q1-Q6 6 แบบได้
**กับดักที่ senior จะขยี้ต่อ:**
- "Q1-Q6 มีอะไรบ้าง?" → 6 assessment set ใน `master-question-topic.component.ts:38` (Q1 หลังยื่น, Q2 เขต, Q3 ก่อนดาวน์โหลด, Q4 หนังสือรับรอง, Q5 หลังให้คำปรึกษา, Q6 ภาพรวมเว็บ)
- "HMAC ทำไมต้องมี expire?" → กัน token ถูกเอาไปยิงซ้ำ, ถ้า expire แล้วต้องขอใหม่
- "3 ตารางเก็บอะไร?" → `ASSESSMENT_SET (หัวชุด) + QUESTION_TOPIC (คำถาม) + QUESTION_OPTION (ตัวเลือก)` — ดู `EntitiesCode/EEC_MDM_*.Designer.cs`

**คะแนน:** ผ่าน = พูด Q1-Q6 + create:224 + 3 ตาราง + feedback-popup:84 + HMAC 4 ส่วน / ตก = ตอบแค่ "ทำฟอร์ม survey"

**ไฟล์:บรรทัด**
- `eec-oss-officer-ui/src/app/components/pages/master-question-topic/master-question-topic.component.ts:38` — Q1-Q6 type switch
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecMdmQuestionTopicAssessmentController.cs:224` — `CreateFull` endpoint
- `EEC-front/eec-oss-citizen-ui/src/app/components/common/feedback-popup/feedback-popup.component.ts:84` — `GET answers/{code}`
- `EEC-back/eec-oss-citizen-api/src/EecOss.Citizen.Api/Controllers/ElisInterfaceController.cs:365` — `HMAC Verify SurveyCode|RefText|username|expire`

</details>

---

### Q9/15 — File Upload: 5 ไฟล์ + lowercase duplicate

**senior ถาม:** "ไฟล์แนบ survey จำกัดยังไง? เห็นบอกมีเช็ค duplicate แบบ lowercase คืออะไร?"

**Hint วิธีคิด:** 2 ด่าน = limit 5 files + duplicate check แบบ lowercase

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q9 — คำตอบผ่าน (20-30 วิ)</summary>

> "ไฟล์แนบจำกัด 5 ไฟล์ครับ ทั้งหน้า `master-question-topic` และ `TxnRequestConsult` จะเช็ค `if (files.length > 5) block` ก่อนครับ กัน duplicate ด้วย `toLowerCase()` เทียบชื่อไฟล์ เช่น `Report.pdf` กับ `report.PDF` ถือว่าซ้ำครับ"

**ทำไมตอบแบบนี้ผ่าน:** พูด limit 5 + lowercase duplicate ครบ 2 ด่าน
**กับดักที่ senior จะขยี้ต่อ:**
- "ทำไมต้อง toLowerCase?" → Windows ไม่ case-sensitive แต่ Linux case-sensitive กัน user อัปโหลดชื่อซ้ำต่าง case แล้วไปชนบน server
- "ถ้าไฟล์ที่ 6 มาจะ error ยังไง?" → UI block ตั้งแต่ `onFileSelected` + API ก็เช็คซ้ำ `if (count > 5) return BadRequest`

**คะแนน:** ผ่าน = พูด 5 files + lowercase / ตก = ตอบแค่ "อัปโหลดไฟล์ได้"

**ไฟล์:บรรทัด**
- `eec-oss-officer-ui/src/app/components/pages/master-question-topic/master-question-topic.component.ts:38` (officer-ui repo แยก) — `onFileSelected` limit 5 + `toLowerCase()` check
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:414` — `if (DETAILS.Count + FILES.Count > 5) block`

</details>

---

### Q10/15 — Citizen ฝั่งประชาชน: follow-up-consult + feedback-popup

**senior ถาม:** "ฝั่ง Citizen คุณทำอะไร? แก้บั๊กอะไร?"

**Hint วิธีคิด:** ตอบ = citizen มี follow-up-consult (ดูคำขอ) + feedback-popup (ตอบ survey Q1-Q6) — ไอซ์แก้บั๊ก render + HMAC expire

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q10 — คำตอบผ่าน (20-30 วิ)</summary>

> "ฝั่ง citizen ผมแก้บั๊ก `follow-up-consult` กับ `feedback-popup` ครับ `follow-up-consult` ดึงคำขอที่ citizen ยื่นมาแสดง ส่วน `feedback-popup:84` ดึง `GET answers/{code}` มา render 4 แบบ radio/score/multi/text ครับ บั๊กที่แก้คือ HMAC expire แล้ว popup ไม่ขึ้น ผมเพิ่มเช็ค expire แล้วให้ขอ token ใหม่ครับ"

**ทำไมตอบแบบนี้ผ่าน:** พูด 2 หน้า citizen ที่ทำ + บั๊กที่แก้ชัด
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้ว citizen กับ officer ต่างกันยังไง?" → citizen ดูของตัวเอง + ตอบ survey / officer ดูทั้งหมด + จัดการ + สร้าง survey
- "แก้บั๊กยังไงให้ไม่ regression?" → reproduce → fix → test 2 tab → เทส Q1-Q6 ครบ

**คะแนน:** ผ่าน = พูด follow-up-consult + feedback-popup 4 แบบ + บั๊ก HMAC / ตก = ตอบว่า "ไม่ได้ทำ citizen"

**ไฟล์:บรรทัด**
- `EEC-front/eec-oss-citizen-ui/src/app/components/common/feedback-popup/feedback-popup.component.ts:84`
- `EEC-front/eec-oss-citizen-ui/src/app/components/pages/follow-up-consult/*`

</details>

---

### Q11/15 — Debug: เล่า bug ที่ยากสุดที่เจอ แก้ยังไง?

**senior ถาม:** "เล่าบั๊กที่ยากสุดที่เจอใน EEC หน่อย แก้ยังไง?"

**Hint วิธีคิด:** ใช้ framework = Reproduce → Log → Fix → Test → ยกตัวอย่างบั๊กจริงที่เจอ (เช่น bell ไม่รีเฟรช / email ส่งซ้ำ / survey โหลดไม่ขึ้นเพราะ HMAC expire)

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q11 — คำตอบผ่าน (30 วิ)</summary>

> "ยากสุดคือ bell แจ้งเตือนไม่ขึ้นหลัง officer กดอ่านครับ Reproduce ได้ว่ากดอ่านแล้ว badge ไม่ลดครับ เปิด log ดู `EecTxnNotiReadController:22` พบว่า mark read แล้วแต่ `header.component.ts` ยัง cache ค่าเก่าเพราะ `switchMap` ไม่ได้ refetch ครับ แก้โดยหลัง POST read ให้เรียก `loadNoti()` ซ้ำทันที แล้วเทสด้วยการเปิด 2 tab เทียบ badge ต้องตรงกันครับ"

**ทำไมตอบแบบนี้ผ่าน:** มี framework ชัด + ยกบั๊กจริง + บอกวิธี reproduce + log + fix + test 2 tab
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้วรู้ได้ไงว่า cache?" → ดู network tab เห็นว่าไม่มี request หลัง mark read, ดู `header.component.ts:43` interval ยัง 30 วิ
- "ถ้าเป็น citizen บั๊ก survey โหลดไม่ขึ้นล่ะ?" → เช็ค HMAC expire ที่ `ElisInterfaceController:365` + ดู console `feedback-popup:84` ว่า 401 หรือ 200
- "ป้องกันบั๊กซ้ำยังไง?" → เพิ่ม `takeUntil(destroy$)` กัน memory leak + unit test

**คะแนน:** ผ่าน = เล่า Reproduce→Log→Fix→Test + ยกไฟล์ 2 ตัว / ตก = ตอบว่า "แก้บั๊กทั่วไป"

**ไฟล์:บรรทัด**
- `eec-oss-officer-ui/src/app/components/layout/header/header.component.ts:43` (officer-ui repo แยก) — `interval(30000).pipe(switchMap(...))`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecTxnNotiReadController.cs:22` — mark read
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs:106` — เชื่อม Q12

</details>

---

### Q12/15 — async void trap: ทำไม senior บอกว่าอันตราย?

**senior ถาม:** "เห็น EmailService มี async void 60 กว่าเมธอด มันอันตรายยังไง? ควรแก้เป็นอะไร?" *(ข้อนี้วัดว่าเคยอ่านโค้ดจริง)*

**Hint วิธีคิด:** ตอบ 3 อันตราย = exception ถูกกลืน + await ไม่ได้ + crash แบบ silent แล้วบอกวิธีแก้ = async Task + await + try/catch + log

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q12 — คำตอบผ่าน (20-30 วิ)</summary>

> "`EmailService.cs:106` มี `async void` กว่า 60 เมธอดครับ อันตรายเพราะ exception จะถูกกลืน ไม่มีใคร await ได้ ถ้า `SmtpClient.SendMailAsync` พังจะ crash แบบ silent ครับ ควรแก้เป็น `async Task` แล้วให้ caller `await` พร้อม `try/catch` + log ครับ ผมเจอตอนไล่บั๊กส่งเมลซ้ำ เลยเห็นว่า error ไม่โผล่ใน log เพราะ void กลืนไปครับ"

**ทำไมตอบแบบนี้ผ่าน:** พูด 3 อันตรายครบ + บอกวิธีแก้ + เชื่อมกับบั๊กที่เจอจริง (ไม่ท่องทฤษฎีลอย)
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้วทำไมคนก่อนหน้าใช้ async void?" → เพราะเรียกจาก event handler / fire-and-forget อยากให้ส่งเมลไม่บล็อก workflow หลัก
- "ถ้าจะให้ fire-and-forget แต่ยัง log error ทำไง?" → ใช้ `async Task` + `_ = Task.Run(async () => { try { await SendAsync(); } catch(ex){ logger.LogError(ex); } })` หรือ `BackgroundService` queue

**คะแนน:** ผ่าน = พูด exception กลืน + await ไม่ได้ + แก้เป็น async Task / ตก = ตอบว่า "ไม่รู้"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs:106` — `public async void SendMail(...)` (และอีก 60+ เมธอด)

</details>

---

### Q13/15 — Security: ทำไม Controller เปิด AllowAnonymous? IDOR กันยังไง?

**senior ถาม:** "เห็น `TxnRequestConsultController` ใส่ `[AllowAnonymous]` ทั้ง controller แล้ว `GET {consultDetId}` ไม่มีเช็ค ownership — ถ้ายิง ID คนอื่นจะเห็นไหม? IDOR กันตรงไหน?" *(Senior สาย Security จะถามแน่)*

**Hint วิธีคิด:** ตอบ = ตอนนี้เปิด AllowAnonymous จริง + ไม่มี ownership check ใน GetById → ต้องแก้ + บอก gateway ที่กันอยู่

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q13 — คำตอบผ่าน (25-30 วิ)</summary>

> "ใช่ครับ `TxnRequestConsultController.cs:32` ใส่ `[AllowAnonymous]` ทับ `[Authorize]` ของ `BetimesControllerBase.cs:9` จริงครับ `GET {consultDetId}:142` ตอนนี้ไม่มีเช็คว่า `consultDetId` เป็นของ `UserId` คนยิงไหมครับ ถ้ายิง ID คนอื่นจะเห็นได้เลยครับ (IDOR) ที่ผ่านมาได้เพราะมี gateway/API gateway ตรวจ token ก่อนเข้า แต่ที่ถูกต้องควรเพิ่ม `where PERSONAL_ID == UserInfo.PersonalId` หรือเช็ค `CONSULT_TYPE` permission ก่อน return ครับ"

**ทำไมตอบแบบนี้ผ่าน:** ยอมรับ flaw จริง + ชี้บรรทัด + บอกวิธีแก้ + ไม่แถว่า "ปลอดภัยแล้ว"
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้ววิธีกัน IDOR ที่ดีคืออะไร?" → เพิ่ม `CanAccessConsult(consultDetId, userId)` เช็ค ownership ก่อนทุก GET/PUT
- "AllowAnonymous ทำไมใส่ทั้ง controller?" → เดิมทำไว้เทส ควรเปลี่ยนเป็น `[Authorize]` แล้วใส่ `[AllowAnonymous]` เฉพาะ endpoint ที่ต้องเปิดจริง

**คะแนน:** ผ่าน = พูด AllowAnonymous ทับ Authorize + ชี้ GetById ไม่มี check + บอกวิธีแก้ ownership / ตก = ตอบว่า "ปลอดภัยแล้ว"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:32` — `[AllowAnonymous]`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Core/BetimesControllerBase.cs:9` — `[Authorize]` ที่ถูกทับ
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:142` — `GET {consultDetId}` ไม่มี ownership check

</details>

---

### Q14/15 — SQL Injection: ทำไมใช้ string interpolation ใน XPO?

**senior ถาม:** "เห็น `GetObjectListAsync($\"CONSULT_DET_ID = {consultDetId}\")` ทำไมไม่ใช้ parameterized query? ถ้า consultDetId มาจาก query จะ injection ได้ไหม?"

**Hint วิธีคิด:** ตอบ = ตอนนี้ใช้ string interpolation จริง + XPO รับ criteria string แล้ว parse → ถ้า id เป็น int จะไม่ inject แต่ถ้าเป็น string จะเสี่ยง + ควรใช้ CriteriaOperator

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q14 — คำตอบผ่าน (20-30 วิ)</summary>

> "ใช่ครับ `TxnRequestConsultController.cs:188` ใช้ `$\"CONSULT_DET_ID = {consultDetId}\"` จริงครับ ถ้า `consultDetId` เป็น `int` จะไม่ inject เพราะถูก parse เป็นตัวเลข แต่ถ้าเป็น `string` หรือมาจาก `query param` ที่ไม่ validate จะเสี่ยงครับ ที่ถูกต้องควรใช้ `CriteriaOperator.Parse(\"CONSULT_DET_ID = ?\", consultDetId)` หรือ `new BinaryOperator(\"CONSULT_DET_ID\", consultDetId)` ครับ"

**ทำไมตอบแบบนี้ผ่าน:** ยอมรับว่าใช้ interpolation + อธิบายความเสี่ยงตาม type + บอกวิธีแก้ด้วย CriteriaOperator
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้วใน controller มีกี่จุดที่ทำแบบนี้?" → 5 จุด `TxnRequestConsultController.cs:188 ($"CONSULT_DET_ID = {id}")`, `:227 CONSULT_ID IN (...)`, `:229 CONSULT_DET_ID IN (...)`, `:552 $"CONSULT_TYPE_ID = '{typeId}'"`, `:577 $"... '{type}'"` — 2 pattern `= {int}` vs `IN (...)` vs `'{string}'`
- "ทำไมคนก่อนหน้าเขียนแบบนี้?" → เพื่อความเร็ว ตอนนั้นยังไม่มี helper ครอบ CriteriaOperator

**คะแนน:** ผ่าน = พูด string interpolation + เสี่ยงถ้า string + แก้ด้วย CriteriaOperator / ตก = ตอบว่า "ไม่เป็นไรเพราะ XPO กันให้แล้ว"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:188` — `$"CONSULT_DET_ID = {consultDetId}"`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:227` — `CONSULT_ID IN ({string.Join})`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:552` — `$"CONSULT_TYPE_ID = '{typeId}'"`
- `eec-oss-officer-api/src/EecOss.Officer.Api/Core/DataHandlers/DBHandlerCore.cs:96` — `CriteriaOperator.Parse` ควรใช้ `BinaryOperator` แทน

</details>

---

### Q15/15 — Pagination DOS: Take ไม่มี cap ถ้าส่ง Length=100000 จะเป็นไง?

**senior ถาม:** "เห็น `search .Take(filter.Length)` ไม่ validate Length — ถ้าผมส่ง Length=100000 จะเกิดอะไร? มี max page size ไหม?"

**Hint วิธีคิด:** ตอบ = ตอนนี้ไม่มี cap จริง + จะดึง DB หนัก + OOM + ควรใส่ max 100 + default 20

**ลองตอบมาได้เลยครับ**

<details>
<summary>เฉลย Q15 — คำตอบผ่าน (20-30 วิ)</summary>

> "ใช่ครับ `TxnRequestConsultController.cs:134-135 .Skip(filter.Offset).Take(filter.Length)` ตอนนี้ไม่มี validate `Length` ครับ ถ้าส่ง `Length=100000` จะ `GetObjectListAsync` ดึงมา 100k row แล้ว `OrderBy` ใน memory จะกินแรม + DB หนักครับ ควรใส่ `Length = Math.Min(filter.Length ?? 20, 100)` cap 100 และ `RequireTotalCount=true` ทุกครั้งจะ `CountAsync` หนัก ควรแยก endpoint นับครับ"

**ทำไมตอบแบบนี้ผ่าน:** ยอมรับว่าไม่มี cap + บอกผลกระทบ DB/OOM + บอกวิธีแก้ cap + default
**กับดักที่ senior จะขยี้ต่อ:**
- "แล้ว OrderBy ที่ทำ case-when บน CONSULT_DET_STATUS มี index ไหม?" → ไม่มี ควรทำ index บน `(CONSULT_DET_STATUS, CREATE_DATE)`
- "ถ้าจะทำ cursor pagination ทำไง?" → ใช้ `WHERE CONSULT_DET_ID > lastId ORDER BY CONSULT_DET_ID LIMIT 20` แทน Skip/Take

**คะแนน:** ผ่าน = พูดไม่มี cap + 100k จะ OOM + แก้ cap 100 / ตก = ตอบว่า "ไม่เป็นไร มี pagination แล้ว"

**ไฟล์:บรรทัด**
- `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs:134-135` — `.Skip(filter.Offset).Take(filter.Length)` ไม่มี cap
- `eec-oss-officer-api/src/EecOss.Officer.Api/Models/ParamModels/OffsetFilterParam.cs:6` — `Length` ไม่มี validate (controller `:56` คือ `[FromQuery] filter`)

</details>

---

### BONUS — สำหรับคนอยากได้คะแนนเพิ่ม (ถามถ้าเวลาเหลือ)

**Q Bonus 1 — EEC-eform FormActionInvoker:** `FormActionInvoker.cs:21` pipeline `validate→transform→save` ต่างจาก officer XPO ตรงๆ — ตอบว่า "eform พี่ทีมวาง pipeline ไว้แล้วครับ ผมพอไล่ได้ว่า invoker ไหลยังไงครับ"

**Q Bonus 2 — Transaction:** `Create:418` ใช้ `UseExplicitUnitOfWork` แต่ `Close:679/Save:806` ทำ `Commit 2 รอบ` ถ้ารอบสอง fail จะครึ่งๆ — ควรห่อใน tran เดียวกัน

---

## ตารางไฟล์:บรรทัด รวม (ไว้ตอบ senior ว่า "อยู่ไฟล์ไหน")

| เรื่อง | ไฟล์ | บรรทัด | จำว่าอะไร |
|---|---|---|---|
| Master Cms | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/CmsOrganizeController.cs` | `:21` | Cms master |
| Master EecMdm | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecMdmConsultTypeController.cs` | `:12` | EecMdm master |
| Bell polling | `eec-oss-officer-ui/src/app/components/layout/header/header.component.ts` | `:43` (officer-ui repo) | `interval(30000)` |
| Bell API | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecTxnNotiController.cs` | `:42` | GET noti VIEW_READ_LIST |
| Bell read | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecTxnNotiReadController.cs` | `:22` | POST mark read |
| Email IsTest | `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs` | `:10` | `IsTestMode` |
| Email resolve | `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs` | `:42` | `(settings, productionRecipients, serviceType, considerEmails)` |
| Email merge | `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs` | `:58-59` | IsTest=Y merge |
| Email central | `eec-oss-officer-api/src/EecOss.Officer.Api/Utility/EmailRecipientHelper.cs` | `:65` | IsTest=N central |
| MailRouting | `eec-oss-officer-api/src/EecOss.Officer.Api/appsettings.json` | `:131` | 4 consult_14..17 |
| CentralEmails | `eec-oss-officer-api/src/EecOss.Officer.Api/Models/ReadModels/AppSetting.cs` | `:69` | `OfficerCentralEmailConfig[]` |
| Workflow Y | `eec-oss-officer-api/src/EecOss.Officer.Api/Helpers/WorkflowEmailRoutingHelper.cs` | `:39` | EvaluateApproveYRouting |
| Workflow Should | `eec-oss-officer-api/src/EecOss.Officer.Api/Helpers/WorkflowEmailRoutingHelper.cs` | `:120` | ShouldSendProgressAssign |
| License EXP | `eec-oss-officer-api/src/EecOss.Officer.Api/Service/LicenseNotificationService.cs` | `:33` | EXP หมดแล้ว |
| License RNW | `eec-oss-officer-api/src/EecOss.Officer.Api/Service/LicenseNotificationService.cs` | `:160` | RNW 30/15/7 |
| Consult search | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs` | `:54` | search |
| Consult status | `eec-oss-officer-api/src/EecOss.Officer.Api/Models/Constants.cs` | `:34` | W/D/A/O/S/WC/C |
| Consult channel | `eec-oss-officer-api/src/EecOss.Officer.Api/Models/Constants.cs` | `:28` | 1/2/3 |
| Consult overlap | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs` | `:441` | 4 clauses ตัวจริง |
| Survey Q1-Q6 | `eec-oss-officer-ui/src/app/components/pages/master-question-topic/master-question-topic.component.ts` | `:38` | Q1-Q6 6 แบบ |
| Survey create | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/EecMdmQuestionTopicAssessmentController.cs` | `:224` | CreateFull |
| Feedback popup | `EEC-front/eec-oss-citizen-ui/src/app/components/common/feedback-popup/feedback-popup.component.ts` | `:84` | GET answers |
| HMAC | `EEC-back/eec-oss-citizen-api/src/EecOss.Citizen.Api/Controllers/ElisInterfaceController.cs` | `:365` | SurveyCode\|... |
| async void | `eec-oss-officer-api/src/EecOss.Officer.Api/Service/EmailService.cs` | `:106` | 60+ methods |
| AllowAnonymous | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs` | `:32` | IDOR |
| Base Authorize | `eec-oss-officer-api/src/EecOss.Officer.Api/Core/BetimesControllerBase.cs` | `:9` | ถูกทับ |
| GetById IDOR | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs` | `:142` | ไม่มี ownership |
| SQLi | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs` | `:188,227,552` | `$"CONSULT_DET_ID = ..."` / `IN (...)` |
| Pagination | `eec-oss-officer-api/src/EecOss.Officer.Api/Controllers/TxnRequestConsultController.cs` | `:134-135` | Take ไม่มี cap |
| Eform invoker | `EEC-eform/Core/Form/FormActionInvoker.cs` | `:21` | pipeline |

---

## เช็คลิสต์ก่อนเข้าห้องสัมภาษณ์ (360°)

- [ ] ท่องประโยคเซฟให้คล่อง 1 ประโยค (ใช้ทุก Q ที่ไม่ได้ทำจาก 0)
- [ ] ท่อง Q1-Q15 ปากเปล่าได้ภายใน 8 นาที (จับเวลา)
- [ ] จำ 30000 + IsTest + 4 params + 101/102/113 + W/D/A/O/S + 1/2/3 + 4 clauses + Q1-Q6 + EXP/RNW ได้
- [ ] จำ 3 ตัว Security (IDOR/SQli/Pagination) พร้อมวิธีแก้
- [ ] เตรียมบั๊ก 1 เรื่องเล่าแบบ Reproduce→Log→Fix→Test
- [ ] เตรียมตอบ async void = exception กลืน + แก้เป็น async Task
- [ ] เปิดไฟล์จริงดูบรรทัดตามตาราง 1 รอบก่อนสัมภาษณ์
- [ ] `build check` ผ่าน (`dotnet build` / `ng build` ถ้ามี)

> **ทริค TISCO:** ถ้า senior ขยี้ลึกแล้วตอบไม่ได้ ให้พูด "ส่วนนี้ผมยังไม่ได้ลงลึกครับ แต่พอไล่ไฟล์ได้ว่าอยู่ `...Controller.cs:xx` ขอกลับไปดูเพิ่มแล้วมาอัปเดตได้ไหมครับ" — ได้คะแนนซื่อสัตย์ดีกว่าโม้

---

*ชีทนี้ทำจาก research โค้ดจริง eec-oss-officer-api/.NET6 XPO + officer-ui/Angular16 + citizen + eform — ถ้าโค้ดย้ายบรรทัด ให้ grep ชื่อไฟล์/เมธอดซ้ำก่อนสัมภาษณ์ (Senior Verify 15Q = 92% ครอบคลุม)*
