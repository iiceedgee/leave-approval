# CHEAT SHEET สัมภาษณ์ TISCO - Full Stack Developer
> สัมภาษณ์พรุ่งนี้ 28 ส.ค. 2026 | ฉบับไทย+อังกฤษ พร้อมเลขบรรทัดเปิดโค้ดได้ทันที
> CV ล็อคแล้ว ใช้วิธี Pivot ไม่แก้เอกสาร

---


## ส่วนที่ 1: GLOSSARY 27 คำ (ไทย+อังกฤษ อธิบายแบบคนทั่วไปเข้าใจ)

| # | ศัพท์ (อังกฤษ) | ไทย | อธิบายง่ายๆ | ตัวอย่างในโปรเจกต์คุณ |
|---|---|---|---|---|
| 1 | **Standalone Components** (สแตนด์อโลน) | คอมโพเนนท์ยืนเดี่ยว | สมัยก่อนต้องมี `NgModule` เป็นกล่องใหญ่ใส่ Component แบบ `app.module.ts` แบบใหม่ Component ยืนเดี่ยวได้ ไม่ต้องมีกล่อง โค้ดสั้นลง | CV เคลม Angular 19 Standalone แต่ `leave-approval/angular-ui/src/app/app.module.ts:1` ยังเป็น Module แบบเก่า ตอบว่า `ลอง Standalone บางจุดครับ` |
| 2 | **Signals** (ซิกแนล) | กล่องไฟกระพริบ | กล่องเก็บค่าที่พอค่าเปลี่ยน หน้าจอเปลี่ยนเอง `count = signal(0)` -> `count.set(1)` หน้าจออัพเดทเลย | ใหม่กว่า RxJS เขียนสั้นกว่า |
| 3 | **RxJS / Observable** (อาร์เอ็กซ์เจเอส) | ท่อน้ำ | ส่งข้อมูลเป็นสายน้ำ ต้อง `subscribe()` ถึงจะได้ข้อมูล ทำได้เยอะแต่โค้ดยาว ต้อง `unsubscribe` ไม่เช่นนั้น memory leak | `angular-ui/src/app/services/*.ts` ใช้ RxJS เป็นหลัก |
| 4 | **Boilerplate** (บอยเลอร์เพลท) | โค้ดซ้ำๆ | โค้ดที่ต้องเขียนซ้ำทุกครั้งเหมือนกรอกฟอร์ม 10 ช่อง Signals ช่วยลดเหลือ 2 ช่อง | - |
| 5 | **REST API** (เรสท์ เอพีไอ) | ประตูส่งข้อมูล | กฎเรียกข้อมูลผ่าน URL `GET /api/leave` ดึงข้อมูล, `POST /api/leave` สร้างใหม่ | `leave-api/src/routes/*.js` |
| 6 | **Role-Guarded / RBAC** (โรล การ์ด) | รปภ.ตรวจบัตร | ทุก API มีการ์ดตรวจ `authMiddleware` (login ยัง?) + `roleMiddleware('mgr')` (เป็นหัวหน้าไหม?) ที่ `approval.route.js:12`, `file.route.js:26` ถ้า `emp` ยิง `/approve` โดน `403 Forbidden` | `auth.service.js:16` บังคับ register เป็น `emp` เท่านั้น |
| 7 | **JWT (JSON Web Token)** (เจดับเบิลยูที) | บัตรผ่านชั่วคราว | บัตรที่มีอายุ 8 ชม. ที่ `app.js` เก็บใน `localStorage` ที่ `auth.service.ts:17` แล้วส่งผ่าน `jwt.interceptor.ts` ทุกครั้ง | ยังไม่มี `Refresh Token` (บัตรต่ออายุ) / `Revoke` (ยกเลิกบัตร) |
| 8 | **State Machine** (สเตท แมชชีน) | ผังสถานะ | ผังว่า `SU -> DC -> VC -> MA -> AP` ไปทางไหนได้บ้าง ห้ามกระโดดข้าม | `status.js:38-43` `FLOW` |
| 9 | **Gate / Guard** (เกท) | ประตูตรวจ | โค้ด `if (current_status !== 'MA') return error` ที่ `leave.service.js:70`, `document.service.js:14,38` กันยิง API ข้ามขั้นตอน | หัวใจที่ธนาคารชอบ |
| 10 | **Race Condition** (เรซ คอนดิชั่น) | แย่งกันกดพร้อมกัน | 2 หัวหน้ากด `อนุมัติ` ใบเดียวกันเวลา `09:00:00.001` อ่าน `MA` ทั้งคู่ ผ่าน Gate ทั้งคู่ เขียน `AP` 2 รอบ = เพี้ยน | โค้ดปัจจุบันยังเสี่ยง |
| 11 | **Transaction (Atomic)** (ทรานแซคชั่น) | กล่องห่อ | ห่อ `อ่าน->เช็ค->เขียน` เป็นกล่องเดียว คนอื่นแทรกไม่ได้ | ยังไม่มีที่ `leave.service.js:140-144` |
| 12 | **Row Lock (FOR UPDATE)** (โรว์ ล็อค) | ล็อคแถว | `SELECT ... FOR UPDATE` ล็อคแถวนั้นไว้ คนที่ 2 ต้องรอ คนที่ 1 เสร็จก่อนถึงอ่านได้ พออ่านใหม่เป็น `AP` แล้ว Gate จะ block | แก้ Race ได้ |
| 13 | **Mandatory Attachment** (บังคับแนบ) | บังคับแนบไฟล์ | ต้องอัปโหลดไฟล์ก่อนถึงเปลี่ยน `SU -> DC` | `file.route.js:61-70` |
| 14 | **Config** (คอนฟิก) | ค่าตั้งค่า | ไฟล์บอกว่า `leave_type` ไหนต้องแนบ | `leave-quota.js:1-7` + ที่จะเพิ่ม `leave-attachment.js` |
| 15 | **Leave Type** (ลีฟ ไทป์) | ประเภทการลา | `ลาป่วย 30 วัน, ลากิจ 15 วัน` ที่ `leave-quota.js` | - |
| 16 | **Audit Trail** (ออดิท เทรล) | สมุดบันทึก | บันทึกทุกการเปลี่ยน `ใคร ทำอะไร เมื่อไหร่` 3 ชั้น: `leave_status_history` + `document_verifications` + `audit-log.middleware.js` | `app.js:48,76` |
| 17 | **CORS** (คอร์ส) | กฎข้ามเว็บ | ป้องกันเว็บอื่นเรียก API เรา โค้ดคุณ `app.use(cors())` เปิดกว้าง ยังไม่ล็อค `origin` | จุดอ่อน |
| 18 | **Camunda BPM** (คามุนดา) | เครื่องจักร Workflow | ระบบรัน Workflow ของ EEC ที่ `http://192.168.38.6:8080/engine-rest` senior ออกแบบหลัก (ของ Betimes) ผมแค่ดึง Task มาแสดง | `CamundaService.cs:Engine-rest` |
| 19 | **ElisService + Token** (อีลิส) | ล้อโทเค็น | ยิงไป Elis ได้ token เอาไปเช็คว่าใครทำ Survey ประเมินความพึงพอใจแล้ว | งานที่คุณทำ |
| 20 | **PdfConverter Local / Report** (พีดีเอฟ คอนเวอร์เตอร์) | ปั้นรายงาน | สืบทอด `BetimesControllerBase` (framework บริษัท Betimes ให้มา) แต่ไส้ใน `GetRequestReportData()` ที่ `WebReportController.cs:503-1108` ปั้นตัวแปรเอง 1000 บรรทัด + แปลง PDF ด้วย `LibreOffice --headless` | `WebReportController.cs:503`, `PdfConverterService.cs:11` |
| 21 | **EF Core / DbContext** (อีเอฟ คอร์) | โครงกระดูก EF | `class` ธรรมดา `POCO` ไม่สืบอะไร + `DbContext` มี `DbSet<User>` + `SaveChanges()` + `dotnet ef migrations add` สร้างตาราง | PWA `.NET8 EF Core` ใช้แบบนี้ ต่างจาก EEC `XPO UnitOfWork` ที่ `eec-oss-officer-api/src/EecOss.Officer.Api/Core/BetinesUntiOfWork.cs:8` |
| 22 | **XPO / UnitOfWork** (เอ็กซ์พีโอ) | โครง Betimes | `class : XPObject/XPLiteObject` + `[Persistent]/[Key]` + `UnitOfWork/Session` + `CommitChanges()` + auto-create schema + gen `.Designer.cs` | EEC ใช้ `api-template/src/Template.Api/EntitiesCode/SampleItem.cs:XPObject` + `Core/BetinesUntiOfWork.cs:8` |
| 23 | **MediatR / CQRS** (มีเดียเตอร์) | แยกอ่าน/เขียน | แยก `Command` (เขียน `CreatePumpCommand`) กับ `Query` (อ่าน `GetPumpQuery`) ส่งผ่าน `IMediator.Send()` ไป `Handler` คนละตัว Testง่าย Scaleแยก | PWA `.NET8 MediatR CQRS` ใช้ `ทำความเข้าใจโปรเจ็ค.txt:15` |
| 24 | **Microservices / Docker** (ไมโครเซอร์วิส) | แยกตู้ | แยก service ละโมดูล `น้ำดิบ/ปั๊ม/มิเตอร์/คุณภาพน้ำ/ตารางเวร` รันคนละ container คุยผ่าน API Gateway | PWA 5 โมดูล Microservices vs Leave Monolith `leave-api/src/app.js:1` `Express` ตัวเดียว |
| 25 | **Keycloak SSO / OIDC** (คีย์โคลก) | ประตูกลาง | ล็อกอินที่เดียวได้ทุกแอป `https://uat-eecsso.eeco.or.th` ได้ `access_token + refresh_token` ไม่ต้องทำ JWT เอง | EEC `eec-oss-officer-api/Startup.cs:149 Authority` + `eec-oss-officer-ui/src/environments/environment.ts clientId 355168940386684843` |
| 26 | **Ant Design vs DevExtreme** (แอนท์) | ชุดเฟอร์นิเจอร์ | `Ant Design` เบา React เหมาะกับ Microservices แยกโมดูล / `DevExtreme DataGrid/Form` หนัก Angular เหมาะกับฟอร์มเยอะ 70+ FormIO `101-601` | PWA `React18 Vite AntD` vs EEC `devextreme 23.1.7` `eec-oss-officer-ui/src/app/app.module.ts DxDataGrid` |
| 27 | **XpoModelBinder / AutoMapper** (แมปเปอร์) | คนขนของ | แมป `Entity -> DTO` : XPO ใช้ `XpoModelBinder.cs:257` ผูกฟิลด์ฟอร์มอัตโนมัติ / EF ใช้ `AutoMapper` แมปเอง | `ทำความเข้าใจโปรเจ็ค.txt:48-50` + `eec-oss-officer-api/Core/XpoModelBinder.cs:257` |

---

## ส่วนที่ 2: STATE MACHINE 8 สถานะ (เปิดโค้ดตามบรรทัดได้ทันที)

### ตารางสถานะ (จาก `leave-api/src/constants/status.js:27-36` — อัปเดต 28 ส.ค. 2026)
| Code | ไทย | อังกฤษ | คำอธิบาย |
|---|---|---|---|
| SU | ยื่นคำขอ | Submitted | emp ยื่น -> รอแนบไฟล์ |
| DC | รอตรวจสอบเอกสาร | DocCheck | รอ pretemp เช็ค **ครบถ้วน** (รวม `VC` เดิม) |
| MA | รอหัวหน้าอนุมัติ | ManagerApproval | รอ mgr กด approve |
| AP | อนุมัติแล้ว | Approved | จบ |
| SB | ส่งกลับแก้ไข | SendBack | ตีกลับ -> SU (`SU+Y`) |
| CX | ยกเลิก | Cancelled | emp ยกเลิกเอง |
| RJ | ไม่อนุมัติ | Rejected | mgr/hr ไม่อนุมัติ |

> `VC` ถูกรวมเข้า `DC` ตั้งแต่ `59d458f hotfix dual F/SU` เพราะ Prod `violates check constraint current_status` — ตอนนี้ `4 ขั้น` ไม่ใช่ 5

### FLOW ที่อนุญาต (จาก `status.js:38-43` — ปัจจุบัน 4 ขั้น)
```
SU --แนบไฟล์--> DC --pretempPass--> MA --approve--> AP
|                |                    |
+CX              +SB->SU/RJ           +SB->SU/RJ
```
*   `SU -> DC` ต้องแนบไฟล์ที่ `file.route.js:61-70` : `if (current_status === 'SU' && role === 'emp') update to DC`
*   `DC -> MA` ที่ `document.service.js:11-18` : `pretempPass()` เช็ค `DC` เท่านั้น (เดิม `DC→VC` ตัดแล้ว)
*   `MA -> AP` ที่ `leave.service.js:80-86` : `approve()` เช็ค `MA` + `role==='mgr'` เท่านั้น
*   `SB ส่งกลับ` ที่ `leave.service.js:90-122` : ได้จาก `DC/MA` -> กลับ `SU` + `flag_send_back='Y'` + `send_back_count++`
*   `RJ ไม่อนุมัติ` ที่ `leave.service.js:126-143` : ได้จาก `DC/MA` (DC ได้ hr/mgr, MA ได้ mgr คนเดียว)
*   `CX ยกเลิก` ที่ `leave.service.js:146-153` : ได้จาก `SU` เท่านั้น

### Stepper 4 ขั้น Polymorphic ที่หน้าจอ (จาก `stepper.service.js:11-22` — อัปเดต `1369795`)
1. ยื่นคำขอ (SU) 2. ตรวจสอบเอกสาร (DC) 3. หัวหน้าอนุมัติ (MA) 4. เสร็จสิ้น/ไม่อนุมัติ/ยกเลิก (AP/RJ/CX สลับใน slot เดียวกัน)
*   `BASE_STEPS 3 + getFinalStep(AP:fa-circle-check เขียว / RJ:fa-circle-xmark แดง / CX:fa-ban เทา) seq4` — `AP 4 เขียว`, `RJ ที่ DC = done done pending rejected` ต่างจาก `RJ ที่ MA = done done done rejected` ดู `history` ที่ `getMaxReachedIndex:27`

---

## ส่วนที่ 3: Q&A 26 ข้อ (สคริปต์ตอบ ไทย+อังกฤษ + เลขบรรทัด + กับดัก)

### หมวด Loan - ฝึกงาน (ถามแน่เพราะอยู่ใน CV)

**Q1: เล่า Loan System หน่อยครับ?**
*   **โค้ด:** ไม่มี (ฝึกงาน)
*   **สคริปต์:** "ตอนฝึกงานที่ Force Smart ผมรับผิดชอบ Data Table + Search/Filter ดึงข้อมูลลูกค้ามาแสดงครับ ส่วน Workflow ภาพรวมพี่หัวหน้าอธิบายให้ฟังครับ แต่ระบบที่ผมออกแบบ State Machine เต็มๆ คือ Leave Approval 8 สถานะครับ ขออธิบายจาก Leave ได้ไหมครับ Concept เดียวกันครับ"
*   **ห้ามพูด:** "ออกแบบ Loan State Machine เองทั้งหมด"

**Q2: ตาราง Loan ทำ pagination/search ยังไง?**
*   **สคริปต์:** "ใช้ DevExtreme DataGrid ทำ filter/search ฝั่ง frontend ครับ ดึงข้อมูลมาแสดงเป็นตารางค้นหาได้ครับ"
*   **ห้ามพูด:** ลงลึกเรื่อง SQL ที่ไม่ได้ทำ

**Q3: ถ้าลูกค้ายื่นกู้ซ้ำพร้อมกัน กัน Race ยังไง?**
*   **สคริปต์:** "ตอนฝึกงานยังไม่ได้ทำถึงขั้นนั้นครับ แต่ใน Leave ผมเจอเคสคล้ายกัน 2 หัวหน้ากดอนุมัติพร้อมกัน ต้องใช้ Transaction + Row Lock `SELECT FOR UPDATE` ที่ `leave.service.js:140` ครับ"

### หมวด Leave - จุดแข็ง (ต้องตอบลึก)

**Q4: อธิบาย State Machine 7 สถานะหน่อย? (อัปเดต 4 ขั้น — VC รวมแล้ว)**
*   **โค้ด:** `status.js:27-36`, `leave.service.js:80`, `document.service.js:11`, `stepper.service.js:11`
*   **สคริปต์:** "`SU ยื่น -> แนบไฟล์เป็น DC ที่ file.route.js:61 -> pretemp เช็คครบเป็น MA ที่ document.service.js:11 -> หัวหน้าอนุมัติเป็น AP ที่ leave.service.js:80 ถ้าไม่ครบจะ SB กลับไป SU (DC/MA) ถ้าไม่ผ่านจะ RJ (DC/MA) ทุกการเปลี่ยนมี Gate เช็ค if (status !== 'MA') return error ครับ` *เดิม 5 ขั้นมี VC ตอนนี้รวมเข้า DC แล้วเหตุผล check constraint*"
*   **Gate แปลว่า:** ประตูตรวจ กันข้ามขั้นตอน

**Q5: ทำไมต้องบังคับแนบไฟล์? ถ้าลาป่วย 1 วันไม่ต้องแนบล่ะ? (ถามลึก - ใช้บทพูดที่คุณให้มา)**
*   **โค้ดปัจจุบัน:** `file.route.js:61-70` บังคับ `SU -> DC` ต้องอัปโหลด
*   **สคริปต์เต็ม:** "ดีไซน์ปัจจุบันผมบังคับแนบครับ ต้องอัปโหลดก่อนถึงเปลี่ยนจาก `SU (Submitted/ยื่นคำขอ)` เป็น `DC (DocCheck/รอตรวจสอบเอกสาร)` ที่ `file.route.js:61` ครับ แต่ถ้าธุรกิจอยากให้บางประเภทลาไม่ต้องแนบ เช่น ลาป่วย 1 วัน ผมจะเพิ่ม Config ว่า `leave_type` ไหนต้องแนบ/ไม่ต้องแนบ ที่ `leave-quota.js` แล้วแก้ Gate ให้ `SU` ไป `DC` ได้เลยโดยไม่ต้องมีไฟล์ครับ"
*   **ศัพท์:** Mandatory Attachment = บังคับแนบ, Config = ค่าตั้งค่า, Leave Type = ประเภทการลา

**Q6: RBAC กันยังไง? emp ยิง /approve ได้ไหม?**
*   **โค้ด:** `approval.route.js:12`, `file.route.js:26`, `auth.service.js:16`, `leave.service.js:35-53`
*   **สคริปต์:** "ผมทำ RBAC 3 Role ครับ `emp` เห็นของตัวเอง, `mgr` เห็นแผนกเดียวกันที่ `leave.service.js:47-52`, `hr` เห็นทั้งหมด ทุก API ผ่าน `authMiddleware` + `roleMiddleware('mgr')` ถ้า emp ยิง approve จะโดน 403 และ `register` บังคับเป็น emp เท่านั้นที่ `auth.service.js:16` กันสมัครเป็นหัวหน้าเองครับ"

**Q7: JWT เก็บไหน? โดน XSS ทำไง? Refresh มีไหม?**
*   **โค้ด:** `auth.service.ts:17`, `jwt.interceptor.ts`, `auth.guard.ts`
*   **สคริปต์:** "ตอนนี้เก็บใน `localStorage` แล้วส่งผ่าน `jwt.interceptor` ครับ อายุ 8 ชม. ยังไม่มี Refresh Token/Revoke ถ้าขึ้น Production จะย้ายไป `httpOnly cookie` + Refresh Token + Revoke List กัน XSS ครับ" (ยอมรับจุดอ่อนดีกว่าแถ)

**Q8: Audit Trail เก็บอะไร?**
*   **โค้ด:** `app.js:48,76`, `audit-log.middleware.js`, `leave.service.js:26,146`
*   **สคริปต์:** "เก็บ 3 ชั้นครับ `leave_status_history` บันทึกทุกเปลี่ยนสถานะ, `document_verifications` บันทึก pretemp/temp, และ `auditLogs` เก็บ `method/path/ip/user/time` ที่ `audit-log.middleware.js` ครับ"

**Q9: File upload กัน Path Traversal ยังไง?**
*   **โค้ด:** `upload.middleware.js`, `file.service.js`, `file.route.js:98`
*   **สคริปต์:** "ใช้ `multer` จำกัด 5 ไฟล์ 10MB whitelist `pdf/jpg/png/docx` ตั้งชื่อใหม่ด้วย `uuid` กันชื่อซ้ำ และเช็ค `fullPath.startsWith(UPLOAD_PATH)` ที่ `file.route.js:98` กัน Path Traversal ครับ"

**Q10: Race Condition คืออะไร? แก้ยังไง?**
*   **โค้ด:** `leave.service.js:67-71,140-144`
*   **สคริปต์:** "2 หัวหน้ากดอนุมัติพร้อมกัน อ่าน `MA` ทั้งคู่ ผ่าน Gate ทั้งคู่ เขียน `AP` 2 รอบครับ แก้ด้วย `Transaction` ห่อ อ่าน-เช็ค-เขียน เป็นกล่องเดียว + `Row Lock SELECT FOR UPDATE` ล็อคแถวไว้ คนที่ 2 ต้องรอครับ ตอนนี้โค้ดยังไม่มี ถ้าทำธนาคารจะเพิ่มครับ"

### หมวด EEC - Master/Elis/Survey/Report (ห้ามโม้ Camunda)

**Q11: EEC ใช้ Camunda ยังไง? ออกแบบ BPM ยังไง?**
*   **โค้ด:** `eec-oss-officer-api/src/EecOss.Officer.Api/Services/CamundaService.cs` -> `http://192.168.38.6:8080/engine-rest` , `Controllers/WebReportController.cs:51 : BetimesControllerBase`
*   **สคริปต์:** "Camunda senior ออกแบบหลักครับ (Betimes ให้ framework มา) ผมสืบทอด `BetimesControllerBase` ที่ `BetimesControllerBase.cs:12` ไม่ได้สร้าง Base เอง ผมใช้งานผ่าน `CamundaService` ดึง Task มาแสดงที่ `my-task/my-task-v2` และทำ Master Data ที่ feed ให้ BPM ครับ" **ห้ามพูดว่าออกแบบเอง / สร้าง Betimes Base เอง**

**Q12: ElisService ล้อ Token ทำ Survey ยังไง?**
*   **สคริปต์:** "ผมทำ ElisService ยิงไป Elis ได้ Token แล้วเอาไปเช็คว่าใครทำ Survey ประเมินความพึงพอใจแล้วบ้างครับ"

**Q13: Master Data ทำอะไร?**
*   **โค้ด:** `eec-oss-officer-ui/src/app/components/pages` (965 ไฟล์)
*   **สคริปต์:** "ดูแล Master `SLA, Holiday, Consult Type/Topic, Work Schedule` ที่เป็น config ให้ 70+ ฟอร์ม `FormIO 101-601` ครับ"

**Q14: Report ปั้นตัวแปรยังไง? ส่งเมลทำยังไง? [ลูกผสม Betimes + คุณ]**
*   **โค้ด:** `Controllers/WebReportController.cs:51 : BetimesControllerBase` (framework บริษัท Betimes ให้มา ดู `Core/BetinesOracleConnectionProvider.cs:8`, `Core/BetinesUntiOfWork.cs:8`) , `WebReportController.cs:503-1108 GetRequestReportData()` (คุณทำ) , `Service/PdfConverterService.cs:11` (คุณทำ), `ReportRequestPDF:191` / `ReportCommitPDF:310` เรียก `PdfConverterService.PdfConverter()`
*   **สคริปต์:** "โครง `WebReportController` สืบทอด `BetimesControllerBase` ที่บริษัท Betimes ให้มาครับ ผมไม่ได้สร้าง Base เอง แต่ไส้ใน `GetRequestReportData()` ที่ `WebReportController.cs:503` ผมปั้นตัวแปรเอง 1000 บรรทัด เช่น `PERSON_NAME`, `ADDRESS_1/2`, `CERT_DISPLAY` ที่ `WebReportController.cs:649-1108` แล้วแปลง `Docx -> PDF` ด้วย `PdfConverterService` (`LibreOffice --headless` ที่ `PdfConverterService.cs:102`) ที่เรียกใน `WebReportController.cs:191,310` ครับ ส่วน `MailMergeService.cs` ไม่ได้ใช้ใน WebReport, `NotificationService.cs:109` แค่เขียนไฟล์ `noti-{guid}.json` เป็น job ให้ batch อ่านต่อ ไม่ได้ยิงเมลจริงครับ"
*   **ห้ามพูด:** "สร้าง BetimesControllerBase เอง" / "ใช้ MailMergeService ใน WebReport"

**Q15: Officer UI 965 ไฟล์ จัดการยังไง?**
*   **สคริปต์:** "ใช้ Angular 16 + DevExtreme DataGrid + `privilege-guard/auth-guard` + OAuth2 OIDC ต่อ `EEC SSO https://uat-eecsso.eeco.or.th` ครับ"

### หมวด Full Stack ทั่วไป

**Q16: Angular Standalone vs Module?**
*   **สคริปต์:** "Module ต้องมีกล่อง `NgModule` ใส่ Component Standalone ไม่ต้องมีกล่อง Component ยืนเดี่ยวได้ โค้ดสั้นลงครับ"

**Q17: REST API ออกแบบยังไง?**
*   **โค้ด:** `approval.route.js:12-16`, `leave.service.js:140`
*   **สคริปต์:** "REST แบบ `role-guarded` ทุก route ผ่าน `authMiddleware` และ `handleResult()` return `{error}` -> `400/404` ครับ"

**Q18: PostgreSQL vs Supabase?**
*   **โค้ด:** `app.js:46`, `supabase-store.js` vs `store.js`, `leave-quota.js`
*   **สคริปต์:** "Supabase คือ Postgres + Auth/Storage ครับ ผมใช้ Strategy Pattern `supabaseClient ? SupabaseStore : InMemoryStore` ที่ `app.js:46` มี fallback ครับ"

**Q19: Docker/CI ทำอะไร?**
*   **โค้ด:** `.github/workflows/ci.yml`, `Dockerfile`
*   **สคริปต์:** "Docker build Angular + Express และ CI ด้วย GitHub Actions build + artifact ครับ"

**Q20: Security CORS/Helmet/Rate Limit?**
*   **โค้ด:** `app.js` `app.use(cors())`
*   **สคริปต์:** "ตอนนี้ `CORS` เปิดกว้าง ยังไม่มี `Helmet/Rate Limit` ถ้าทำธนาคารจะเพิ่ม `helmet`, `express-rate-limit`, `joi/zod` validate และย้าย JWT ไป `httpOnly cookie` ครับ" (ยอมรับแล้วเสนอแก้)

**Q21: Deploy Angular ขึ้น Vercel แล้ว `/api` ยิงไม่ถึง `proxy.conf.json` ใช้บน Production ได้ไหม?**
*   **โค้ด:** `leave.service.ts:12` `auth.service.ts:14` hardcode `'/api/leave'` 23 จุด + `proxy.conf.json:2` `target: localhost:3000` ใช้ได้แค่ `ng serve` (`package.json:6`) + `app-routing.module.ts:18` refresh `/dashboard` จะ `404` ถ้าไม่มี `rewrites`
*   **ปัญหา (ภาษาพูด):** "ตอน dev ผมใช้ `proxy.conf.json:2` ส่ง `/api` ไป `localhost:3000` ครับ ใช้ได้แค่ `ng serve` พอขึ้น `Vercel` มันไม่ทำงานเพราะ `Vercel` เป็น `static hosting` ไม่มี `dev-server` แล้ว `leave.service.ts:12` hardcode `'/api'` ทั้ง 23 จุดก็ยิงตัวเอง No backend ครับ"
*   **วิธีแก้ (ภาษาพูด):** "ผมสร้าง `environment.ts: apiUrl='/api'` กับ `environment.prod.ts: apiUrl='https://leave-api.vercel.app/api'` แล้วแก้ `leave.service.ts:12` จาก `'/api/leave'` เป็น `` `${environment.apiUrl}/leave` `` ครับ แล้วเพิ่ม `vercel.json` ใส่ `rewrites: /api/* → https://api-xxx.vercel.app/api/*` กับ `/(.*) → /index.html` กัน refresh `dashboard` ที่ `app-routing.module.ts:18` แล้ว `404` เพราะเป็น `SPA` ครับ"
*   **ศัพท์:** `Proxy (พร็อกซี่)=ตัวกลางส่งต่อ`, `Environment (เอ็นไวรอนเมนท์)=ค่าแยก dev/prod`, `Rewrites=กฎส่งต่อ`, `SPA Fallback=/(.*)->/index.html กัน 404`
*   **ห้ามพูด:** "`proxy.conf.json` ใช้บน Production ได้" / "`hardcode /api` ดีแล้ว"

**Q22: อัพไฟล์บน Vercel ทำไมหาย `diskStorage` ใช้ได้ไหม?**
*   **โค้ด:** `upload.middleware.js:7` `diskStorage` + `:11 mkdirSync` + `file.service.js:38 fs.unlinkSync` + `file.route.js:102 res.download` + `app.js:52 static('/uploads')` + `app.js:92 app.listen` — `Vercel` ดิสก์ `read-only` ยกเว้น `/tmp` แล้วหายเมื่อ `cold start`
*   **ปัญหา (ภาษาพูด):** "ตอนนี้ผมใช้ `diskStorage:7` เขียนลง `uploads/:id` ด้วย `mkdirSync:11` แล้ว `res.download:102` ครับ รัน `local` ได้ แต่บน `Vercel` ดิสก์เป็น `read-only` เขียนได้แค่ `/tmp` แล้วไฟล์หายเมื่อ `cold start` ครับ กดอัพที่ `file.route.js:27` จะ `EROFS` ตั้งแต่ยังไม่ดูไฟล์ `SU->DC` ก็ไปไม่ได้ `flow` ขาดครับ"
*   **วิธีแก้ (ภาษาพูด):** "ผมเช็ค `if(process.env.VERCEL)` ให้ใช้ `memoryStorage` แล้วอัพต่อเข้า `Supabase Storage bucket: leave-documents` ที่ผมมี `SupabaseStore app.js:46` อยู่แล้วครับ จาก `file.service.js:19 file_path` จะเก็บเป็น `storageUrl` แล้วตอนโหลดใช้ `createSignedUrl()` แทน `res.download:102` ส่วน `app.js:92` ก็แก้เป็น `if(!VERCEL) app.listen()` แล้ว `module.exports=app` ให้ `Vercel` เรียกครับ สร้าง `bucket` 3 คลิก `Storage → New bucket → leave-documents Private` ครั้งเดียวจบครับ"
*   **ศัพท์:** `Ephemeral (อีเฟมเมอรัล)=ชั่วคราวหาย`, `Memory Storage=เก็บใน RAM`, `Object Storage=ที่เก็บถาวร`, `Signed URL=ลิงก์ชั่วคราว`, `Serverless=ต้อง export ไม่ต้อง listen`
*   **ห้ามพูด:** "`Vercel` เก็บดิสก์ถาวรได้" / "เพิ่ม `UPLOAD_PATH=/tmp` แล้วจบ"

### หมวด ประปา PWA OCS + ภาพรวม EEC (เพิ่มคืนนี้ - สิ่งที่คุณทำจริง)

**Q23: ภาพรวม 2 โปรเจ็ค EEC + ประปา ต่างกันยังไง? คุณทำอะไร?**
*   **โค้ด:** `eec-oss-officer-api/src/EecOss.Officer.Api` (109 controllers) + `ทำความเข้าใจโปรเจ็ค.txt:5-18`
*   **สคริปต์:** "EEC ศูนย์บริการเบ็ดเสร็จ Officer `Stack .NET6 XPO + Angular16 DevExtreme + Camunda BPM + SQL/Oracle/Mongo/Redis` ทำ `MyTask/workflow + RBAC + SSO Keycloak + ตรวจสอบเอกสาร + รายงาน` ที่ `eec-oss-officer-api` มี 109 controllers ผมทำ `Master SLA/Holiday/Consult Type-Topic/Work Schedule` feed 70+ ฟอร์ม `FormIO 101-601` + `ElisService` ล้อ Token เช็ค Survey + ไส้ใน Report `WebReportController.cs:503` 1000 บรรทัดครับ / ประปา PWA OCS งานแรก 6 เดือน `Stack .NET8 EF Core + MediatR CQRS + SQL Server + JWT/Keycloak + React18 Vite AntD + Docker` แยก 5 โมดูล `น้ำดิบ/ปั๊ม/มิเตอร์/คุณภาพน้ำ/ตารางเวร` ที่ `ทำความเข้าใจโปรเจ็ค.txt:18` ครับ / ส่วน Leave 8 สถานะ `status.js:27` ผมทำเองทั้งระบบครับ"
*   **ห้ามพูด:** "ออกแบบ Camunda/Betines เอง" — ต้องพูด "สืบทอด `BetimesControllerBase.cs:12` framework Betimes ให้มา"

**Q24: EF Core vs XPO ต่างกันยังไง? ทำไม EEC ใช้ XPO แต่ประปาใช้ EF Core?**
*   **โค้ด:** `api-template/src/Template.Api/EntitiesCode/SampleItem.cs:XPObject + [Persistent]` vs POCO, `eec-oss-officer-api/Core/BetinesUntiOfWork.cs:8 : UnitOfWork` vs `DbContext`, `eec-oss-officer-api/Startup.cs:52 Register Oracle/Postgres` vs `AddDbContext`
*   **สคริปต์ท่องตาราง 7 ข้อ `ทำความเข้าใจโปรเจ็ค.txt:21-53`:** "1 Entity `EF: POCO ไม่สืบอะไร` vs `XPO: XPObject + [Persistent]/[Key]` 2 Context `EF: DbContext` vs `XPO: UnitOfWork/Session` 3 Query `EF: LINQ ToListAsync` vs `XPO: Query<T>() + CriteriaOperator` 4 Save `EF: SaveChanges()` vs `XPO: CommitChanges()` 5 สร้างตาราง `EF: dotnet ef migrations add` vs `XPO: auto-create + .Designer.cs` 6 หลาย DB `EF: ลง provider` vs `XPO: native Oracle+SQL+Mongo` 7 ผูกฟอร์ม `EF: AutoMapper` vs `XPO: XpoModelBinder.cs:257` ครับ สรุป `EF Core = มาตรฐาน .NET8 สมัยใหม่ (ประปา)` `XPO = ต่อหลาย DB + ผูกฟอร์ม (EEC)` เลยเลือกต่างกันครับ"
*   **กับดัก:** ถ้าถาม Migrations → ตอบ `dotnet ef migrations add Initial` → `dotnet ef database update`

**Q25: CQRS MediatR ในประปา คืออะไร? เทียบกับ Leave ตอนนี้?**
*   **โค้ด:** `leave.service.js:67 approve()` รวมอ่าน-เช็ค-เขียน ใน service เดียว vs `IMediator.Send(new CreatePumpCommand()) -> Handler`
*   **สคริปต์:** "PWA ใช้ `CQRS` แยก `Command` เขียน เช่น `CreatePumpCommand {PumpName, Location}` ไป `CreatePumpHandler` กับ `Query` อ่าน เช่น `GetPumpListQuery -> GetPumpListHandler` ส่งผ่าน `IMediator.Send()` คนละตัวครับ แยกอ่าน/เขียน Test ง่าย Scale แยกกันครับ ส่วน Leave ตอนนี้ `leave.service.js:67 approve()` รวม `getLeaveById -> if(status!==MA) return error -> transition(AP)` ใน service เดียว ถ้าเป็น CQRS จะแยกเป็น `ApproveLeaveCommand` กับ `GetLeavesQuery` แบบ PWA ครับ"
*   **ห้ามพูด:** "Leave ใช้ MediatR แล้ว" / "PWA ใช้ XPO"

**Q26: SSO ต่างกันยังไง? Leave JWT vs EEC/PWA Keycloak?**
*   **โค้ด:** `leave-api/src/services/auth.service.js jwt.sign 8h` + `auth.service.ts:17 localStorage` + `eec-oss-officer-api/Startup.cs:149 Authority=https://uat-eecsso.eeco.or.th` + `eec-oss-officer-ui/src/environments/environment.ts clientId 355168940386684843` + `AuthController.cs ExchangeToken -> oauth/v2/token`
*   **สคริปต์:** "Leave ทำ JWT เอง `jwt.sign 8h` เก็บ `localStorage` ส่งผ่าน `jwt.interceptor.ts` ครับ ง่ายแต่ยังไม่มี `Refresh/Revoke` ยอมรับจุดอ่อนที่ `CHEAT_SHEET:Q7` ครับ ส่วน EEC/PWA ใช้ `Keycloak OIDC` ต่อ `https://uat-eecsso.eeco.or.th` ที่ `Startup.cs:149 Authority` `MetadataAddress=/.well-known/openid-configuration` ฝั่ง UI ใช้ `angular-oauth2-oidc` `environment.ts clientId 355...` ได้ `access_token + refresh_token + offline_access` ไม่ต้องเก็บ `localStorage` ครับ `AuthController.cs ExchangeToken` ยิง `POST oauth/v2/token` ด้วย `Basic base64(clientId:secret)` ครับ"
*   **ศัพท์:** `OIDC=OpenID Connect` ต่อยอด OAuth2, `Refresh Token=บัตรต่ออายุ`

---

## เสริม 4 เรื่องใหม่ Q27-Q30 (อัปเดตล่าสุด 28 ส.ค. 2026 — ไม่มั่ว ตรงโค้ดที่เพิ่งแก้)

**Q27: Stepper ทำไม 4 ขั้นไม่ใช่ 5? Polymorphic ยังไง? [ถามแน่ — Cheat เดิมผิด]**
*   **โค้ด:** `stepper.service.js:11,17,27,58` `status.js:27` `leave.service.js:80`
*   **สคริปต์:** "เดิม 5 ขั้น `SU DC VC MA AP` มี `VC` แยก ตอนนี้ 4 ขั้น `SU(1) DC(2) MA(3) + Final สลับ AP/RJ/CX (4)` ที่ `BASE_STEPS 3 + getFinalStep` สาเหตุ `59d458f` Prod `violates check constraint current_status` `F` vs `SU` เลยรวม `VC` เข้า `DC` ครับ ขั้น 4 เป็น `polymorphic` `AP:fa-circle-check เขียว เสร็จสิ้น / RJ:fa-circle-xmark แดง ไม่อนุมัติ / CX:fa-ban เทา ยกเลิก` `seq4` slot เดียวกัน ไม่ใช่ต่อท้าย 5 ขั้นครับ ที่สำคัญ `RJ` ไม่แดง 3 ขั้นแล้ว — ดู `history` ที่ `getMaxReachedIndex:27` ว่าไปถึงไหนแล้วจึง `done` แค่ที่เคยผ่าน: `RJ ที่ DC = done done pending rejected` ต่างจาก `RJ ที่ MA = done done done rejected` ต่างกันเห็นว่า reject ตรงไหนครับ `timeline` ก็ `RJ→rejected CX→cancelled` ที่ `buildHistoryTimeline:109` `timeline.component.scss:15` dot แดงครับ"
*   **ห้ามพูด:** "5 ขั้น VC แยก" / "RJ แดง 3 ขั้น"

**Q28: แจ้งเตือน Bell ทำไม emp เห็นแดงมั่ว SB ไม่แดง? [เพิ่งแก้ Phase A]**
*   **โค้ด:** `notification-bell.ts:89,33,124,43` `leave-detail.ts:43` `environment.prod.ts:17`
*   **สคริปต์:** "Bell ไม่ใช่ table จริงครับ — poll `GET /api/leave` 15s (`interval 15000`) เดิม `NEED_CHECK=['DC','MA'] ทุก role` ผิด `emp` เห็นแดงทั้งที่ทำไม่ได้ `SB` (`SU+Y` หลังส่งกลับ) ไม่แดงเลย ตอนนี้ `isNeedsCheck(role)` ตาม role `emp: SU+Y (ต้องแก้) / mgr: DC|MA / hr: DC` + `readKey=id:status` กัน `DC→MA` เปลี่ยนแล้วถือว่าอ่านค้าง + `localStorage notif_read_ids` refresh ไม่หาย + `sort updated_at slice 10` กันบวม 1000 แถว + `paramMap.subscribe` ไม่ใช่ `snapshot` กดจาก detail ใบเก่าไปใบใหม่เปลี่ยนจริง + `fetchNotifications()` hook ไว้ Phase B สลับไป `notificationService.getUnread()` ได้ทันทีครับ `z-index 1999` ไม่บัง `toast 2000` แล้วครับ"
*   **ศัพท์:** `Poll=วนถาม`, `Phase B=table notifications + Realtime`

**Q29: RLS vs RBAC ต่างกันยังไง? ตอนนี้เปิดไหม?**
*   **โค้ด:** `auth.middleware:19 + roleMiddleware('mgr') approval.route:12` `sql/schema.sql:91 GRANT` `SUPABASE_SETUP_HANDBOOK.md:Ch.3` `supabase.js:32`
*   **สคริปต์:** "RBAC ที่ `Express` `authMiddleware` + `roleMiddleware('mgr')` กันหน้า API `emp ยิง /approve 403` `leave.service:47` `mgr=department hr=all` ส่วน RLS ที่ `Postgres` `ENABLE RLS + POLICY USING (user_id=current_user_id())` `current_user_id()=auth.jwt()->>'id'` `GRANT anon/service_role` ตอนนี้ `RLS ปิด` ใช้ `sb_secret` ข้ามได้ — Demo พอ Prod ค่อยเปิด `defense-in-depth` ครับ ถาม `JWT_SECRET` ต้อง sync `Supabase Dashboard→API→JWT` ไม่งั้น `auth.jwt()` ได้ null บล็อคหมดครับ"
*   **ห้ามพูด:** "RLS เปิดแล้ว" (ยังปิด)

**Q30: เปิดหน้าแล้วขาว `กำลังโหลด...` ค้าง ทำไง? [บัคที่เพิ่งแก้]**
*   **โค้ด:** `leave-detail.ts:65,88` `error.interceptor:26` `auth.service:53`
*   **สคริปต์:** "HR เปิด `DC→MA` ขาวเพราะ `nested forkJoin` ไม่มี `catchError` `loading=true` ค้าง `*ngIf=!loading && leave` ไม่โชว์ แก้ `switchMap→forkJoin({steps: getStepper+catchError→[], items: getHistory+catchError})+finalize loading=false` เดียว + `silentUrls stepper/history 404` ไม่ toast + `base64url` Thai `isLoggedIn` `auth.service:53` เคย `atob` พัง `hr01 token 222` `AuthGuard` บล็อคแม้ `200` + `F/SU` drift `store.js:87` `violates check constraint` ด้วย `dual fallback` ครับ"

### ภาพรวมหน้าเว็บ (Site Map — ท่อง 1 นาที)

```
Login(public) → Dashboard(AuthGuard, title ตาม role emp:ของฉัน / mgr:รอฉันตรวจ / hr:ทั้งหมด)
  ├─ emp: [ยื่นคำขอลา] → /leave/new (RoleGuard emp)  [ประวัติการลา] → /my-leaves/history
  └─ ทุก role: ตาราง DxDataGrid 10/20/50 → [ดูรายละเอียด] → /leave/:id (detail, all, canDoPretemp DC hr|mgr / canApprove MA mgr / SB→SU resubmit / CX/RJ terminal)
        ↳ Stepper 4 ขั้น SU DC MA + Final สลับ AP เขียว / RJ แดง / CX เทา + Timeline modal + UploadZone(5 ไฟล์ 10MB pdf/jpg/png/docx) + Bell(15s) + Toast(4s)
```
*   **Routes:** `app-routing.module.ts:12` 6 เส้น `''→/login **→/login` + `app.module.ts:17` 6 shared `Stepper Timeline Bell UploadZone StatusBadge Toast` + `JwtInterceptor` + `ErrorInterceptor`
*   **API:** `environment.ts:13 /api (proxy localhost:3000) vs prod https://leave-approval-api.vercel.app/api`
*   **สี:** `SUเทา DCฟ้า MAเหลือง APเขียว RJ/CXแดง` `STATUS 7 รหัส SU/DC/MA/AP/SB/CX/RJ VC รวมแล้ว` `status.ts:27 FLOW SU[DC,CX] DC[MA,SU,RJ] MA[AP,SB,RJ]`

---

## ส่วนที่ 4: สคริปต์ Pivot 4 โปรเจกต์ (ท่อง 30 วิ)

**Loan -> Leave:** "Loan ฝึกงานทำตาราง+ค้นหาครับ เรียนรู้ Workflow จากพี่เลี้ยง แต่ Leave ผมออกแบบ 8 สถานะเองครับ ขออธิบาย Leave ได้ไหมครับ Concept เดียวกันครับ"

**EEC Camunda/Betimes:** "โครง EEC สืบทอด `BetimesControllerBase` ที่บริษัท Betimes ให้มาครับ ผมไม่ได้สร้าง Base/Camunda เอง ผมทำ `Master SLA/Holiday/Consult` + `ElisService ล้อ Token->Survey` + ไส้ใน Report `WebReportController.cs:503` ปั้นตัวแปร 1000 บรรทัดครับ"

**ประปา PWA -> Leave:** "PWA ประปา งานแรก 6 เดือน `Stack .NET8 EF Core MediatR CQRS + React AntD` 5 โมดูล `น้ำดิบ/ปั๊ม/มิเตอร์/คุณภาพน้ำ/ตารางเวร` ครับ Logic State Machine เต็มๆ ให้ดู Leave 8 สถานะ `status.js:27` ครับ"

**AI ช่วย Leave:** "Leave Approval ที่ `github.com/iiceedgee/leave-approval` ผมทำเองทั้งหมดครับ commit `d0bceca` ใช้ AI ช่วยร่างโครง แต่ Logic State Machine/RBAC/File Stage ผมออกแบบเอง อธิบายได้ทุกบรรทัดที่ `leave.service.js:67`, `file.route.js:61` ครับ"

---

## ส่วนที่ 5: CHECKLIST คืนนี้

- [ ] ท่อง 8 สถานะ + Gate ให้คล่อง (`status.js:27-43`)
- [ ] ท่องสคริปต์บังคับแนบ -> Config (Q5 `file.route.js:61` -> `leave-quota.js`)
- [ ] ท่อง Race + Transaction + Row Lock (`leave.service.js:140`)
- [ ] ท่อง PWA 5 โมดูล + EF vs XPO 7 ข้อ (`ทำความเข้าใจโปรเจ็ค.txt:21-53` / Q24)
- [ ] ท่อง CQRS Command vs Query + Keycloak vs JWT (Q25-Q26)
- [ ] ท่อง Pivot 4 โปรเจ็ค 30 วิ (Loan->Leave / EEC / PWA->Leave)
- [ ] เตรียมรัน `leave-approval` ให้เปิดดูได้ (`npm run dev` + `ng serve`)
- [ ] เตรียมพูด EEC แค่ Master/Elis/Survey/Report (ห้ามโม้ Camunda/Betines `BetimesControllerBase.cs:12`)

> เปิดโค้ดตามเลขบรรทัดได้ทันที: `status.js:27`, `file.route.js:61`, `document.service.js:11,35`, `leave.service.js:67,75,98,106` | **หมายเหตุ EEC:** `BetimesControllerBase.cs:12`, `BetimesOracleConnectionProvider.cs:8`, `BetimesUntiOfWork.cs:8` เป็น framework บริษัท Betimes ให้มา

**ยืนยัน Leave ทำเอง:** `git log d0bceca by ข้าวเหนียวหมูปิ้ง <mc47779@gmail.com>` ที่ `github.com/iiceedgee/leave-approval` Stack `Express+Angular19+Supabase` คนละตัวกับ Betimes `C# + Camunda`

**โชคดีครับ TISCO ชอบคนซื่อสัตย์ + อธิบาย Gate ได้ = ผ่าน!**
