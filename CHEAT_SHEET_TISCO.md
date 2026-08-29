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


> เปิดโค้ดตามเลขบรรทัดได้ทันที: `status.js:27`, `file.route.js:61`, `document.service.js:11,35`, `leave.service.js:67,75,98,106` | **หมายเหตุ EEC:** `BetimesControllerBase.cs:12`, `BetimesOracleConnectionProvider.cs:8`, `BetimesUntiOfWork.cs:8` เป็น framework บริษัท Betimes ให้มา

**ยืนยัน Leave ทำเอง:** `git log d0bceca by ข้าวเหนียวหมูปิ้ง <mc47779@gmail.com>` ที่ `github.com/iiceedgee/leave-approval` Stack `Express+Angular19+Supabase` คนละตัวกับ Betimes `C# + Camunda`

**โชคดีครับ TISCO ชอบคนซื่อสัตย์ + อธิบาย Gate ได้ = ผ่าน!**

---

## ส่วนที่ 6: ปัญหาที่เจอ + Q&A ใหม่ Q31-Q50 (Senior Review 28 ส.ค. 2026 - ละเอียดทุกจุดแก้)

> 20 คำถามนี้เกิดจาก code review จริงทุกบรรทัด — ถ้ากรรมการถาม "ทำไมเขียนแบบนี้?" ให้ตอบตามสคริปต์ `ปัญหา → ยอมรับ → แก้` อย่าแถว่า "ตั้งใจออกแบบ" เพราะทุกจุดมีรอย `as any`, `setTimeout`, `bind(this)` ให้เห็น

---

### Q31: `GET /api/debug/constraint` ทำไมเรียกแล้วเห็น env/keyPrefix/statusCounts หมด?

*   **โค้ด:** `leave-api/src/routes/debug.route.js:7` `router.get('/constraint')` ไม่มี `authMiddleware` เลย, `debug.route.js:42-48` leak `out.env = { url, keyLen, keyPrefix: key.slice(0,20), VERCEL }`, `debug.route.js:50-66` ต่อ `pg.Client` ตรงแล้วยิง `SELECT conname, pg_get_constraintdef`, `SELECT current_status, count(*)` กลับทั้งตาราง
*   **คำถามไทย:** "น้องครับ พี่ `curl /api/debug/constraint` แล้วได้ `keyPrefix` 20 ตัว + `statusCounts` ทั้งระบบ แบบนี้ขึ้น Prod ได้ไหมครับ?"
*   **คำตอบไทยละเอียด:** "ไม่ได้ครับ เป็น route ที่ผมทำไว้ debug ตอน Prod `violates check constraint current_status` ที่ `59d458f` เพื่อดูว่า DB เก่ายังเป็น `F` หรือใหม่เป็น `SU` ครับ ตอนนั้นร้อนเลยเปิด `GET /constraint` แบบ public แล้วยิง `fetch` ไป `pg_constraint` + `SUPABASE_URL/rest/v1/pg_constraint` + `pg.Client` ตรง เพื่อ infer allowed set ครับ ผลคือ leak ข้อมูลอ่อนไหว `SUPABASE_URL` เต็ม, `keyPrefix 20 ตัว`, `VERCEL flag`, `statusCounts` นับทุกสถานะ ทุกคนยิงได้ไม่ต้อง login — ถือเป็น Information Disclosure ระดับ High ครับ วิธีแก้คือ 1) ใส่ `authMiddleware + roleMiddleware('hr')` หรือลบ route ทั้งก้อนก่อน deploy Prod 2) ไม่ส่ง `env` กลับ หรือ mask เป็น `***` 3) ใช้ `pg` แค่ตอน `POST /fix` ที่ต้อง auth ด้วย `?key=` และ 4) ปิด `debugRoute` ทั้งหมดเมื่อ `NODE_ENV=production` ด้วย `if (process.env.NODE_ENV !== 'production') app.use('/api/debug', debugRoute(...))` ที่ `app.js:78` ครับ"
*   **Answer EN:** "That `GET /api/debug/constraint` was a hot-fix probe for the `SU vs F` drift, left public with no auth. It returns `env.url`, first 20 chars of the service key, `statusCounts` and even tries direct `pg` queries — an information disclosure. Fix: protect or remove the route in production, mask secrets, and gate it behind `hr` role or `NODE_ENV !== 'production'`."
*   **ไฟล์:บรรทัด:** `debug.route.js:7`, `debug.route.js:34-48`, `debug.route.js:50-66`, `app.js:78`
*   **กับดักห้ามพูด:** "เปิดไว้ให้ frontend ดู constraint" / "keyPrefix ไม่เป็นไรแค่ 20 ตัว" / "GET ไม่ต้อง auth ก็ได้"
*   **วิธีแก้ตรงไปตรงมา:** `app.js:78` เปลี่ยนเป็น `if (!process.env.VERCEL || process.env.ENABLE_DEBUG==='1') app.use(...)` + `debug.route.js:7` เพิ่ม `authMiddleware, roleMiddleware('hr')` + ลบ `out.env` หรือ `keyPrefix: '***'` + ลบ `pgDirect/statusCounts` ออกจาก response

---

### Q32: `POST /api/debug/fix` hardcode `fix-2026-leave` แล้วรัน `ALTER TABLE` ได้เลย?

*   **โค้ด:** `debug.route.js:91-137` `router.post('/fix')`, `debug.route.js:93-95` `if (secret !== process.env.FIX_KEY && secret !== 'fix-2026-leave') return 403`, `debug.route.js:108-118` array `queries` มี `UPDATE ... SET current_status='SU' WHERE current_status='F'`, `ALTER TABLE DROP CONSTRAINT`, `ALTER TYPE VARCHAR(2)`, `ADD CHECK (SU,DC,MA,AP,SB,CX,RJ)`, `DROP TRIGGER trg_set_default_F`, `debug.route.js:123-129` loop `for (const q of queries) await client.query(q)`
*   **คำถามไทย:** "ถ้าพี่รู้ `?key=fix-2026-leave` พี่ก็ `ALTER TABLE` Prod ได้เลยใช่ไหม? แถม key อยู่ใน git ด้วย?"
*   **คำตอบไทยละเอียด:** "ใช่ครับ อันตรายมากครับ ผม hardcode fallback `secret !== 'fix-2026-leave'` ที่ `debug.route.js:94` ทั้งที่ `FIX_KEY` ควรมาจาก env อย่างเดียว — ตอนนี้ใครอ่าน git ก็ได้ key ไปยิง `POST /api/debug/fix?key=fix-2026-leave` แล้ว loop รัน 10 คำสั่ง `UPDATE` + `ALTER TABLE/DROP CONSTRAINT/TRIGGER` ที่ `debug.route.js:108-118` บน Prod ได้เลย ไม่มี rate-limit ไม่มี audit ว่าใครยิง ไม่มี transaction (ถ้าคำสั่งที่ 5 พัง ที่ 1-4 ไปแล้ว rollback ไม่ได้) และ `connStr` ก็รับจาก `POSTGRES_URL || DATABASE_URL || SUPABASE_DB_URL` 3 ชื่อสลับกัน งงเองครับ วิธีแก้คือ 1) ลบ fallback hardcode ทิ้ง เหลือ `if (secret !== process.env.FIX_KEY) return 403` 2) ย้าย migration ไปไฟล์ `sql/migration.sql` รันผ่าน CI ไม่ใช่ HTTP 3) ถ้าจะคง HTTP ไว้ ให้ใส่ `authMiddleware + roleMiddleware('hr')` + `express-rate-limit` + log `who/when/ip` ลง `auditLogs` 4) ห่อ `BEGIN; ... COMMIT;` ใน `client.query('BEGIN')` ก่อน loop และ `ROLLBACK` เมื่อ error ครับ หลังรันเสร็จต้องลบ route นี้ออกจาก Prod ทันทีครับ"
*   **Answer EN:** "Yes — the fallback `'fix-2026-leave'` is committed in git, so anyone can call `POST /api/debug/fix` and run `ALTER TABLE` on prod. Fix: remove the hard-coded secret, require `FIX_KEY` env only, move DDL to a versioned migration, add auth + rate limit + audit, and wrap the statements in a transaction."
*   **ไฟล์:บรรทัด:** `debug.route.js:91-96`, `debug.route.js:108-121`, `app.js:78`
*   **กับดักห้ามพูด:** "hardcode ไว้กันลืม key" / "POST ต้องรู้ URL ก่อนถึงยิงได้" / "ALTER ไม่เป็นไรเพราะมี IF EXISTS"
*   **วิธีแก้ตรงไปตรงมา:** ลบ `&& secret !== 'fix-2026-leave'` เหลือ `if (!secret || secret !== process.env.FIX_KEY) return 403`, ย้าย `queries[]` ไป `supabase/migrations/*_fix_current_status.sql`, ใส่ `authMiddleware` + `auditLog`, ห่อ `BEGIN/COMMIT`, ปิด route เมื่อ `NODE_ENV=production`

---

### Q33: อัปโหลดไฟล์แล้ว `SU -> DC` เองใน `file.route.js` ทำไม business logic อยู่ใน route?

*   **โค้ด:** `file.route.js:112-133` หลัง `for (f of req.files) await fileService.saveFile`, มี `if (leave.current_status === 'SU' && role === 'emp') { await db.updateLeave({current_status:'DC'}) + await db.addHistory(status_code:'DC') }`, `file.route.js:136-138` ถ้า `autoTransitionOk=false` ส่ง `201 {files, warning, autoTransitionOk:false}`, `file.route.js:60-73` block `AP/RJ/CX` และ `MA` สำหรับ emp
*   **คำถามไทย:** "ทำไมอัปโหลดไฟล์ถึงเปลี่ยนสถานะให้เอง? ถ้าอัปโหลดสำเร็จแต่ `updateLeave` พัง ไฟล์จะค้างที่ `SU` ไหม?"
*   **คำตอบไทยละเอียด:** "จุดนี้เป็น side effect ที่ผมซ่อนไว้ใน route ครับ ตาม flow `SU --แนบไฟล์--> DC` ที่ `file.route.js:61` ผมอยากให้ `emp` อัปโหลดแล้วข้ามไป `DC` อัตโนมัติ แต่ผมทำใน `file.route.js:115-132` หลัง `saveFile` แบบ 2 คำสั่งแยก `updateLeave` + `addHistory` ไม่มี transaction ครับ ถ้า `updateLeave` โยน `23514 check constraint` (SU/F drift) หรือ `history` พัง จะเข้า `catch` ที่ `transErr` แล้วตั้ง `autoTransitionOk=false` แต่ยัง `return 201 {files}` ให้ frontend ครับ — ผลคือไฟล์อยู่บน Storage แล้วแต่ `current_status` ยัง `SU` ทำให้ `upload-zone` ต้อง handle `autoTransitionOk===false` ที่ `upload-zone.component.ts:291` โชว์ `warning` ให้ refresh ครับ ที่ดีควรย้าย logic นี้เข้า `file.service.js` หรือ `leave.service.js` แล้วห่อ `BEGIN; INSERT documents; UPDATE leave_requests; INSERT history; COMMIT;` หรือใช้ `supabase.rpc('upload_and_transition', ...)` เพื่อ atomic ครับ ตอนนี้ผมทำ `Plan A` คือให้ frontend `reloadLeave()` ที่ `leave-detail.component.ts:116` หลัง `uploadComplete` เพื่อ sync ครับ"
*   **Answer EN:** "The `SU→DC` auto-transition is a side effect inside the upload route, done as two separate writes without a transaction. If the update fails, files are stored but status stays `SU` and we return `201` with `autoTransitionOk:false`. The proper fix is to move the logic to a service and wrap `saveFile + updateLeave + addHistory` in a transaction or a single `rpc`."
*   **ไฟล์:บรรทัด:** `file.route.js:97-139`, `upload-zone.component.ts:291-293`, `leave-detail.component.ts:113-122`
*   **กับดักห้ามพูด:** "route เปลี่ยนสถานะได้ไม่เป็นไร" / "201 คือสำเร็จเสมอ" / "ไม่ต้อง transaction เพราะมีแค่ 2 คำสั่ง"
*   **วิธีแก้ตรงไปตรงมา:** สร้าง `file.service.uploadAndTransition(leaveId, userId, files, stage)` ห่อ `db.transaction(async trx => { await trx.createDocuments(); await trx.updateLeave(); await trx.addHistory(); })` หรือ `supabase.rpc` เดียว, route เหลือ `const result = await fileService.uploadAndTransition(...)` และ return `200/500` ชัดเจน, frontend ใช้ `switchMap` แทน `await uploadAll()` ใน `subscribe`

---

### Q34: `leave-form.component.ts:82 (l as any).request_no` กับ `177 (uploadZone as any).leaveId = ...` คืออะไร?

*   **โค้ด:** `leave-form.component.ts:82` `this.resubmitNo = (l as any).request_no || null`, `leave-form.component.ts:177` `if (this.uploadZone) (this.uploadZone as any).leaveId = this.tempLeaveId`, `leave-form.component.ts:44-49` `uploadFilesFn = (files) => { if (this.tempLeaveId===null) throw... return this.leaveService.uploadFile(...)}`, `leave-form.component.ts:52-57` `get uploadLeaveId()`
*   **คำถามไทย:** "ทำไมต้อง `as any` สองจุด? `request_no` ไม่มีใน type ใช่ไหม? แล้ว `leaveId` ทำไมต้องยัดตรงๆ?"
*   **คำตอบไทยละเอียด:** "เป็น hack ที่ผมแก้หน้างานครับ จุดแรก `leave.model.ts` ยังไม่มี `request_no` ใน `Leave` interface แต่ API `GET /leave/:id` ส่ง `request_no` มาจริง (จาก `supabase-store.js:108 request_no`) ผมเลย ` (l as any).request_no` ที่ `leave-form.component.ts:82` เพื่อไม่แก้ model ครับ จุดสอง `177 (uploadZone as any).leaveId = tempLeaveId` เป็น race fix ครับ ตอน `handleCreate` หลัง `createLeave` ได้ `res.id` แล้วตั้ง `tempLeaveId = res.id` แต่ `@Input() leaveId` ของ `upload-zone` ยังเป็น `''` เพราะ `changeDetection` ยังไม่ทัน `ngOnChanges` ที่ `upload-zone.component.ts:57` จะ `loadExistingFiles()` ผมเลย sync ตรงๆก่อน `await uploadZone.uploadAll()` ไม่เช่นนั้น `upload-zone.component.ts:272` จะ `if (!leaveId) toast 'ไฟล์จะถูกอัปโหลดเมื่อกดยื่นคำขอ' return` แล้ว upload ไม่ไปครับ วิธีแก้ตรงคือ 1) เพิ่ม `request_no?: string` ใน `leave.model.ts` แล้วเลิก `as any` 2) ใช้ `@ViewChild` + `Subject` หรือทำ `uploadZone.leaveId = tempLeaveId; uploadZone.ngOnChanges(...)` อย่างเป็นทางการ หรือดีกว่าคือไม่ฝัง upload ใน form เดียวกัน — แยก `POST /leave` แล้ว `POST /leave/:id/files` เป็น 2 ขั้นชัดเจน หรือทำ `uploadFilesFn` รับ `leaveId` เป็น param แทนอ่านจาก `this.leaveId` ครับ"
*   **Answer EN:** "Both `as any` are workarounds: missing `request_no` in the `Leave` type and a race where `uploadZone.leaveId` hasn't propagated before `uploadAll()`. Fix: add `request_no` to the model, and pass `leaveId` explicitly to `uploadAll(leaveId)` or use a reactive `BehaviorSubject` instead of mutating a private `@Input` via `any`."
*   **ไฟล์:บรรทัด:** `leave-form.component.ts:82`, `leave-form.component.ts:177`, `upload-zone.component.ts:57-61`, `upload-zone.component.ts:266-275`
*   **กับดักห้ามพูด:** "`as any` ไม่เป็นไรเพราะ TypeScript แค่ตรวจตอน build" / "`@Input` แก้ตรงๆได้"
*   **วิธีแก้ตรงไปตรงมา:** `models/leave.model.ts` เพิ่ม `request_no?: string`, `upload-zone` เพิ่ม `uploadAll(leaveId?: string)` รับ id ตรง, `leave-form` เรียก `await uploadZone.uploadAll(this.tempLeaveId)` แทน hack, หรือใช้ `ReplaySubject<string> leaveId$` + `switchMap`

---

### Q35: `queueOnly` vs `immediate upload` ใน `upload-zone` ต่างกันยังไง? ทำไม `leave-form` ส่ง `queueOnly=isResubmit`?

*   **โค้ด:** `upload-zone.component.ts:25` `@Input() queueOnly = false`, `upload-zone.component.html:74` `*ngIf="pendingFiles.length>0 && !queueOnly"` โชว์ปุ่ม `อัปโหลดไฟล์`, `upload-zone.component.html:79-82` `*ngIf="(!leaveId || queueOnly) && pendingFiles.length>0"` โชว์ hint `ไฟล์จะถูกอัปโหลดพร้อมยื่นคำขอ/ส่งคำขออีกครั้ง`, `leave-form.component.html:125` `[queueOnly]="isResubmit"`, `leave-form.component.ts:139` เช็ค `if (!isResubmit && pendingFiles.length===0) return error ต้องแนบ`, `leave-form.component.ts:223-244` `handleResubmit` ตรวจ `hasPending` แล้ว `await uploadZone.uploadAll()`
*   **คำถามไทย:** "ทำไมสร้างใหม่ต้อง `queueOnly=false` แต่แก้ส่งใหม่ต้อง `queueOnly=true`? แล้วปุ่มอัปโหลดหายไปไหน?"
*   **คำตอบไทยละเอียด:** "ผมออกแบบ 2 โหมดครับ โหมดสร้างใหม่ `isResubmit=false → queueOnly=false` ที่ `leave-form.component.html:125` ตอนนั้นยังไม่มี `leaveId` (ต้อง `POST /leave` ก่อนถึงได้ id) เลยให้ `upload-zone` ทำแค่ queue ไฟล์ไว้ใน `pendingFiles[]` แล้ว `handleCreate` ที่ `leave-form.component.ts:169-205` จะ `createLeave` ก่อน ตั้ง `tempLeaveId` แล้วค่อย `await uploadZone.uploadAll()` ทีเดียว — ปุ่ม `อัปโหลดไฟล์` ที่ `upload-zone.component.html:74` จะซ่อนเพราะ `!leaveId` ทำให้ `disabled` แต่ hint ที่ `79` จะบอก `ไฟล์จะถูกอัปโหลดพร้อมยื่นคำขอ` ครับ ส่วนโหมดส่งกลับ `isResubmit=true → queueOnly=true` มี `resubmitId` แล้ว แต่ผมบังคับให้อัปโหลดพร้อม `resubmitLeave` ที่ `handleResubmit:223` เลยซ่อนปุ่ม `!queueOnly` ทิ้งแล้วให้ hint `พร้อมส่งคำขออีกครั้ง` ครับ ข้อเสียคือ logic กระจัดกระจาย — `leave-form` ต้องรู้ `queueOnly` ของลูก และ `upload-zone` ต้องรู้ `leaveId` ว่างหรือไม่ แยกกันไม่ขาด วิธีแก้คือทำ `UploadMode = 'queueUntilSubmit' | 'immediate'` ชัดเจน แล้ว `upload-zone` มี `mode` เดียว ไม่ต้องเช็ค `!leaveId || queueOnly` ซ้อนครับ"
*   **Answer EN:** "`queueOnly` hides the immediate Upload button and queues files until the parent calls `uploadAll()`. New leaves have no `id` yet so they queue, resubmits have an `id` but we still queue to upload together with `resubmit`. Better to model it as `UploadMode = 'deferred' | 'immediate'` and let the zone expose `uploadAll(leaveId)` explicitly."
*   **ไฟล์:บรรทัด:** `upload-zone.component.ts:25`, `upload-zone.component.html:74-82`, `leave-form.component.html:121-126`, `leave-form.component.ts:169-251`
*   **กับดักห้ามพูด:** "`queueOnly` คือห้ามอัปโหลด" / "สร้างใหม่ก็อัปโหลดทันทีได้"
*   **วิธีแก้ตรงไปตรงมา:** เปลี่ยน `@Input() mode: 'deferred'|'immediate' = 'immediate'`, `leave-form` ส่ง `mode="deferred"` ทั้งสองเคส, `upload-zone` เช็ค `mode==='deferred'` อย่างเดียว, เพิ่ม `uploadAll(leaveId: string)` รับ id ชัดเจน

---

### Q36: `maxFiles = 5` แต่ hint บอก `สูงสุด 10 ไฟล์` อันไหนถูก?

*   **โค้ด:** `upload-zone.component.ts:19` `@Input() maxFiles = 5`, `upload.middleware.js:62` `limits: { files: 5 }`, `file.route.js:40` `upload.array('files', 5)`, `upload-zone.component.ts:98` `remaining = maxFiles - pendingFiles.length`, `leave-form.component.html:118-119` hint `สูงสุด 10 ไฟล์`, `leave-detail.component.html:130` hint `สูงสุด 10MB/ไฟล์` ไม่พูดจำนวน
*   **คำถามไทย:** "หน้าฟอร์มบอก 10 ไฟล์ แต่โค้ดกัน 5 ไฟล์ ถ้าผู้ใช้เลือก 7 ไฟล์จะเกิดอะไร?"
*   **คำตอบไทยละเอียด:** "เป็น inconsistency ที่ผมพลาดครับ `upload-zone` ตั้ง `maxFiles=5` ที่ `upload-zone.component.ts:19` และ `multer` ก็ `limits: {files:5}` ที่ `upload.middleware.js:62` กับ `upload.array('files',5)` ที่ `file.route.js:40` แต่ hint ใน `leave-form.component.html:118` ดันเขียน `สูงสุด 10 ไฟล์` ทำให้ผู้ใช้เลือก 7 ไฟล์ `addFiles` ที่ `upload-zone.component.ts:97-118` จะ `slice(0, remaining)` เหลือ 5 แล้ว `toast.warning 'อัปโหลดได้สูงสุด 5 ไฟล์'` แต่ hint ยังบอก 10 ครับ ที่แย่กว่าคือ `addFiles` นับแค่ `pendingFiles.length` ไม่นับ `existingFileList` (ดู Q37) ทำให้อัปโหลดซ้ำได้เกินโควตา วิธีแก้คือ 1) รวมศูนย์ค่าเดียว `MAX_FILES = 5` ใน `constants/upload.ts` แล้ว import ทั้ง `upload-zone`, `multer`, `file.route` 2) hint ใช้ `{{maxFiles}}` จาก `Input` ไม่ hardcode `10` 3) เพิ่ม e2e test เลือก 6 ไฟล์ต้องได้ warning เดียวกันทั้ง frontend/backend ครับ"
*   **Answer EN:** "Frontend hint says 10 files while `maxFiles` and `multer` enforce 5 — a classic drift. `addFiles` truncates to 5 and shows a warning, but the hint misleads users. Fix: single source of truth `MAX_FILES` constant and interpolate it in the hint."
*   **ไฟล์:บรรทัด:** `upload-zone.component.ts:19`, `upload.middleware.js:62`, `file.route.js:40`, `leave-form.component.html:118`
*   **กับดักห้ามพูด:** "10 ถูก 5 ผิด" / "hint ไม่สำคัญ"
*   **วิธีแก้ตรงไปตรงมา:** สร้าง `shared/constants/upload.ts` `export const MAX_FILES=5, MAX_SIZE_MB=10`, `upload-zone` `@Input() maxFiles = MAX_FILES`, `upload.middleware` `limits:{files: MAX_FILES}`, `leave-form.html` `สูงสุด {{uploadZone.maxFiles}} ไฟล์`

---

### Q37: เลือกไฟล์เกินโควตาได้เพราะ `pendingFiles` ไม่นับ `existingFileList`?

*   **โค้ด:** `upload-zone.component.ts:97-118` `addFiles(files) { const remaining = Math.max(0, maxFiles - pendingFiles.length); const toAdd = files.slice(0, remaining); ... pendingFiles.push }`, `upload-zone.component.ts:30-31` `pendingFiles: File[]` vs `existingFileList: UploadedFile[]`, `upload-zone.component.ts:124-142` `loadExistingFiles()`
*   **คำถามไทย:** "ถ้ามีไฟล์เก่า 3 ไฟล์แล้วเลือกเพิ่ม 5 ไฟล์ใหม่ ทำไมได้ 8 ไฟล์?"
*   **คำตอบไทยละเอียด:** "เพราะ `addFiles` ที่ `upload-zone.component.ts:98` คิด `remaining = maxFiles - pendingFiles.length` อย่างเดียว ไม่ลบ `existingFileList.length` ครับ สมมติ `maxFiles=5` มีไฟล์เก่า 3 (`existingFileList=3`) แล้วเลือกใหม่ 5 ไฟล์ `remaining = 5-0=5` จะ `slice(0,5)` ได้ 5 ใหม่ รวมเป็น 8 บน UI (3 เก่า +5 ใหม่) เกินโควตา Backend `multer limits files:5` ที่ `upload.middleware.js:62` จะ block ตอน `POST` แต่ frontend ปล่อยให้เลือกเกินแล้วค่อย error ครับ ที่ถูกคือ `remaining = maxFiles - (pendingFiles.length + existingFileList.length)` และ disable `fileInput` เมื่อ `pending+existing >= maxFiles` พร้อม hint `เหลืออีก X ไฟล์` ครับ อีกจุดคือ `maxFiles` เป็น `@Input()` แต่ไม่มี `ngOnChanges` มา recalc เมื่อ `existingFileList` โหลดเสร็จ — ต้องเพิ่ม `updateRemaining()` หลัง `loadExistingFiles()` ครับ"
*   **Answer EN:** "`addFiles` only subtracts `pendingFiles` from `maxFiles`, ignoring already uploaded files, so you can exceed the limit. Fix: `remaining = maxFiles - (pending + existing)` and disable the input when full."
*   **ไฟล์:บรรทัด:** `upload-zone.component.ts:97-99`, `upload-zone.component.ts:124-142`, `upload.middleware.js:62`
*   **กับดักห้ามพูด:** "นับแค่ pending ก็พอ" / "backend กันแล้ว frontend ไม่ต้อง"
*   **วิธีแก้ตรงไปตรงมา:** `addFiles` แก้เป็น `const occupied = this.pendingFiles.length + this.existingFileList.length; const remaining = Math.max(0, this.maxFiles - occupied);`, เพิ่ม `get canAddMore() { return (pending+existing) < maxFiles }` แล้ว `[disabled]="!canAddMore"` ที่ input

---

### Q38: `new Date('2026-08-18')` ทำไมบางเครื่องนับวันลาได้ 2 วัน บางเครื่องได้ 3?

*   **โค้ด:** `leave.service.js:234-242` `calcLeaveDays` ใช้ `Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())` + `Date.UTC(end...)` หาร `86400000 +1`, `leave.service.js:248-255` `getMyHistory` filter `new Date(l.start_date).getFullYear() === targetYear` แบบ local, `notification-bell.component.ts:158-177` `formatDate` ใช้ `getUTCDate/getUTCMonth/getUTCFullYear` แล้ว fallback regex
*   **คำถามไทย:** "นับวันลา `2026-08-01` ถึง `2026-08-03` ทำไมบางคนได้ 3 บางคนได้ 2 วัน?"
*   **คำตอบไทยละเอียด:** "เพราะ `new Date('2026-08-01')` แบบ `YYYY-MM-DD` ไม่มี timezone จะถูกตีเป็น UTC 00:00 ครับ ถ้าเอา `new Date(start_date).getDate()` แบบ local ที่ไทย `UTC+7` จะได้ `2026-07-31 17:00 UTC` ทำให้ `getDate()` เลื่อนวันได้ ผมเลยแก้ `calcLeaveDays` ที่ `leave.service.js:239-240` ใช้ `Date.UTC(...getFullYear(), getMonth(), getDate())` เพื่อ normalize เป็นเที่ยงคืน UTC ก่อนลบกัน จึงนับ `+1` ได้ถูกแม้ข้าม timezone ครับ แต่จุดที่ยังพลาดคือ `getMyHistory` ที่ `248` และ `getMyBalance` ที่ `263` ใช้ `new Date(l.start_date).getFullYear()` แบบ local — ถ้า `start_date='2026-01-01'` ที่ `UTC` แต่เครื่องอยู่ `UTC-12` จะได้ `2025` แล้ว filter ตกปีผิดครับ และ `notification-bell formatDate` ที่ `158-177` ต้องมี fallback regex เพราะ `new Date('2026-02-30')` จะเป็น `Invalid Date` ครับ วิธีแก้คือเก็บ `start_date/end_date` เป็น `YYYY-MM-DD` string ล้วน ไม่แปลง `Date` เลย ใช้ `date-fns parseISO` หรือ `dayjs` แล้ว `differenceInCalendarDays` ครับ"
*   **Answer EN:** "`YYYY-MM-DD` without timezone is parsed as UTC; using local getters shifts the day in `UTC+7` etc. `calcLeaveDays` now uses `Date.UTC` to count correctly, but `getFullYear()` in history/balance still uses local time and can mis-filter. Store dates as strings and use a date library."
*   **ไฟล์:บรรทัด:** `leave.service.js:234-242`, `leave.service.js:248`, `leave.service.js:263`, `notification-bell.component.ts:158-177`
*   **กับดักห้ามพูด:** "`new Date` ใช้ได้ทุก timezone" / "นับวันลาแค่ลบกันพอ"
*   **วิธีแก้ตรงไปตรงมา:** ใช้ `date-fns` `parseISO` + `differenceInCalendarDays(end, start)+1`, หรือเก็บเป็น string แล้ว `const [y,m,d]=str.split('-').map(Number)` คำนวณเอง, `getMyHistory` เปลี่ยนเป็น `Number(l.start_date.slice(0,4)) === targetYear`

---

### Q39: `subscribe({ next: async (res) => await uploadAll() })` ทำไมเป็น anti-pattern?

*   **โค้ด:** `leave-form.component.ts:172-198` `createLeave(...).subscribe({ next: async (res) => { tempLeaveId=res.id; (uploadZone as any).leaveId=tempLeaveId; const hasPending=...; if(hasPending) try { await uploadZone.uploadAll(); ... setTimeout(navigate) } catch ... }})`, `leave-form.component.ts:223-251` `resubmitLeave(...).subscribe({ next: async () => { if(hasPending) await uploadAll() }})`
*   **คำถามไทย:** "ทำไม `subscribe` แล้ว `async/await` ข้างใน? ถ้า `uploadAll` พัง `isSubmitting` จะค้างไหม?"
*   **คำตอบไทยละเอียด:** "เป็น anti-pattern ผสม Observable + Promise ครับ ผม `subscribe` ที่ `leave-form.component.ts:170` แล้ว `next: async (res) => { await uploadZone.uploadAll() }` ทำให้ error ของ `uploadAll` ต้อง `try/catch` ซ้อน แยกจาก `error:` ของ `subscribe` ครับ ถ้า `uploadAll` throw `isSubmitting` จะค้าง `true` จนกว่าจะเข้า `catch` แล้วตั้ง `false` เอง — ลืม `finally` ก็ค้างปุ่ม `กำลังส่ง...` ได้ครับ ที่ถูกคือใช้ RxJS ล้วน `createLeave(data).pipe(switchMap(res => { tempLeaveId=res.id; return hasPending ? from(uploadZone.uploadAll()) : of(null) }), takeUntil(destroy$), finalize(()=> isSubmitting=false))` หรือใช้ `firstValueFrom` ทั้งหมด `const res = await firstValueFrom(createLeave$); await firstValueFrom(uploadZone.uploadAll$)` แบบ `async/await` ล้วน ไม่ผสม `subscribe` ครับ ปัจจุบัน `uploadZone.uploadAll()` เป็น `Promise<void>` ที่ `upload-zone.component.ts:266` `await firstValueFrom(obs.pipe(takeUntil...))` ยิ่งซ้อน `Promise` ใน `subscribe` งง 2 ชั้นครับ"
*   **Answer EN:** "Mixing `subscribe` with `async/await` inside `next` splits error handling between `try/catch` and the `error` callback and can leave `isSubmitting` stuck. Use pure RxJS (`switchMap` + `finalize`) or pure `async/await` with `firstValueFrom`, not both."
*   **ไฟล์:บรรทัด:** `leave-form.component.ts:169-205`, `leave-form.component.ts:223-251`, `upload-zone.component.ts:266-304`
*   **กับดักห้ามพูด:** "`subscribe async` ปกติ" / "`await` ใน `next` ไม่มีปัญหา"
*   **วิธีแก้ตรงไปตรงมา:** `handleCreate` เป็น `async handleCreate(){ isSubmitting=true; try{ const res=await firstValueFrom(createLeave$); tempLeaveId=res.id; if(hasPending) await uploadZone.uploadAll(); ... router.navigate } catch(e){ msg=... } finally{ isSubmitting=false } }` เลิก `subscribe` หรือใช้ `pipe(switchMap, finalize)` ให้ `isSubmitting` reset ใน `finalize` เดียว

---

### Q40: `get canApprove()` / `get canDoPretemp()` ถูกเรียกกี่ครั้งต่อวินาที?

*   **โค้ด:** `leave-detail.component.ts:124-177` มี 9 getters `canApprove, canDoPretemp, canDoTemp, canSendBack, canReject, canCancel, canResubmit, canUploadDoc, showApprovalPanel, isWaitingForUpload` แต่ละตัวอ่าน `this.user?.role` + `this.leave?.current_status` + `flag_send_back`, `leave-detail.component.html:48,88,124,141,147` ใช้ `*ngIf="canDoPretemp"` / `*ngIf="showApprovalPanel"` หลายจุด
*   **คำถามไทย:** "ทำไมใช้ `get canApprove()` แทน `canApprove()` หรือ `signal/computed`? มันเรียกทุก `changeDetection` เลยไหม?"
*   **คำตอบไทยละเอียด:** "ใช่ครับ `get canApprove()` ที่ `leave-detail.component.ts:124` เป็น getter จะถูก Angular เรียกทุก `changeDetection` cycle (ทุก click, mousemove, timer) ครับ หน้านี้มี 9 getters และ `leave-detail.component.html` ใช้ `*ngIf` 5 จุด + `*ngIf` ใน `upload-zone` อีก ทำให้แต่ละ tick เรียก `canDoPretemp` หลายรอบ ถ้า logic หนักจะหน่วงครับ ตอนนี้ logic เบา (`role===` + `status===`) เลยไม่เห็นผล แต่เป็น code smell ครับ วิธีแก้คือ 1) คำนวณครั้งเดียวหลัง `loadData` ที่ `leave-detail.component.ts:91` ตั้ง `this.canApprove = user.role==='mgr' && leave.current_status==='MA'` เป็น field ธรรมดา 2) หรือใช้ `computed` ถ้าเป็น Signals 3) หรือ `ChangeDetectionStrategy.OnPush` + `async pipe` ครับ อีกจุดคือ `upload-zone.component.ts:241 canDeleteFile()` ก็ถูกเรียกต่อ `*ngFor` ทุก row ทุก CD เช่นกัน — ควร cache เป็น `file.canDelete` ครับ"
*   **Answer EN:** "Getters run on every change-detection cycle. With 9 getters and multiple `*ngIf`s, they execute dozens of times per second. For cheap checks it's okay but it's a smell — compute once after `loadData` or use `computed`/`OnPush`."
*   **ไฟล์:บรรทัด:** `leave-detail.component.ts:124-177`, `leave-detail.component.html:48-151`, `upload-zone.component.ts:241`
*   **กับดักห้ามพูด:** "getter ไม่เรียกบ่อย" / "Angular cache getter ให้"
*   **วิธีแก้ตรงไปตรงมา:** `loadData` หลัง `this.leave=leave` เพิ่ม `this.updatePermissions()` ตั้ง `canApprove$ = computed(...)` หรือ `this.canApprove = ...` field, เปลี่ยน `ChangeDetectionStrategy.OnPush`, `canDeleteFile` เปลี่ยนเป็น `*ngIf="file._canDelete"` ที่คำนวณครั้งเดียวตอน `loadExistingFiles`

---

### Q41: `[uploadFn]="onVerificationUpload.bind(this)"` ใน template ทำไมแย่?

*   **โค้ด:** `leave-detail.component.html:52` `[uploadFn]="onVerificationUpload.bind(this)"`, `leave-detail.component.html:134-136` `[uploadFn]="onEmpUpload.bind(this)" [deleteFn]="onEmpDelete.bind(this)" [canDelete]="canEmpDelete.bind(this)"`, `leave-detail.component.ts:396-414` `onEmpUpload(files){ return this.leaveService.uploadFile(this.leave.id, files)}`
*   **คำถามไทย:** "ทำไมต้อง `.bind(this)` ใน template? มันสร้าง function ใหม่ทุกครั้งที่ `changeDetection` หรือเปล่า?"
*   **คำตอบไทยละเอียด:** "ใช่ครับ `.bind(this)` ใน template ที่ `leave-detail.component.html:52` จะสร้าง function reference ใหม่ทุก `changeDetection` ครับ Angular เห็น `Input` เปลี่ยน (reference ใหม่) จะเรียก `ngOnChanges` ของ `upload-zone` ที่ `upload-zone.component.ts:57` ทุก tick ทำให้ `loadExistingFiles` หรือ logic อื่นถูก trigger บ่อย และ `OnPush` ก็ไม่ช่วยเพราะ reference เปลี่ยนตลอดครับ ที่ผมต้อง `bind` เพราะ `onEmpUpload` ใช้ `this.leave.id` ถ้าไม่ `bind` `this` จะหายเมื่อ `upload-zone` เรียก `fn(files)` ที่ `upload-zone.component.ts:281` `fn(files)` จะ `this` เป็น `upload-zone` ไม่ใช่ `leave-detail` ครับ วิธีแก้คือ 1) ใน `leave-detail.component.ts` สร้าง arrow field `onEmpUpload = (files: File[]) => this.leaveService.uploadFile(this.leave!.id, files)` มัน bind `this` อัตโนมัติ ไม่ต้อง `bind` ใน template 2) หรือใช้ `uploadFnFactory` คืน `() => obs` แทน หรือ 3) ส่ง `leaveId` ให้ `upload-zone` แล้วให้ zone เรียก `leaveService` เอง ไม่ต้องส่ง function ผ่าน `Input` ครับ"
*   **Answer EN:** "`.bind(this)` in the template creates a new function on every CD, defeating `OnPush` and triggering `ngOnChanges` constantly. Fix: use an arrow property `onEmpUpload = (files) => ...` in the component, or let the zone call the service itself with `leaveId`."
*   **ไฟล์:บรรทัด:** `leave-detail.component.html:52`, `leave-detail.component.html:134-136`, `upload-zone.component.ts:57-61`, `upload-zone.component.ts:279-282`
*   **กับดักห้ามพูด:** "`.bind` ใน template ปกติ" / "สร้าง function ใหม่ไม่เปลือง"
*   **วิธีแก้ตรงไปตรงมา:** `leave-detail.component.ts` เปลี่ยน `onEmpUpload(files:File[]){...}` เป็น `onEmpUpload = (files: File[]) => this.leaveService.uploadFile(this.leave!.id!, files)` แล้ว template ใช้ `[uploadFn]="onEmpUpload"` ไม่ต้อง `bind`, หรือ `upload-zone` รับ `leaveId` แล้ว `inject LeaveService` เอง

---

### Q42: `AppComponent.InjectorInstance.get(Dialog)` ทำไมเรียก Static Injector?

*   **โค้ด:** `app.component.ts:10-13` `public static InjectorInstance: Readonly<Injector>; constructor(injector:Injector){ InjectorInstance=injector }`, `common/dialog/dialog.ts:26,41` `const buildedDialog = AppComponent.InjectorInstance.get(Dialog)`, `dialog.ts:25` `export function showDialog(options){ const d = AppComponent.InjectorInstance.get(Dialog); ... }`
*   **คำถามไทย:** "ทำไม `showDialog` ต้องไปดึง `AppComponent.InjectorInstance` แทน `inject(Dialog)` ปกติ?"
*   **คำตอบไทยละเอียด:** "เป็น Service Locator แบบเก่าครับ ผมอยากเรียก `showDialog({title,message})` ที่ `leave-detail.component.ts:215,230` ได้จากทุกที่โดยไม่ต้อง `constructor(private dialog: Dialog)` ผมเลยเก็บ `Injector` ไว้ที่ `AppComponent` เป็น static ที่ `app.component.ts:10` แล้ว `dialog.ts:26` `AppComponent.InjectorInstance.get(Dialog)` ครับ ข้อเสียคือ 1) ทำ unit test ยาก ต้อง mock `AppComponent.InjectorInstance` static 2) พังถ้าเรียกก่อน `AppComponent` สร้าง (เช่น `APP_INITIALIZER`) 3) ปิดบัง dependency — ไม่รู้ว่า component ไหนใช้ Dialog จาก constructor 4) เป็น anti-pattern ที่ Angular เลิกแนะนำแล้ว ควรใช้ `inject()` ครับ วิธีแก้คือ `export function showDialog(...) { const dialog = inject(Dialog); ... }` ใช้ `inject()` ใน `InjectionContext` หรือทำ `DialogService` แล้ว `constructor(private dialog: DialogService)` แบบ DI ปกติ หรือ `leave-detail` `inject(Dialog)` ตรงๆ แล้ว `this.dialog.confirm(...)` ครับ"
*   **Answer EN:** "Static `InjectorInstance` is a Service Locator anti-pattern — hides dependencies, breaks testing, and fails before `AppComponent` init. Use `inject(Dialog)` or constructor DI instead."
*   **ไฟล์:บรรทัด:** `app.component.ts:10-13`, `common/dialog/dialog.ts:25-42`, `leave-detail.component.ts:213-358`
*   **กับดักห้ามพูด:** "static Injector สะดวกดี" / "DI ปกติเขียนยาว"
*   **วิธีแก้ตรงไปตรงมา:** `dialog.ts` เปลี่ยนเป็น `export function showDialog(opts){ const dialog = inject(Dialog); return dialog.info(...) }` หรือ `leave-detail.component.ts` `private dialog = inject(Dialog)` แล้ว `await this.dialog.confirm(...)` ไม่ผ่าน static

---

### Q43: `auth.service.ts` แกะ JWT เองด้วย `atob` ทำไมไม่ใช้ lib?

*   **โค้ด:** `auth.service.ts:50-66` `isLoggedIn(){ const token=getToken(); const base64Url=token.split('.')[1]; let base64=base64Url.replace(/-/g,'+').replace(/_/g,'/'); base64+='='.repeat((4-base64.length%4)%4); const binary=atob(base64); const json=decodeURIComponent(Array.prototype.map.call(binary, c=>'%'+...).join('')); const payload=JSON.parse(json); return payload.exp*1000>Date.now() }`, `auth.service.ts:37-47` `getUser()` `JSON.parse(localStorage.getItem('user'))`
*   **คำถามไทย:** "ทำไมต้อง `replace - _` เติม `=` แล้ว `map call` แปลง `atob` เอง? ถ้า token ไม่มี `exp` หรือ payload เป็นภาษาไทยจะพังไหม?"
*   **คำตอบไทยละเอียด:** "เพราะผมแกะ JWT แบบ manual ครับ JWT เป็น `header.payload.signature` แบบ `base64url` ต้อง `replace -→+ _→/` แล้ว pad `=` ให้ครบ 4 ที่ `auth.service.ts:56-57` แล้ว `atob` ได้ binary string ที่เป็น `latin1` ไม่ใช่ UTF-8 ถ้า `fullName` เป็นไทย `กรรณิการ์` จะเพี้ยน ผมเลยต้อง `Array.prototype.map.call(binary, c=> '%'+c.charCodeAt(0).toString(16))` แล้ว `decodeURIComponent` ที่ `60-62` เพื่อถอด UTF-8 ให้ถูกครับ จุดนี้เคยพังจริงที่ `auth.service.ts:53` `atob` พังกับ token ภาษาไทย `hr01 222` จน `AuthGuard` บล็อกแม้ `200` (ดู Q30) ผมเลยแก้แล้วครับ แต่ยังไม่มี verify `signature` — แค่ดู `exp` ที่ `payload.exp*1000 > Date.now()` เท่านั้น ใครแก้ `exp` ใน localStorage ก็ผ่าน `isLoggedIn` ได้จนกว่า `authMiddleware` ที่ backend จะ reject ครับ วิธีแก้คือใช้ `jwt-decode` lib หรือ `jose` แล้วเช็ค `exp` + `iat` เดียว ไม่ต้อง manual ครับ และไม่ควรเก็บ `user` แยกใน `localStorage` ที่ `auth.service.ts:19` เพราะ `token` กับ `user` อาจ drift — ควรแกะ `user` จาก `payload` เดียวครับ"
*   **Answer EN:** "Manual `atob` + `decodeURIComponent` is needed to handle Thai UTF-8 and `base64url` padding, but it's fragile and doesn't verify the signature. Use `jwt-decode` and derive `user` from the payload instead of separate `localStorage`."
*   **ไฟล์:บรรทัด:** `auth.service.ts:50-66`, `auth.service.ts:37-47`
*   **กับดักห้ามพูด:** "`atob` ใช้ได้เลยไม่ต้อง pad" / "เช็ค `exp` ฝั่ง frontend พอ"
*   **วิธีแก้ตรงไปตรงมา:** `npm i jwt-decode` แล้ว `import { jwtDecode } from 'jwt-decode'; const payload = jwtDecode<{exp:number}>(token); return payload.exp*1000>Date.now()`, ลบ `localStorage USER_KEY` ใช้ `payload.user` เดียว

---

### Q44: `notification-bell` poll ทุก 15 วินาที ทำไมไม่ใช้ WebSocket?

*   **โค้ด:** `notification-bell.component.ts:49-66` `interval(15000).pipe(startWith(0), switchMap(()=> fetchNotifications().pipe(catchError(()=>of(null)))), takeUntil(destroy$)).subscribe(handleLeaves)`, `notification-bell.component.ts:70-72` `fetchNotifications(){ return leaveService.getLeaves() }`, `notification-bell.component.ts:109-133` `handleLeaves` `sort updated_at slice 10`, `notification-bell.component.ts:36-37` `NEED_CHECK = new Set(['DC','MA'])`
*   **คำถามไทย:** "ถ้ามี 1000 ใบลา ทุกคน poll `GET /leave` ทุก 15 วิ จะเป็นยังไง? แล้ว `emp` เห็นแดงมั่วไหม?"
*   **คำตอบไทยละเอียด:** "เป็น Phase A ที่ผมทำเร็วครับ `interval(15000)` ที่ `notification-bell.component.ts:49` จะยิง `GET /api/leave` ทุก 15 วิ ทุกคนที่เปิด dashboard — ถ้า 100 ลูกค้าพร้อมกันคือ 400 req/min ไป `listLeaves` ที่ต้องโหลด `allLeaves + allUsers` แล้ว sort ครับ แถม `fetchNotifications` ที่ `70` ยังเรียก `getLeaves()` ที่ดึงทั้งตารางมา filter ฝั่ง frontend ที่ `handleLeaves:118-129` ไม่ใช่ `getUnread` จริงครับ ผมแก้เบื้องต้นแล้ว `isNeedsCheck` ที่ `89` ใช้ role-based `emp: SU+Y (ต้องแก้) / mgr: DC|MA / hr: DC` แทน `NEED_CHECK` เดิมที่แดงมั่ว, ใช้ `readKey=id:status` ที่ `85` กัน `DC→MA` เปลี่ยนแล้วถือว่าอ่านค้าง, `localStorage notif_read_ids` กัน refresh หาย, `sort updated_at slice 10` กันบวม 1000 แถว ที่ `124-129`, `catchError return null` กัน wipe ครับ แต่ Phase B ที่ดีคือสร้าง `notifications` table + `supabase realtime` หรือ `SSE` แล้ว bell `subscribe` แทน poll หรืออย่างน้อย `GET /api/notifications/unread` ที่ filter ฝั่ง DB ไม่ดึงทั้ง `leave_requests` ครับ"
*   **Answer EN:** "Polling `GET /leave` every 15s for all users scales poorly (N×400 req/min) and pulls the whole table to filter client-side. Phase A mitigates with role-based `isNeedsCheck`, `id:status` read keys, and `slice(10)`, but Phase B should use a `notifications` table with Realtime/SSE."
*   **ไฟล์:บรรทัด:** `notification-bell.component.ts:36`, `notification-bell.component.ts:49-66`, `notification-bell.component.ts:70-102`, `notification-bell.component.ts:124-133`
*   **กับดักห้ามพูด:** "15 วิไม่เปลือง" / "poll ทั้งตารางไม่เป็นไร"
*   **วิธีแก้ตรงไปตรงมา:** สร้าง `notifications` table `id, user_id, leave_id, type, is_read`, `supabase.channel('notif').on('postgres_changes', ...).subscribe()`, `fetchNotifications()` เปลี่ยนเป็น `notificationService.getUnread()` ที่ `SELECT * WHERE user_id=... AND is_read=false`

---

### Q45: `leave.service.js getLeaves` ทำไมดึง `listLeaves + listUsers` แล้ว `filter` ใน memory?

*   **โค้ด:** `leave.service.js:47-71` `async getLeaves(userId, role){ const allLeaves=await db.listLeaves(); const allUsers=await db.listUsers(); const nameMap=new Map(allUsers.map(u=>[u.id,u.full_name])); if(role==='hr') leaves=allLeaves; else if(role==='mgr') { mgr=allUsers.find(u=>u.id===userId); leaves=allLeaves.filter(l=>{ u=allUsers.find(x=>x.id===l.user_id); return u && u.department===mgr.department })} else leaves=allLeaves.filter(l=>l.user_id===userId); return leaves.map(l=>({...l, owner_name:...})).sort(...) }`, `supabase-store.js:67-69` `listUsers() { return supabase.from('users').select('*') }`
*   **คำถามไทย:** "ถ้ามี 10,000 ใบลา `mgr` จะ `find` กี่ครั้ง? ทำไมไม่ให้ DB `WHERE department = ?`?"
*   **คำตอบไทยละเอียด:** "เป็น N+1 แบบ in-memory ครับ `getLeaves` ที่ `leave.service.js:47` ดึง `allLeaves` ทั้งตาราง + `allUsers` ทั้งตาราง แล้ว `mgr` case ที่ `59-62` ทำ `allLeaves.filter(l => { const u = allUsers.find(x=>x.id===l.user_id) })` — ถ้า 10,000 ใบลา แต่ละใบ `find` วน `allUsers` คือ `10,000 * U` ครั้ง แถม `allUsers.find(u=>u.id===userId)` ซ้ำทุก request ครับ Supabase ควร `SELECT * FROM leave_requests JOIN users ON leave_requests.user_id=users.id WHERE users.department = (SELECT department FROM users WHERE id=mgrId)` หรือ `supabase.from('leave_requests').select('*, users!inner(department)').eq('users.department', mgrDept)` ให้ DB filter ก่อนส่งครับ ตอนนี้ `InMemoryStore` ก็ `filter` ใน memory เหมือนกันเพราะไม่มี query ครับ อีกจุดคือ `owner_name` ที่ `70` ทำ `Map` ถูกแล้ว แต่ `sort` ที่ `71` ใช้ `new Date(b.created_at).getTime()` ทุกครั้ง — ควรให้ `ORDER BY created_at DESC` ฝั่ง DB ที่ `supabase-store.js:181-186` แล้วไม่ต้อง sort ซ้ำครับ"
*   **Answer EN:** "`getLeaves` loads the entire `leave_requests` and `users` tables then filters in memory; for `mgr` it does a nested `find` per leave (N×M). Should push the filter to the DB with a join/where and order by `created_at` server-side."
*   **ไฟล์:บรรทัด:** `leave.service.js:47-71`, `supabase-store.js:67-69`, `supabase-store.js:180-186`
*   **กับดักห้ามพูด:** "ดึงมาหมดแล้ว filter ไม่ช้า" / "N+1 ไม่เกิดกับ Supabase"
*   **วิธีแก้ตรงไปตรงมา:** `supabase-store.js` เพิ่ม `listLeavesByRole(userId, role)` ที่ `if(role==='mgr') { const {data:mgr}=await supabase.from('users').select('department').eq('id',userId).single(); return supabase.from('leave_requests').select('*, users!inner(department)').eq('users.department', mgr.department) }` หรือใช้ `supabase.rpc`

---

### Q46: `approve / sendBack / reject` ทำไมไม่มี Transaction + Row Lock?

*   **โค้ด:** `leave.service.js:80-86` `approve(){ leave=await getLeaveById(leaveId); if(leave.current_status!=='MA') return error; return transition }`, `leave.service.js:89-122` `sendBack(){ leave=await getLeaveById; if(!allowed.includes(status)) return error; updated=await updateLeave({current_status:'SU', flag_send_back:'Y', send_back_count+1}); addHistory }`, `leave.service.js:184-199` `transition(){ leave=await getLeaveById; updated=await updateLeave({current_status:target}); addHistory }`
*   **คำถามไทย:** "ถ้า 2 หัวหน้ากด `อนุมัติ` ใบเดียวกันเวลา `09:00:00.001` จะเกิดอะไร?"
*   **คำตอบไทยละเอียด:** "จะ Race ครับ ทั้งคู่ `await getLeaveById` ได้ `MA` ทั้งคู่ ผ่าน Gate `if (status!=='MA') return error` ที่ `leave.service.js:85` ทั้งคู่ แล้ว `transition` ที่ `189` `updateLeave({current_status:'AP'})` 2 รอบ + `addHistory` 2 รอบ ได้ `AP` ซ้อนกัน ไม่มีใคร block ครับ เหมือน Q10 ที่เคยตอบ `Transaction + SELECT FOR UPDATE` แต่โค้ดนี้ยังไม่มีครับ ที่ถูกคือ `BEGIN; SELECT * FROM leave_requests WHERE id=$1 FOR UPDATE;` ล็อคแถวไว้ คนที่ 2 ต้องรอ คนที่ 1 `COMMIT` แล้วคนที่ 2 อ่านใหม่ได้ `AP` แล้ว Gate จะ `return error 'ไม่ใช่ MA'` ครับ Supabase ไม่มี `FOR UPDATE` ตรงๆ ต้องใช้ `supabase.rpc('approve_leave', {leave_id, user_id, role})` ที่ข้างใน `plpgsql` ทำ `PERFORM ... FOR UPDATE` หรือ `UPDATE ... WHERE current_status='MA' RETURNING *` แล้วเช็ค `rowCount===0` แปลว่ามีคนแย่งไปแล้วครับ ปัจจุบัน `supabase-store.js:189` `updateLeave` เป็น `update().eq('id',id)` ธรรมดา ไม่เช็ค `current_status` เดิมครับ"
*   **Answer EN:** "Two `mgr`s can read `MA` concurrently, both pass the guard, and both write `AP`. No `FOR UPDATE` lock or transaction — classic race. Fix: `SELECT FOR UPDATE` inside a transaction or atomic `UPDATE ... WHERE status='MA'` and check `rowCount`."
*   **ไฟล์:บรรทัด:** `leave.service.js:80-86`, `leave.service.js:89-122`, `leave.service.js:184-199`, `supabase-store.js:189-207`
*   **กับดักห้ามพูด:** "มี Gate แล้วไม่ต้อง lock" / "Supabase ทำ transaction ไม่ได้"
*   **วิธีแก้ตรงไปตรงมา:** สร้าง `supabase.rpc('transition_leave', {p_id, p_target, p_expected, p_user, p_role})` ที่ `BEGIN; SELECT ... FOR UPDATE; IF status<>expected THEN RAISE; UPDATE; INSERT history; COMMIT; END;` หรือ `updateLeave` แก้เป็น `.update(fields).eq('id',id).eq('current_status', expected).select().maybeSingle()` แล้วเช็ค `if(!data) return {error:'ถูกคนอื่นเปลี่ยนสถานะไปแล้ว'}`

---

### Q47: `request_no` แบบ `LV-2026-0001` ถ้า 2 คนกดยื่นพร้อมกันเลขจะซ้ำไหม?

*   **โค้ด:** `supabase-store.js:82-99` `_nextRequestNo(){ prefix=LV-${year}-; {data,error}=await supabase.from('leave_requests').select('request_no').like(...).order(...).limit(1); if(m) return prefix+pad(parseInt(m[1])+1); } fallback {count}=await select count head true like prefix; return prefix+pad(count+1) }`, `supabase-store.js:104-166` `createLeave` loop `for(attempt 0..3) { insert(payload); if(error.code==='23505' && message includes request_no) { payload.request_no=await _nextRequestNo(); continue } }`
*   **คำถามไทย:** "ถ้า `emp01` กับ `emp02` กดยื่นเวลาเดียวกัน `SELECT max request_no` จะได้เลขเดียวกันไหม?"
*   **คำตอบไทยละเอียด:** "ได้ครับ เป็น Race แบบ read-modify-write ครับ `_nextRequestNo` ที่ `supabase-store.js:86` `SELECT order request_no desc limit 1` แล้ว `+1` หรือ `COUNT+1` แบบไม่มี lock — ถ้า 2 คน `SELECT` พร้อมกันได้ `LV-2026-0005` ทั้งคู่ แล้ว `INSERT` คนแรกผ่าน คนที่ 2 จะ `23505 unique violation` ที่ `supabase-store.js:150` แล้วเข้า retry `payload.request_no = await _nextRequestNo()` ซึ่งก็ `SELECT` ใหม่ได้ `0006` แล้วลองใหม่ครับ ดูเหมือนมี retry 3 ครั้งที่ `122` แต่ retry ก็ยัง `SELECT max+1` แบบเดิม — ถ้า 3 คนพร้อมกันอาจชนซ้ำอีก และ `COUNT` fallback ที่ `94` ยิ่งแย่เพราะ `COUNT` ไม่ได้ lock เช่นกันครับ ที่ถูกคือใช้ `SEQUENCE` หรือ `SERIAL` หรือ `pg sequence` `CREATE SEQUENCE leave_seq; SELECT nextval('leave_seq')` แล้ว `request_no = 'LV-'||year||'-'||lpad(nextval::text,4,'0')` แบบ atomic หรือ `INSERT ... ON CONFLICT` หรือ `advisory lock` ครับ ตอนนี้ผมมี `UNIQUE(request_no)` กันซ้ำเลยไม่ค่อยเห็น แต่ log จะมี `warn duplicate, retry` บ่อยครับ"
*   **Answer EN:** "`_nextRequestNo` does `SELECT max +1` without a lock — two concurrent creates can generate the same `request_no` and only the second relies on the 3-retry on `23505`. Use a DB `SEQUENCE`/`nextval` for atomic numbers."
*   **ไฟล์:บรรทัด:** `supabase-store.js:82-99`, `supabase-store.js:122-165`
*   **กับดักห้ามพูด:** "มี retry 3 ครั้งพอแล้ว" / "`COUNT+1` ปลอดภัย"
*   **วิธีแก้ตรงไปตรงมา:** สร้าง `CREATE SEQUENCE leave_request_no_seq;` แล้ว `createLeave` ใช้ `const {data:seq}=await supabase.rpc('next_request_no', {year}); payload.request_no=`LV-${year}-${pad(seq)}`` หรือ `INSERT ... SELECT max+1 FOR UPDATE` ใน `rpc`

---

### Q48: `SU` vs `F` ทำไมโค้ดส่ง `SU` แต่ Prod ยังเป็น `F`?

*   **โค้ด:** `supabase-store.js:104-172` `createLeave` `payload={current_status:'SU', ...data}`, `supabase-store.js:118` `allowed=['SU','F','DC',...] if(!allowed.includes(payload.current_status)) payload.current_status='SU'`, `supabase-store.js:135-148` `if(isCheckViolation && payload.current_status==='SU') { payload.current_status='F'; continue }`, `supabase-store.js:168-172` `_normalizeLeave(leave){ if(leave.current_status==='F') return {...leave, current_status:'SU'} }`, `supabase-store.js:189-207` `updateLeave` retry `SU<->F`, `supabase-store.js:47-48` `getCounts` เคย log `violates check constraint`
*   **คำถามไทย:** "ทำไม `git log 59d458f` บอก Prod `violates check constraint current_status` แล้วต้อง fallback `F`?"
*   **คำตอบไทยละเอียด:** "เป็น drift ระหว่างโค้ดกับ DB ครับ เดิม Prod สร้างตารางด้วย `F` (อาจย่อมาจาก `Filing`/`First`?) แต่โค้ดใหม่ใช้ `SU (Submitted)` ที่ `status.js:27` ทำให้ `INSERT current_status='SU'` โดน `CHECK (current_status IN ('F','DC',...))` ที่ Prod แล้ว `23514` ครับ ผมเลยทำ dual fallback ที่ `supabase-store.js:135-148` ลอง `SU` ก่อน ถ้า `23514` ให้สลับเป็น `F` แล้ว `continue` และขาออก `_normalizeLeave` ที่ `168` แปลง `F→SU` ให้ frontend เห็น `SU` เดียวครับ `updateLeave` ที่ `189` ก็ fallback `SU↔F` เหมือนกันครับ ทางแก้ถาวรคือ `debug.route.js:114-118` `ALTER TABLE ... DROP CONSTRAINT IF EXISTS ... ADD CHECK (SU,DC,MA,AP,SB,CX,RJ)` + `UPDATE ... SET current_status='SU' WHERE current_status='F'` ที่ `112` แล้วลบ fallback `F` ทิ้งครับ ตอนนี้ผมทำ `Plan A` คือคง fallback ไว้ก่อนจนกว่า migration จะรันบน Prod จริง แล้วค่อยลบ `allowed` ที่มี `F` ที่ `118` ครับ ถ้ากรรมการถามให้ตอบว่า `SU` คือคำใหม่ `F` คือ legacy ที่ DB เก่ายังอยู่ครับ"
*   **Answer EN:** "Prod DB still has a `CHECK` allowing `F` while new code uses `SU` — we added a dual fallback that retries `F` on `23514` and normalizes `F→SU` on read. Permanent fix is the `ALTER TABLE` migration that converts `F→SU` and recreates the check without `F`."
*   **ไฟล์:บรรทัด:** `supabase-store.js:104-172`, `supabase-store.js:168-172`, `supabase-store.js:189-207`, `debug.route.js:112-119`
*   **กับดักห้ามพูด:** "F กับ SU คนละสถานะ" / "fallback F ตั้งใจให้มี 2 code"
*   **วิธีแก้ตรงไปตรงมา:** รัน `POST /api/debug/fix?key=...` หรือ `supabase/migration.sql` ที่ `UPDATE F→SU; ALTER DROP CONSTRAINT; ADD CHECK (SU,DC,MA,AP,SB,CX,RJ)`, แล้วลบ `F` ออกจาก `allowed` และลบ `_normalizeLeave` + retry `SU↔F` ทั้งหมด

---

### Q49: `audit-log.middleware.js` ทำไม `in-memory` + `finish` + `close` double-fire?

*   **โค้ด:** `audit-log.middleware.js:1-31` `MAX_AUDIT_LOGS=1000`, `audit-log.middleware.js:3-9` `if(!req.path.startsWith('/api/')) return next(); start=hrtime.bigint(); log=()=>{ if(!res.writableFinished) return; entry={method,path,statusCode,durationMs,userId,ip,timestamp}; store.auditLogs.push(entry); if(store.auditLogs.length>MAX) splice(0, length-MAX) }`, `audit-log.middleware.js:26-27` `res.on('finish', log); res.on('close', log)`, `supabase-store.js:17` `this.auditLogs=[]`, `store.js:28` `this.auditLogs=[]`, `app.js:58` `app.use(auditLogMiddleware(db))`, `app.js:92-94` `GET /api/audit-logs` `role hr`
*   **คำถามไทย:** "พี่ `GET /api/audit-logs` แล้วเห็น log เบิ้ล 2 รอบ แถม restart แล้วหายหมด?"
*   **คำตอบไทยละเอียด:** "ใช่ครับ 2 ปัญหาครับ 1) double-fire ที่ `audit-log.middleware.js:26-27` ผม `res.on('finish', log)` + `res.on('close', log)` สอง event — `finish` คือส่งครบ, `close` คือ connection ปิด บางครั้ง `close` เกิดหลัง `finish` ทันที ทำให้ `log()` ถูกเรียก 2 รอบ ถ้า `res.writableFinished` ยัง `true` ทั้งคู่ (ผมกันแค่ `if(!writableFinished) return` ไม่ได้กัน double) จะ `push` 2 entry ซ้ำกันครับ ควรกันด้วย `let logged=false; const log=()=>{ if(logged) return; logged=true; ... }` หรือฟัง `finish` อย่างเดียวพอครับ 2) in-memory ที่ `supabase-store.js:17` `this.auditLogs=[]` และ `store.js:28` เก็บใน RAM — restart/cold start บน Vercel ก็หายหมด, `MAX 1000` ที่ `audit-log.middleware.js:22` `splice(0, length-MAX)` ก็ผิด — ถ้าเกิน 1000 มัน `splice` ลบตัวเก่าออกเหลือ 1000 จริงแต่ `splice(0, N)` ลบจากหัวถูกแล้วแต่ควรใช้ `store.auditLogs = store.auditLogs.slice(-MAX)` ชัดกว่า อีกจุดคือ `app.js:58` ใช้ `auditLogMiddleware(db)` ก่อน `authMiddleware` ทำให้ `req.user` ยัง `null` บาง log ครับ วิธีแก้คือย้ายไปหลัง `auth` หรือทำ `audit` แบบ DB table `audit_logs` + `supabase.from('audit_logs').insert(entry)` แทน memory ครับ"
*   **Answer EN:** "Listening to both `finish` and `close` can log twice; and storing logs in `this.auditLogs = []` loses them on restart. Fix: deduplicate with a `logged` flag and persist to a DB table."
*   **ไฟล์:บรรทัด:** `audit-log.middleware.js:1-31`, `supabase-store.js:17`, `store.js:28`, `app.js:58`, `app.js:92-94`
*   **กับดักห้ามพูด:** "in-memory พอแล้วสำหรับ audit" / "`finish` กับ `close` ต้องฟังคู่กัน"
*   **วิธีแก้ตรงไปตรงมา:** `audit-log.middleware.js` เปลี่ยนเป็น `let done=false; const log=()=>{ if(done) return; done=true; ... } ; res.once('finish', log)` อย่างเดียว, สร้าง `supabase.from('audit_logs').insert(entry)` แทน `push`, `app.js` ย้าย `auditLogMiddleware` ไปหลัง `express.json` + ทำ `req.user?.id` หลัง auth

---

### Q50: `setTimeout 800/1500/2500` + `toPromise()` ทำไม hardcode + deprecated?

*   **โค้ด:** `leave-detail.component.ts:232` `await this.leaveService.getFiles(id).toPromise()`, `leave-detail.component.ts:247,267,293,328,353,373,388` ทุก `handle*` ใช้ `toPromise()` 7 จุด + `setTimeout(()=>loadData(id),800)` 6 จุด, `leave-detail.component.ts:332-335` `setTimeout(()=>{ showCelebration=false; loadData(...) },2500)`, `leave-form.component.ts:35` `NAVIGATION_DELAY_MS=1500` + `leave-form.component.ts:187,197` `setTimeout(()=>router.navigate(['/dashboard']), NAVIGATION_DELAY_MS)`, `leave-detail.component.ts:57-65` `makeConfetti()` 60 ชิ้น
*   **คำถามไทย:** "ทำไมทุก action ต้อง `setTimeout 800ms` แล้วค่อย `loadData`? แล้ว `toPromise()` ยังใช้ได้ไหม?"
*   **คำตอบไทยละเอียด:** "ผม hardcode delay ครับ `leave-detail` ทุก `handlePretempPass/SendBack/Reject/Approve/SendBack/Cancel` ที่ `leave-detail.component.ts:249,269,295,332,355,375,390` หลัง `await service.toPromise()` จะ `setTimeout(()=>loadData(id),800)` เพื่อเผื่อ `DB eventual consistency` (Supabase replica lag) และให้ `toast` โชว์ก่อน reload ครับ `leave-form` ก็ `1500ms` ที่ `NAVIGATION_DELAY_MS` ก่อน `navigate('/dashboard')` ที่ `187` เพื่อให้ user เห็น `ส่งคำขอลาเรียบร้อย ✅` ครับ แต่ `800/1500/2500` เป็น magic number ไม่มีเหตุผลตายตัว ถ้าเน็ตช้า 800 ไม่พอ ถ้าเร็วก็หน่วงเปล่าครับ อีกจุดคือ `toPromise()` ที่ `232` ถูก deprecated ตั้งแต่ RxJS 7 แล้ว (`toPromise` จะลบใน RxJS 8) ควรใช้ `firstValueFrom` หรือ `lastValueFrom` ที่ `upload-zone.component.ts:290` ใช้ถูกแล้ว `firstValueFrom(obs.pipe(takeUntil...))` ครับ วิธีแก้คือ 1) เปลี่ยนทุก `toPromise()` เป็น `await firstValueFrom(this.leaveService.pretempPass(...))` 2) เลิก `setTimeout` ใช้ `switchMap` reload ทันที `await firstValueFrom(...); await firstValueFrom(getLeave(id)); toast.success` หรือถ้าจะ delay ให้ใช้ `timer(800).pipe(switchMap(()=>loadData$))` อย่างเป็น RxJS ครับ และ `NAVIGATION_DELAY_MS` ควรเป็น `environment` ไม่ hardcode ครับ"
*   **Answer EN:** "Hard-coded `800/1500/2500ms` `setTimeout`s are arbitrary delays for DB consistency/toast visibility, and `toPromise()` is deprecated since RxJS 7. Use `firstValueFrom` and reload via `switchMap`/`timer` instead of magic timeouts."
*   **ไฟล์:บรรทัด:** `leave-detail.component.ts:232`, `leave-detail.component.ts:247-390`, `leave-form.component.ts:35-197`, `upload-zone.component.ts:290`
*   **กับดักห้ามพูด:** "`toPromise` ยังใช้ได้" / "`800ms` คือค่ามาตรฐาน"
*   **วิธีแก้ตรงไปตรงมา:** แทน `toPromise` ทั้ง 7 จุดด้วย `await firstValueFrom(this.leaveService.xxx(...))`, เลิก `setTimeout 800` ใช้ `await loadDataAsync(id)` ทันทีหรือ `timer(500).pipe(switchMap(...))`, `NAVIGATION_DELAY_MS` ย้ายไป `environment.ts`

---

> **สรุปภาพรวม Q31-Q50:** `Q31-32` ห้ามเปิด debug บน Prod, `Q33` ย้าย side effect เข้า service + transaction, `Q34-37` แก้ `as any` + `queueOnly` + `maxFiles` drift, `Q38` ระวัง `Date UTC`, `Q39-42` เลิก `subscribe async` + `getter` + `bind(this)` + `static Injector`, `Q43` เลิกแกะ JWT เอง, `Q44` เลิก poll 15s, `Q45-47` แก้ N+1 + race + request_no, `Q48` รัน migration ลบ `F`, `Q49` เลิก audit in-memory double-fire, `Q50` เลิก `setTimeout` + `toPromise` — ท่อง 5 นาทีนี้ปิดจุดอ่อน Senior Review หมดครับ

**ยืนยัน Senior Review 28 ส.ค. 2026:** `leave-form.component.ts:82,177`, `upload-zone.component.ts:19,25,97`, `file.route.js:61,112`, `debug.route.js:7,91`, `supabase-store.js:82,135,168`, `leave.service.js:47,80,234`, `auth.service.ts:50`, `notification-bell.component.ts:49`, `leave-detail.component.ts:52,124,232`, `upload.middleware.js:62` | **Prod must:** ปิด `/api/debug`, ลบ `fix-2026-leave`, รวม `MAX_FILES` เดียว, ใช้ `firstValueFrom`, ทำ `rpc FOR UPDATE`

---

## ส่วนที่ 7: P1 6 Fixes Q51-Q56 (Text-only + UI Hint — ไม่แก้ Logic หนัก 28 ส.ค. 2026)

> 6 ข้อนี้คือ P1 ที่แก้แล้วจริง — เน้น `drift/สี/UX hint` ไม่แตะ transaction/N+1 — ถ้ากรรมการถาม "ทำไมแก้แค่นี้?" ให้ตอบ "P1 เอา drift ออกก่อน P2 ค่อยทำ CQRS/RLS/Transaction ครับ"

---

### Q51: hint บอก `10 ไฟล์` แต่โค้ดกัน `5 ไฟล์` — drift เกิดจากอะไร? แก้ `10->5` แบบ text-only พอไหม?

*   **โค้ด:** `angular-ui/src/app/pages/leave-form/leave-form.component.html:118-119` hint เดิม `สูงสุด 10 ไฟล์`, `angular-ui/src/app/shared/upload-zone/upload-zone.component.ts:19` `@Input() maxFiles = 5`, `leave-api/src/middleware/upload.middleware.js:62` `limits: { fileSize: 10*1024*1024, files: 5 }`, `leave-api/src/routes/file.route.js:40` `upload.array('files', 5)`
*   **คำถามไทย:** "หน้าฟอร์มบอก 10 ไฟล์ แต่ backend กัน 5 ไฟล์ ถ้าพี่เลือก 7 ไฟล์จะเกิดอะไรครับ? แล้วทำไมแก้แค่เปลี่ยนตัวเลขใน hint?"
*   **คำตอบไทยละเอียด:** "drift ครับ — `upload-zone.ts:19` ตั้ง `maxFiles=5` และ `upload.middleware.js:62` กับ `file.route.js:40` ก็ `files:5` ตรงกันทั้ง 3 ชั้น (Input/multer/route) แต่ `leave-form.html:118` ดัน hardcode `สูงสุด 10 ไฟล์` ครับ ผู้ใช้เลือก 7 ไฟล์ `addFiles()` ที่ `upload-zone.ts:98-117` จะ `slice(0, remaining)` เหลือ 5 แล้ว `toast.warning 'สูงสุด 5 ไฟล์'` ส่วน 2 ไฟล์ที่เกินหายเงียบ hint ยังบอก 10 ทำให้งงครับ P1 ผมแก้แบบ text-only ที่ `leave-form.html:118-119` เปลี่ยน `10 → 5` อย่างเดียว `บังคับแนบอย่างน้อย 1 ไฟล์ — ไฟล์จะถูกส่งพร้อมยื่นคำขอ (สูงสุด 5 ไฟล์, ไฟล์ละไม่เกิน 10MB, รองรับ .pdf .jpg .png .docx)` และ `isResubmit` บรรทัด `119` ก็ `สูงสุด 5 ไฟล์` ครับ ไม่แก้ logic เพื่อไม่ให้กระทบ `multer` ที่ lock 5 อยู่แล้ว — ปลอดภัย deploy ทันทีครับ P2 ค่อยรวมศูนย์ `MAX_FILES=5` ที่ `shared/constants/upload.ts` แล้วให้ `upload-zone` + `multer` + hint ใช้ `{{maxFiles}}` เดียวกัน + เพิ่ม test เลือก 6 ไฟล์ต้อง warning เดียวกันทั้ง FE/BE ครับ"
*   **Answer EN:** "Hint said 10 while code enforces 5 in three places (`@Input`, `multer`, `route`). Users picking 7 get silently truncated to 5. P1 fixes the text to `5` only; P2 will extract `MAX_FILES=5` as single source of truth and interpolate it in the hint."
*   **ไฟล์:บรรทัด:** `leave-form.component.html:118-119`, `upload-zone.component.ts:19`, `upload.middleware.js:62`, `file.route.js:40`
*   **กับดักห้ามพูด:** "10 ถูก 5 ผิด" / "hint ไม่สำคัญ" / "แก้ backend เป็น 10 ให้ตรง hint"
*   **วิธีแก้ตรงไปตรงมา:** P1 `leave-form.html:118-119` hardcode `10→5` text-only (ทำแล้ว), P2 สร้าง `shared/constants/upload.ts` `export const MAX_FILES=5` แล้ว `upload-zone @Input() maxFiles=MAX_FILES`, `upload.middleware` `limits:{files:MAX_FILES}`, hint ใช้ `สูงสุด {{maxFiles}} ไฟล์` ไม่ hardcode

---

### Q52: สีสถานะ `SU ส้ม / DC ฟ้า / MA เหลือง` ไม่ตรงกัน 3 ไฟล์ — ทำไมต้อง unified ให้ `MA` เป็น `warning เหลือง`?

*   **โค้ด:** `angular-ui/src/styles.scss:50-57` `.status-SU/.status-F #fff3e0/$warning #e65100` `.status-DC/.status-VC #e3f2fd/$sendback #1565c0` `.status-MA #fff8e1/#f57f17` + `.status-SB #e3f2fd` `.status-AP #e8f5e9/$success`, `angular-ui/src/app/pages/leave-history/leave-history.component.ts:69-75` `getStatusClass()` map `SU:F:SB→status-sendback(ส้ม) DC:VC→status-pending(ฟ้า) MA→status-warning(เหลือง)`, `angular-ui/src/app/pages/leave-history/leave-history.component.scss:288-326` `.status-warning #fff8e1/#f57f17 border #ffe082` `.status-pending #e3f2fd/#1565c0` `.status-sendback #fff3e0/#e65100`
*   **คำถามไทย:** "พี่เห็น `MA รอหัวหน้าอนุมัติ` บางหน้าเป็นฟ้า บางหน้าเป็นเหลือง ตกลงสีอะไรถูกครับ? แล้ว `SU` กับ `SB` ทำไมสีเดียวกัน?"
*   **คำตอบไทยละเอียด:** "drift สีครับ เดิม `styles.scss:50` badge กลางมี `SUส้ม #fff3e0` `DCฟ้า #e3f2fd` `MAเหลือง #fff8e1/#f57f17` แต่ `leave-history.ts:69` เคย map `MA` ไป `status-pending ฟ้า` เหมือน `DC` ทำให้ `MA` สองหน้าไม่ตรงกันครับ P1 ผม unified ให้ `MA → status-warning เหลือง #fff8e1/#f57f17 + border #ffe082` ที่ `leave-history.ts:72` และ `leave-history.scss:322-326` ตรงกับ `styles.scss:54` ครับ เหตุผล `MA=รอหัวหน้าอนุมัติ` ควรเด่นแบบ warning เหลือง ต่างจาก `DC=รอตรวจสอบเอกสาร ฟ้า #e3f2fd/#1565c0` และ `SU/SB=ส้ม #fff3e0/#e65100` ที่แปลว่า `ส่งกลับ/รอแก้` ครับ `AP เขียว #e8f5e9/#2e7d32` `RJ/CX แดง #fce4ec/#c62828` คงเดิม ตอนนี้ 3 ไฟล์ตรงกันหมด — `SU/F ส้ม, DC/VC ฟ้า, MA เหลือง warning, AP เขียว, SB ส้ม, CX/RJ แดง` ครับ"
*   **Answer EN:** "Status colors drifted: `MA` was blue like `DC` in one file, yellow in another. P1 unified `MA` to `status-warning` yellow `#fff8e1/#f57f17` with `#ffe082` border in all three files, distinct from `DC` blue and `SU/SB` orange."
*   **ไฟล์:บรรทัด:** `styles.scss:50-57`, `leave-history.component.ts:69-75`, `leave-history.component.scss:288-326`
*   **กับดักห้ามพูด:** "`MA` ควรเป็นฟ้าเหมือน `DC`" / "สีไม่สำคัญ UX ไม่ต้องตรงกัน" / "`SU` กับ `SB` ควรคนละสี"
*   **วิธีแก้ตรงไปตรงมา:** P1 unified แล้ว — `styles.scss:54` `.status-MA #fff8e1/#f57f17`, `leave-history.ts:72` `MA:'status-warning'`, `leave-history.scss:322` `.status-warning #fff8e1/#f57f17 border #ffe082` — P2 ทำ `design-tokens.scss` `$status-MA-bg:#fff8e1; $status-MA-fg:#f57f17` แล้ว import 3 ไฟล์

---

### Q53: Stepper `pending เทา / done เขียว` แต่ Timeline `pending ขาว / done เทา` — ทำไมต้อง unified เป็น `done เขียว #2e7d32`?

*   **โค้ด:** `angular-ui/src/app/shared/stepper/stepper.component.scss:20-40` `.step.done .icon-container {color:#2e7d32} .step.done .step-line {background:#2e7d32} .step.pending {color:#C4C4C4} .step.current {color:#0E3362}`, `angular-ui/src/app/shared/timeline/timeline.component.scss:9-14` `.stepper-detail-marker.pending .stepper-detail-dot {background:#ffffff; border-color:#C4C4C4} .stepper-detail-marker.done .stepper-detail-dot {background:#2e7d32; border-color:#2e7d32} .stepper-detail-marker.current {background:#0E3362}`, `leave-api/src/services/stepper.service.js:11-22` 4 ขั้น `SU DC MA + Final AP/RJ/CX`
*   **คำถามไทย:** "ทำไม Stepper ขั้นที่เสร็จแล้วเป็นเทา แต่ Timeline ขั้นเสร็จแล้วเป็นเขียว? แล้ว `pending` ทำไมอันหนึ่งเทา อีกอันขาว?"
*   **คำตอบไทยละเอียด:** "drift 2 จุดครับ 1) `done` Stepper เดิมเคยใช้เทา `#C4C4C4` เหมือน `pending` ทำให้ดูไม่ออกว่าเสร็จแล้ว ส่วน Timeline `done` ใช้เขียว `#2e7d32` ถูกต้องครับ 2) `pending` Stepper `#C4C4C4` เทาทึบ แต่ Timeline `pending` ใช้ขาว `#ffffff` ขอบเทา `#C4C4C4` ดูจางกว่าครับ P1 ผม unified ให้ `done = เขียวเข้ม #2e7d32` ทั้งคู่ ที่ `stepper.scss:21-23` `done .icon/line/#2e7d32` และ `timeline.scss:13-14` `done dot/line #2e7d32` ตรงกันครับ `pending` คงต่างแบบตั้งใจ — Stepper `pending` เทา `#C4C4C4` ทั้ง icon/line, Timeline `pending` ขาว `#ffffff` ขอบ `#C4C4C4` + line `#e5e9f0` เพื่อให้ vertical timeline อ่านง่ายบนพื้นขาวครับ `current` ทั้งคู่ `#0E3362 น้ำเงินเข้ม` `rejected/cancelled แดง #c62828` ตรงกันหมดแล้วครับ ดูที่ `stepper.service.js:11` 4 ขั้น `SU DC MA + Final` จะได้ `RJ ที่ DC = done done pending rejected` ต่างจาก `RJ ที่ MA = done done done rejected` ด้วย `getMaxReachedIndex` ครับ"
*   **Answer EN:** "Stepper `done` was grey while Timeline `done` was green `#2e7d32` — drift. P1 unified both to green `#2e7d32`. `pending` stays intentionally different: Stepper grey `#C4C4C4`, Timeline white `#ffffff` with grey border for readability on white."
*   **ไฟล์:บรรทัด:** `stepper.component.scss:20-40`, `timeline.component.scss:9-14`, `stepper.service.js:11-27`
*   **กับดักห้ามพูด:** "`done` ควรเป็นเทาเหมือนเดิม" / "Stepper กับ Timeline ควรสีเหมือนกันหมด" / "เขียว `#2e7d32` กับ `#e8f5e9` เหมือนกัน"
*   **วิธีแก้ตรงไปตรงมา:** P1 unified แล้ว — `stepper.scss:21` `.done {color:#2e7d32}`, `timeline.scss:13` `.done {background:#2e7d32}` — P2 ทำ `tokens.scss` `$done:#2e7d32; $pending:#C4C4C4; $current:#0E3362` แล้ว import คู่

---

### Q54: แผง `ตรวจสอบเอกสาร (pretemp)` ปุ่ม 3 ปุ่มงง — ทำไมต้องเพิ่ม `panel-hint` + `placeholder` + `disabled` ตาม `remark`?

*   **โค้ด:** `angular-ui/src/app/pages/leave-detail/leave-detail.component.html:48-88` `<p class=\"panel-hint\">เอกสารครบ → กด “เอกสารครบถ้วน” ส่งต่อหัวหน้าอนุมัติทันที · ส่งกลับ/ไม่อนุมัติ ต้องระบุเหตุผล</p>` + `textarea placeholder=\"หมายเหตุ (จำเป็นเมื่อส่งกลับ/ไม่อนุมัติ)\"` + `*ngIf=\"isPretempSendDisabled\"` + `title/aria-disabled`, `angular-ui/src/app/pages/leave-detail/leave-detail.component.ts:194-201` `get isPretempSendDisabled(){return !pretempRemark?.trim()||loading}` + `isPretempRejectDisabled` alias, `leave-detail.component.scss` `.panel-hint`
*   **คำถามไทย:** "พี่เปิด `DC` เจอ 3 ปุ่ม `เอกสารครบถ้วน / ส่งกลับ / ไม่อนุมัติ` ไม่รู้ว่าปุ่มไหนต้องใส่เหตุผลก่อนครับ?"
*   **คำตอบไทยละเอียด:** "UX งงครับ เดิมแผง `canDoPretemp` ที่ `leave-detail.html:48` มี 3 ปุ่มเท่ากันหมด ไม่มี hint บอกว่า `เอกสารครบถ้วน` กดได้เลย แต่ `ส่งกลับ/ไม่อนุมัติ` ต้องมี `remark` ครับ P1 ผมเพิ่ม 1) `panel-hint` ที่ `html:50` `เอกสารครบ → กด “เอกสารครบถ้วน” ส่งต่อหัวหน้าอนุมัติทันที · ส่งกลับ/ไม่อนุมัติ ต้องระบุเหตุผล` สีเทาอธิบาย flow ชัด 2) `textarea placeholder=\"หมายเหตุ (จำเป็นเมื่อส่งกลับ/ไม่อนุมัติ)\"` ที่ `html:61` บอกว่าจำเป็นเฉพาะ 2 ปุ่มหลัง 3) `getter` ที่ `leave-detail.ts:194` `isPretempSendDisabled = !pretempRemark?.trim() || loading` และ `isPretempRejectDisabled` alias เดียวกัน แล้ว `html:75,83` `[disabled]=\"isPretemp*Disabled\"` + `[attr.aria-disabled]` + `[attr.title]=\"กรุณาระบุเหตุผล\"` ทำให้ปุ่มเทาและ tooltip บอกว่าต้องพิมพ์ก่อนครับ ปุ่ม `เอกสารครบถ้วน` ที่ `html:65` `disabled=loading` อย่างเดียว กดได้เลยไม่ต้องมีเหตุผล ตรงกับ `document.service.js:11 pretempPass()` ที่ไม่บังคับ `remark` ครับ"
*   **Answer EN:** "Pretemp panel had 3 equal buttons with no guidance. P1 adds a `panel-hint` explaining `pass → immediate, sendBack/reject → remark required`, a placeholder clarifying when remark is mandatory, and disables those two buttons via `isPretempSendDisabled` until `pretempRemark.trim()` is non-empty."
*   **ไฟล์:บรรทัด:** `leave-detail.component.html:48-88`, `leave-detail.component.ts:194-201`, `document.service.js:11`
*   **กับดักห้ามพูด:** "3 ปุ่มควร enabled หมด" / "`remark` ไม่จำเป็น" / "hint ไม่ต้องมีก็ได้"
*   **วิธีแก้ตรงไปตรงมา:** P1 ทำแล้ว — `html:50` `panel-hint`, `html:61` `placeholder จำเป็นเมื่อส่งกลับ/ไม่อนุมัติ`, `ts:194` `isPretempSendDisabled=!remark.trim()`, `html:75` `[disabled]=\"isPretempSendDisabled\"` — P2 เพิ่ม `*ngIf=\"pretempRemarkError\"` แดงใต้ textarea

---

### Q55: HR เปิด `MA` เจอหน้าว่าง กับ `SU` ก็ว่าง — ทำไมต้องเพิ่ม banner `รอหัวหน้าอนุมัติ` vs `รอพนักงานแนบเอกสาร`?

*   **โค้ด:** `angular-ui/src/app/pages/leave-detail/leave-detail.component.html:42-46` `<div *ngIf=\"shouldShowWaitingForHr\">รอพนักงานดำเนินการ (SU) — รอพนักงานแนบเอกสาร/แก้ไขหลังถูกส่งกลับ เจ้าหน้าที่ไม่ต้องดำเนินการ</div>`, `leave-detail.component.html:88-125` `<div *ngIf=\"showApprovalPanel\">หัวหน้าอนุมัติ (MA) — อนุมัติ/ส่งกลับ/ไม่อนุมัติ + panel-hint เฉพาะหัวหน้า (mgr) ที่แผนกเดียวกัน · HR ดูได้อย่างเดียว</div>`, `leave-detail.component.ts:124-126` `canApprove = role==='mgr'&&status==='MA'`, `leave-detail.component.ts:179-191` `showApprovalPanel = status==='MA' && (canApprove||canSendBack||canReject)` + `isWaitingForUpload = status==='SU'` + `shouldShowWaitingForHr = (hr||mgr) && SU`
*   **คำถามไทย:** "HR เปิดใบ `MA รอหัวหน้าอนุมัติ` ทำไมไม่เห็นปุ่มอะไรเลย? แล้ว `SU` ก็ว่างเหมือนกัน ต่างกันยังไงครับ?"
*   **คำตอบไทยละเอียด:** "ว่างเพราะ guard ถูกครับ แต่ UX ว่างเปล่าทำให้ HR งงครับ 1) `MA` ที่ `leave-detail.ts:124` `canApprove` อนุญาตแค่ `mgr` แถม `showApprovalPanel` ที่ `179` เป็น `status==='MA' && (canApprove||canSendBack||canReject)` แบบ strict ไม่ใช่ `DC` — ถ้า `HR` เปิด `MA` จะไม่มี `canApprove` เลย panel ไม่โชว์ 2) `SU` ที่ `isWaitingForUpload` ก็ไม่มี panel ไหนตรง เพราะ `canDoPretemp` ต้อง `DC` และ `showApprovalPanel` ต้อง `MA` ครับ P1 ผมเพิ่ม 2 banners: `html:42` `shouldShowWaitingForHr` สำหรับ `SU` — `รอพนักงานดำเนินการ (SU) ...รอพนักงานแนบเอกสาร/แก้ไขหลังถูกส่งกลับ เจ้าหน้าที่ไม่ต้องดำเนินการ` ให้ `hr||mgr` เห็นแทนหน้าว่างครับ และ `html:88-92` approval panel ที่ `MA` เพิ่ม `panel-hint` `เฉพาะหัวหน้า (mgr) ที่แผนกเดียวกัน · HR ดูได้อย่างเดียว` ทำให้ HR เปิด `MA` แล้วเห็น panel แต่ปุ่ม `อนุมัติ` จะไม่มีเพราะ `*ngIf=\"canApprove\"` ที่ `html:102` กัน `HR` กดครับ P2 ค่อยทำ `HR read-only banner \"ต้องให้หัวหน้าอนุมัติก่อน\"` แบบ dialog ที่ `guardHrBlockedAtM` มีแล้วครับ"
*   **Answer EN:** "Both `SU` and `MA` showed empty for HR — correct by RBAC but confusing. P1 adds a `SU` waiting banner (`shouldShowWaitingForHr`) and clarifies the `MA` panel with a hint that only `mgr` can approve; HR sees the panel read-only. `showApprovalPanel` is strictly `MA`-only."
*   **ไฟล์:บรรทัด:** `leave-detail.component.html:42-46`, `leave-detail.component.html:88-125`, `leave-detail.component.ts:124-126`, `leave-detail.component.ts:179-191`
*   **กับดักห้ามพูด:** "HR ควรกดอนุมัติที่ `MA` ได้" / "`SU` ควรให้ HR กดตรวจสอบได้" / "หน้าว่างปกติไม่ต้องแก้"
*   **วิธีแก้ตรงไปตรงมา:** P1 ทำแล้ว — `html:42` `*ngIf=\"shouldShowWaitingForHr\"` banner SU, `html:92` `panel-hint HR ดูได้อย่างเดียว`, `ts:188` `shouldShowWaitingForHr=(hr||mgr)&&SU` — P2 เพิ่ม `guardHrBlockedAtM` toast ที่ `ts:213` สำหรับกัน HR ยิง API ตรง

---

### Q56: ชื่อไฟล์ยาวล้นการ์ด + ตอนไม่มีไฟล์งงว่า `บัค?` — แก้ `ellipsis` + `pending hint` ยังไง?

*   **โค้ด:** `angular-ui/src/app/shared/upload-zone/upload-zone.component.html:28-35` `<span class=\"file-name\" [attr.title]=\"file.name\">{{file.name}}</span>` + `html:70-76` `<div class=\"empty-files\">— ยังไม่มีเอกสาร —</div>` + `<div class=\"pending-hint\">มีไฟล์รออัปโหลด {{pendingFiles.length}} ไฟล์ — จะถูกส่งพร้อม{{queueOnly ? 'ส่งคำขออีกครั้ง':'ยื่นคำขอ'}}</div>`, `angular-ui/src/app/shared/upload-zone/upload-zone.component.scss:56` `.file-name {flex:1 1 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}`
*   **คำถามไทย:** "ไฟล์ชื่อ `รายงานการลาป่วย_โรงพยาบาลกรุงเทพ_2569_ใบรับรองแพทย์_ฉบับจริง.pdf` มันล้นการ์ด แล้วตอนยังไม่เลือกไฟล์ขึ้นว่างๆ ไม่มีอะไรบอกเลยครับ?"
*   **คำตอบไทยละเอียด:** "2 ปัญหา UX ครับ 1) ชื่อยาวล้น — `file-item` เป็น `flex` แต่ `.file-name` ไม่มี `min-width:0` จะไม่ยอมหด ทำให้ `ใบรับรองแพทย์_...pdf` ดันปุ่ม `ดู/ลบ` ตกขอบครับ ผมแก้ที่ `upload-zone.scss:56` `flex:1 1 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap` ทำให้ยาวแล้ว `...` กลางบรรทัด และ `html:30,47` ใส่ `[attr.title]=\"file.name\"` hover เห็นชื่อเต็มครับ 2) empty งง — เดิม `*ngIf=\"existing+pending===0 && !loading\"` โชว์แค่ว่างๆ ไม่มี hint ครับ P1 เพิ่ม `html:70` `empty-files — ยังไม่มีเอกสาร —` สีเทา กับ `html:74` `pending-hint` `มีไฟล์รออัปโหลด X ไฟล์ — จะถูกส่งพร้อมยื่นคำขอ/ส่งคำขออีกครั้ง` ที่ `queueOnly` สลับข้อความที่ `html:75` `{{queueOnly ? 'ส่งคำขออีกครั้ง':'ยื่นคำขอ'}}` ครับ และ `html:40-47` `file-download` ทำเป็น `role=button tabindex=0` + `keydown.enter/space` ให้คีย์บอร์ดกดโหลดได้ครับ"
*   **Answer EN:** "Long filenames overflowed the flex row and empty state showed blank. P1 fixes `.file-name` with `flex:1; min-width:0; ellipsis` plus `title` on hover, adds `— ยังไม่มีเอกสาร —` empty text and a `pending-hint` (`X files will be sent with submit/resubmit`) that switches via `queueOnly`."
*   **ไฟล์:บรรทัด:** `upload-zone.component.html:28-35`, `upload-zone.component.html:70-76`, `upload-zone.component.scss:56`
*   **กับดักห้ามพูด:** "ชื่อยาวปล่อยล้นได้" / "empty ไม่ต้องบอก" / "`min-width:0` ไม่จำเป็น"
*   **วิธีแก้ตรงไปตรงมา:** P1 ทำแล้ว — `scss:56` `min-width:0 + ellipsis + nowrap`, `html:30` `[title]=file.name`, `html:70` `empty-files`, `html:74` `pending-hint + queueOnly` — P2 เพิ่ม `max-width` tooltip หรือ `truncate middle` ถ้าชื่อยาวมาก

---

> **สรุปภาพรวม Q51-Q56 (P1 6 Fixes):** `Q51` hint `10→5` text-only ตรง `5` ทั้ง 3 ชั้น, `Q52` `MA เหลือง warning #fff8e1/#f57f17` unified 3 ไฟล์, `Q53` `done เขียว #2e7d32` unified Stepper/Timeline + `pending` ขาว/เทาตั้งใจต่าง, `Q54` `panel-hint` + `placeholder` + `disabled= !remark`, `Q55` banner `SU รอพนักงาน` vs `MA รอหัวหน้า` แก้หน้าว่าง HR, `Q56` `ellipsis + title` + `empty/pending hint` — P1 ปิด drift/UX ก่อน P2 ค่อยทำ `MAX_FILES constant / tokens / transaction`

**ยืนยัน P1 28 ส.ค. 2026:** `leave-form.html:118`, `upload-zone.ts:19`, `upload.middleware.js:62`, `file.route.js:40`, `styles.scss:50`, `leave-history.ts:69`, `leave-history.scss:288`, `stepper.scss:20`, `timeline.scss:9`, `leave-detail.html:42,48,88`, `leave-detail.ts:124,179,194`, `upload-zone.html:28,70`, `upload-zone.scss:56` | **P2 next:** `MAX_FILES constant`, `design tokens`, `firstValueFrom`, `rpc FOR UPDATE`, `RLS`



---

## ส่วนที่ 8: P1.5 Polish Q57-Q63 — Dashboard / Hardening / Detail / Form / Polish / File Flow / Sitemap (28 ส.ค. 2026)

> ✨ 7 ข้อนี้ปิด **P1.5** — ต่อยอด P1 ที่เพิ่งแก้ `text-only/สี/hint` — เน้น **UX ลัด + Security P0 + แยก SU/MA ชัด + 5 ไฟล์ + SCSS รวมศูนย์ + Stage ตรง + สรุป Commit** — ท่อง 5 นาทีตอบกรรมการได้ทันที

---

### Q57: 🔄 Dashboard — badge ส่งกลับ + ปุ่ม แก้ไข ลัดไป `/edit` แก้ emp งงว่าต้องแก้ตรงไหน?

*   **โค้ด:** `angular-ui/src/app/pages/dashboard/dashboard.component.html:52` `sendback-badge` + `:60` `btn-resubmit` `*ngIf="flag_send_back==='Y' && isOwner(data.data)"`, `dashboard.component.ts:58` `isOwner()`, `dashboard.component.scss:6` `.sendback-badge`/`.btn-resubmit`/`.actions-cell`
*   **คำถามไทย:** "พี่เห็น `SB` แต่ไม่รู้ต้องกดตรงไหนเพื่อแก้ หน้าตารางควรบอกยังไงครับ?"
*   **คำตอบไทยละเอียด:**
    *   **เดิมงง:** `dxi-column` Actions มีแค่ `ดูรายละเอียด` + `<span class="tag">🔄 ส่งกลับ</span>` สีส้มลอยๆ ไม่มีปุ่มกด — `emp` ต้องจำว่า `SB` คือ `SU+Y` ต้องกลับไป `/leave/:id` แล้วหา `ไปฟอร์ม` เอง
    *   **ใหม่ชัด 2 จุด:** `html:52` ใต้ `app-status-badge` เพิ่ม `<span class="sendback-badge">🔄 ส่งกลับแก้ไข</span>` พื้น `#fff3e0` ขอบ `#ffcc80` ตัว `#e65100` มี `title="ถูกส่งกลับ กรุณาแก้ไขแล้วส่งใหม่"` — เห็นใต้สถานะทันที ไม่ต้องเดา
    *   **ปุ่มลัดเฉพาะเจ้าของ:** `html:60` เพิ่ม `<a class="btn-sm btn-resubmit" [routerLink]="'/leave/'+id+'/edit'">แก้ไข</a>` แสดงเมื่อ `flag_send_back==='Y' && isOwner(data.data)` ที่ `dashboard.ts:58` (`String(user_id)===String(user.id)`) — `mgr/hr` ดูได้แต่ไม่เห็นปุ่ม ไม่หลงกดของคนอื่น
    *   **จัดเลย์เอาต์ไม่แตก:** `scss:9` `.actions-cell {display:flex; gap:8px; flex-wrap:wrap; justify-content:center}` + `.btn-resubmit {background:#e65100}` ส้มเด่นกว่า `btn-sm #0E3362` — มือถือก็ไม่ล้น
*   **Answer EN:** "Previously the table only showed a plain `sendback` tag with no action, forcing `emp` to find the edit form manually. Now `html:52` renders an orange `sendback-badge` under the status and `html:60` shows a `แก้ไข` button directly to `/leave/:id/edit` only when `flag_send_back==='Y'` and `isOwner()`, laid out in a flex `actions-cell`."
*   **ไฟล์:บรรทัด:** `dashboard.component.html:52`, `dashboard.component.html:60`, `dashboard.component.ts:58-61`, `dashboard.component.scss:6-9`
*   **กับดักห้ามพูด:** "ทุกคนเห็นปุ่มแก้ไขได้" / "`flag_send_back` ดูจาก `current_status` ก็พอ" / "badge ไม่ต้องมีก็ได้"
*   **วิธีแก้ตรงไปตรงมา:** คง `html:52` badge + `html:60` `*ngIf="flag_send_back==='Y' && isOwner(data.data)"` ไว้, `isOwner` เทียบ `String()` กัน `number/string` drift, P2 เพิ่ม `tooltip` บอก `ส่งกลับรอบที่ {{send_back_count}}`

---

### Q58: 🔒 Debug route — ทำไมต้อง `auth + role admin` + ลบ hardcode `fix-2026-leave`? [P0 Security]

*   **โค้ด:** `leave-api/src/routes/debug.route.js:8-10` `router.use(authMiddleware)` + `router.use(roleMiddleware('admin'))`, `:100` `if(!FIX_KEY || secret!==FIX_KEY)` ลบ `&& secret !== 'fix-2026-leave'`, `:58,105` `POSTGRES_URL || DATABASE_URL || SUPABASE_DB_URL` 3 ชื่อ
*   **คำถามไทย:** "ถ้าพี่รู้ `?key=fix-2026-leave` จาก git พี่ก็ `ALTER TABLE` Prod ได้เลยใช่ไหมครับ?"
*   **คำตอบไทยละเอียด:**
    *   **P0 เดิมรั่ว:** `debug.route.js:91-96` `if(secret !== FIX_KEY && secret !== 'fix-2026-leave')` hardcode ใน git — ใครอ่าน commit ก็ยิง `POST /api/debug/fix?key=fix-2026-leave` แล้ว loop `UPDATE F→SU / ALTER TABLE / DROP CONSTRAINT` ที่ `:114-124` บน Prod ได้เลย ไม่มี log
    *   **Hardening ใหม่:** `js:8-10` ใส่ `router.use(authMiddleware)` + `roleMiddleware('admin')` ทุก `debug` route — ต้อง **login + role `admin`** ก่อน แม้รู้ key ก็ `401/403` ถ้าไม่ใช่ `admin`; `js:100` ลบ fallback เหลือ `if(!process.env.FIX_KEY || secret !== process.env.FIX_KEY) return 403` — key มาจาก **env อย่างเดียว**
    *   **ลด leak:** `js:48-53` `env` ยังส่ง `url/keyLen/keyPrefix` — P2 ต้อง mask `keyPrefix:'***'` และปิด `GET /constraint` ที่ Prod ด้วย `if(NODE_ENV==='production') disable`
    *   **อีกจุด `connStr` งง:** `js:105` รับ `POSTGRES_URL || DATABASE_URL || SUPABASE_DB_URL` 3 ชื่อ — ควรรวมศูนย์ `DB_URL` ตัวเดียวใน `env`
*   **Answer EN:** "The fallback `fix-2026-leave` was committed, so anyone could `POST /fix` and `ALTER TABLE` prod. Fix removes the hardcode, requires `FIX_KEY` env only, and gates all debug routes behind `auth + admin` role at `js:8-10`."
*   **ไฟล์:บรรทัด:** `debug.route.js:8-10`, `debug.route.js:100`, `debug.route.js:91-96`, `debug.route.js:114-124`, `app.js:78`
*   **กับดักห้ามพูด:** "hardcode ไว้กันลืม key" / "`GET` ไม่ต้อง auth ก็ได้" / "`keyPrefix 20 ตัว` ไม่เป็นไร"
*   **วิธีแก้ตรงไปตรงมา:** คง `router.use(authMiddleware)+roleMiddleware('admin')` ที่ `:8-10`, ลบ `&& secret !== 'fix-2026-leave'` เหลือ env เดียว, ย้าย SQL ไป `supabase/migrations/*_fix_constraint.sql` รันผ่าน CI ไม่ใช่ HTTP, เพิ่ม `auditLog` + `BEGIN/COMMIT`

---

### Q59: 👁️ Detail — `SU รอพนักงาน` vs `MA รอหัวหน้า` ทำไม HR เปิดแล้วว่าง? [แก้ด้วย banner + panel แยก]

*   **โค้ด:** `angular-ui/src/app/pages/leave-detail/leave-detail.component.html:42-46` `*ngIf="shouldShowWaitingForHr"` banner **SU**, `:88-92` `*ngIf="showApprovalPanel"` **MA** `+ panel-hint`, `leave-detail.component.ts:124` `canApprove` + `:179` `showApprovalPanel` + `:188` `shouldShowWaitingForHr`
*   **คำถามไทย:** "HR เปิดใบ `MA` กับ `SU` ทำไมเจอหน้าว่างเหมือนกัน ต่างกันยังไงครับ?"
*   **คำตอบไทยละเอียด:**
    *   **ว่างเพราะ guard ถูกแต่ UX งง:** `ts:124` `canApprove = role==='mgr' && status==='MA'` — `HR` ไม่มีสิทธิ์กด, `ts:179` `showApprovalPanel = MA && (canApprove||canSendBack||canReject)` **strict MA เท่านั้น** (ไม่ใช่ `DC`), `canDoPretemp` ต้อง `DC` — `SU` จึงไม่มี panel ไหนตรงเลย
    *   **SU banner แยกชัด:** `html:42-46` `*ngIf="shouldShowWaitingForHr"` โชว์เมื่อ `ts:188` `isHrOrMgr && isWaitingForUpload(SU)` — ข้อความ `รอพนักงานดำเนินการ (SU) — รอพนักงานแนบเอกสาร/แก้ไขหลังถูกส่งกลับ เจ้าหน้าที่ไม่ต้องดำเนินการ` — `HR/mgr` เห็นแทนหน้าว่าง
    *   **MA panel มี hint กันเข้าใจผิด:** `html:90-92` `หัวหน้าอนุมัติ (MA) — อนุมัติ/ส่งกลับ/ไม่อนุมัติ` + `<p class="panel-hint">เฉพาะหัวหน้า (mgr) ที่แผนกเดียวกัน · HR ดูได้อย่างเดียว</p>` — `HR` เปิด `MA` เห็น panel แต่ `*ngIf="canApprove"` ที่ `:102` ซ่อนปุ่มอนุมัติ

| สถานะ | ใครเห็นอะไร | โค้ด |
|---|---|---|
| **SU** | `HR/mgr` → banner ส้ม `รอพนักงาน` / `emp` → `canUploadDoc/canResubmit` | `html:42` `ts:188` |
| **DC** | `HR/mgr` → `canDoPretemp` 3 ปุ่ม + `panel-hint` | `html:48` `ts:129` |
| **MA** | `mgr` → `showApprovalPanel` 3 ปุ่ม / `HR` → เห็น panel แต่ปุ่ม `อนุมัติ` หาย | `html:88` `ts:124,179` |
*   **Answer EN:** "Both `SU` and `MA` looked empty for `HR` — correct by RBAC but confusing. `SU` now shows `shouldShowWaitingForHr` banner, `MA` shows `showApprovalPanel` strictly at `MA` with a hint `mgr only · HR read-only` and `canApprove` hides the approve button for `HR`."
*   **ไฟล์:บรรทัด:** `leave-detail.component.html:42-46`, `leave-detail.component.html:88-92`, `leave-detail.component.ts:124`, `leave-detail.component.ts:179`, `leave-detail.component.ts:188`
*   **กับดักห้ามพูด:** "HR ควรกดอนุมัติที่ `MA` ได้" / "`SU` ให้ HR ตรวจได้" / "หน้าว่างปกติไม่ต้องแก้"
*   **วิธีแก้ตรงไปตรงมา:** คง `ts:188` `shouldShowWaitingForHr=(hr||mgr)&&SU` + `html:42` banner, คง `ts:179` `showApprovalPanel=MA && (...)` + `html:92` hint, P2 เพิ่ม `guardHrBlockedAtM()` toast กัน `HR` ยิง API ตรง

---

### Q60: 📎 Leave-form — `resubmit` + `hint 5 ไฟล์` + `queueOnly` ทำไมต้องแยกชัด? [ต่อ Q51]

*   **โค้ด:** `angular-ui/src/app/pages/leave-form/leave-form.component.html:118-119` hint `สูงสุด 5 ไฟล์`, `:121-126` `<app-upload-zone [queueOnly]="isResubmit" [uploadFn]="isResubmit?undefined:uploadFilesFn">`, `upload-zone.component.ts:25` `@Input() queueOnly`, `upload.middleware.js:62` `files:5`, `file.route.js:40` `upload.array('files',5)`
*   **คำถามไทย:** "ทำไมสร้างใหม่ `queueOnly=false` แต่แก้ส่งใหม่ `queueOnly=true` แล้ว hint บอก `5 ไฟล์` เกี่ยวอะไรกับ `multer` ครับ?"
*   **คำตอบไทยละเอียด:**
    *   **Q51 ต่อยอด:** `hint` เดิม `10 ไฟล์` drift กับ `upload-zone.ts:19 maxFiles=5` + `upload.middleware.js:62 files:5` + `file.route.js:40 array('files',5)` — P1 แก้ text-only ที่ `leave-form.html:118-119` เป็น `สูงสุด 5 ไฟล์ ... รองรับ .pdf .jpg .png .docx` ตรง 3 ชั้นแล้ว
    *   **2 โหมดแยกชัด:** `html:125` `[queueOnly]="isResubmit"` — `isResubmit=false` (ยื่นใหม่) `queueOnly=false` → ยังไม่มี `leaveId` ต้อง `createLeave` ก่อนแล้ว `uploadZone.uploadAll()` ทีเดียว; `isResubmit=true` (ส่งกลับ `SU+Y`) มี `resubmitId` แต่บังคับ `queueOnly=true` ให้ queue ไว้แล้ว `handleResubmit` อัปพร้อม `resubmitLeave` — ปุ่ม `อัปโหลดไฟล์` ที่ `upload-zone.html:74` ซ่อนแล้วโชว์ `hint จะถูกส่งพร้อมยื่นคำขอ/ส่งคำขออีกครั้ง`
    *   **ทำไมต้อง `queueOnly`:** กัน `emp` กดอัปโหลดก่อนมี `id` แล้ว `upload-zone.ts:272` `if(!leaveId) toast จะถูกอัปโหลดเมื่อกดยื่น` — รวมศูนย์อัปโหลดจุดเดียว `leave-form.ts:169` `handleCreate` และ `:223` `handleResubmit`
    *   **UX เสริม P1.5:** `leave-form.html:81` `reason *` + `placeholder ระบุเหตุผลการลา` + `html:88` `[class.input-error]` + `aria-invalid` + `html:93-94` `hint อย่างน้อย 5 ตัวอักษร / error ต้องมี≥5` — ไม่ต้องรอ backend `400` ค่อยรู้
*   **Answer EN:** "Hint drift `10 vs 5` is fixed to `5` in four places; `queueOnly=isResubmit` queues files until `create/resubmit` so uploads happen once with a valid `leaveId`. New leaves `queueOnly=false` (no id yet), resubmits `queueOnly=true` (deferred to `resubmitLeave`), plus `reason` validation at `html:81`. "
*   **ไฟล์:บรรทัด:** `leave-form.component.html:118-119`, `leave-form.component.html:121-126`, `upload-zone.component.ts:25`, `upload-zone.component.html:74-82`, `upload.middleware.js:62`, `file.route.js:40`
*   **กับดักห้ามพูด:** "สร้างใหม่ก็อัปทันทีได้" / "`queueOnly` คือห้ามอัปโหลด" / "hint 10 ถูก 5 ผิด"
*   **วิธีแก้ตรงไปตรงมา:** คง `html:118-119` `5 ไฟล์` text-only, คง `[queueOnly]="isResubmit"` + `isResubmit?undefined:uploadFilesFn`, P2 สร้าง `shared/constants/upload.ts` `MAX_FILES=5` แล้ว `upload-zone/multer/hint` ใช้ `{{maxFiles}}` เดียวกัน

---

### Q61: 🎨 Polish SCSS — `timeline done เขียว` + `history mobile 600px` + `upload-zone` ทำไมต้อง unified?

*   **โค้ด:** `timeline.component.scss:9-14` `.pending #ffffff/#C4C4C4` `.current #0E3362` `.done #2e7d32` + `dashboard.component.scss:6-9` `.sendback-badge/.actions-cell` + `leave-form.component.scss:285` `.field-hint` + `leave-history.component.scss:322` `.status-warning` + `upload-zone.component.scss:56` `.file-name ellipsis`
*   **คำถามไทย:** "ทำไม `done` บางหน้าเทา บางหน้าเขียว แล้วมือถือ `history` แตกครับ?"
*   **คำตอบไทยละเอียด:**
    *   **Timeline unified เขียว:** `timeline.scss:13-14` เดิม `done` เทา `#d9dee7` เหมือน `pending` ดูไม่ออกว่าเสร็จ — P1.5 แก้ `done dot/line #2e7d32` เขียวเข้ม + `opacity .35` + `title ดำเขียว` ที่ `:21` ตรงกับ `stepper.scss:21` `done #2e7d32` — `pending` ตั้งใจต่าง: `pending dot ขาว #ffffff ขอบ #C4C4C4` + `line #e5e9f0` อ่านง่ายบนพื้นขาว
    *   **History mobile 600px:** `leave-history.scss:356` `@media(max-width:600px)` `history-page margin 16px` + `page-header flex-direction:column` + `balance-card flex:1 1 100%` — เดิม `flex 180px` ล้นจอ 5 นิ้ว
    *   **Upload / Form / Dashboard polish 15px:** `dashboard.scss:6` `sendback-badge 11px #fff3e0/#e65100` + `upload-zone.scss:56` `file-name flex:1 min-width:0 ellipsis nowrap` + `leave-form.scss:285` `.field-hint 12px #666` + `leave-detail.scss` `.panel-hint 12px #6b7280`

| ไฟล์ | แก้อะไร | ค่า |
|---|---|---|
| `timeline.scss:9` | `pending` | `dot ขาว #ffffff ขอบ #C4C4C4 / line #e5e9f0` |
| `timeline.scss:13` | `done` | `dot #2e7d32 line #2e7d32 title #2e7d32` |
| `history.scss:322` | `MA warning` | `#fff8e1/#f57f17 border #ffe082` |
| `history.scss:356` | mobile | `600px column + card 100%` |
| `dashboard.scss:6` | badge | `#fff3e0/#ffcc80/#e65100 11px` |
*   **Answer EN:** "Drift between `done` states is unified to green `#2e7d32` in both stepper and timeline; `pending` stays white/grey for timeline readability; `history` gets a `600px` responsive breakpoint and `dashboard/form/upload-zone` get `11-12px` hint/badge polish with ellipsis."
*   **ไฟล์:บรรทัด:** `timeline.component.scss:9-14`, `leave-history.component.scss:322`, `leave-history.component.scss:356`, `dashboard.component.scss:6-9`, `upload-zone.component.scss:56`, `leave-form.component.scss:285`
*   **กับดักห้ามพูด:** "`done` ควรเทาเหมือนเดิม" / "responsive ไม่สำคัญ" / "`ellipsis` ไม่ต้องมี `min-width:0`"
*   **วิธีแก้ตรงไปตรงมา:** คง `timeline.scss:13` `done #2e7d32`, `history.scss:356` `@media 600px`, `upload-zone.scss:56` `min-width:0 + ellipsis`, P2 ทำ `design-tokens.scss` `$done:#2e7d32; $pending:#C4C4C4; $current:#0E3362` แล้ว import 5 ไฟล์

---

### Q62: 🔀 File Stage — ทำไม `SU→DC` ต้องแนบไฟล์ก่อน ถึงตรวจ `DC→MA` ได้? [Stage ตรง]

*   **โค้ด:** `leave-api/src/routes/file.route.js:61` block `AP/RJ/CX` + `:66` block `emp ที่ MA` + `:83` `HR/MGR อัปได้เฉพาะ DC` + `:90` `emp อัปได้ SU/DC(+SB)` + `:115` `auto SU→DC` + `document.service.js:15` `pretempPass DC→MA`
*   **คำถามไทย:** "ทำไมลาป่วย 1 วันก็ต้องแนบไฟล์ก่อนถึง `DC` แล้ว `pretemp` ค่อยตรวจครับ?"
*   **คำตอบไทยละเอียด:**
    *   **บังคับแนบคือ gate:** `file.route.js:90-92` `allowedEmpStatuses=[SU,DC] || flag_send_back==='Y'` — `emp` อัปได้ `SU` และ `DC` (จนกว่า `pretempPass`) ถ้าไม่แนบ `SU` จะค้าง `รอพนักงาน` ที่ `Q59` — `file.route.js:115` `if(SU && emp) updateLeave→DC + addHistory DC` auto ข้าม `SU→DC` ทันทีที่แนบไฟล์แรก
    *   **ตรวจต้อง `DC` เท่านั้น:** `document.service.js:19` `if(status!=='DC') return error` + `file.route.js:83` `if(HR/MGR && status!==DC) 400 ต้องเป็น DC` — `DC→MA` ที่ `document.service:23` `updateLeave MA + verification + history` — แยก **stage ชัด** `emp ส่งไฟล์` vs `HR/mgr ตรวจ`
    *   **กันข้ามขั้นตอน:** `file.route.js:61` `AP/RJ/CX` ห้ามแนบ, `:66` `emp ห้ามแนบที่ MA` `รอหัวหน้าอนุมัติ ไม่สามารถแนบไฟล์ได้`, `:70-73` block `VC` legacy — `flow` จึงเป็น `SU --แนบ→ DC --pretempPass→ MA --approve→ AP` เท่านั้น (ดู `status.js:38-43`)
*   **Answer EN:** "Upload is the gate `SU→DC`; `pretempPass` only accepts `DC` and transitions `DC→MA`. `file.route` enforces `emp: SU/DC`, `HR/mgr: DC only`, blocks `AP/RJ/CX` and `emp at MA`, and auto-transitions `SU→DC` on first `emp` upload — a straight two-stage pipeline `SU→DC→MA`."
*   **ไฟล์:บรรทัด:** `file.route.js:61`, `file.route.js:66`, `file.route.js:83`, `file.route.js:90`, `file.route.js:115`, `document.service.js:15-26`
*   **กับดักห้ามพูด:** "`emp` อัปที่ `MA` ได้" / "`DC` ไม่ต้องมีไฟล์ก็ตรวจได้" / "`SU→MA` ข้ามได้"
*   **วิธีแก้ตรงไปตรงมา:** คง `file.route:61,66,83,90,115` + `document.service:19` ไว้, P2 เพิ่ม `Config leave-attachment.js` ให้ `ลาป่วย 1 วัน` ไม่ต้องแนบตาม `Q5` — `if(type==='sick' && days<=1) SU→DC ได้เลยไม่ต้องไฟล์`

---

### Q63: 🗺️ สรุป P1.5 + Site Map + `1 fix = 1 commit` — ท่องภาพรวมยังไง?

*   **โค้ด:** `angular-ui/src/app/app-routing.module.ts:12` 6 routes, `shared 6 components` `stepper/timeline/bell/upload-zone/status-badge/toast`, `status 7 codes` `SU/DC/MA/AP/SB/CX/RJ` `status.js:27-36` + `FLOW` `status.js:38-43`, `1 fix=1 commit` checklist
*   **คำถามไทย:** "พี่ขอ site map 1 นาที + สรุป P1.5 และวิธี commit แบบ TISCO ชอบครับ?"
*   **คำตอบไทยละเอียด:**
    *   **Site Map 6 เส้น:** `app-routing.module.ts:12` `login → dashboard(AuthGuard) → leave/new(RoleGuard emp) → leave/:id/edit(RoleGuard emp) → leave/:id(detail) → my-leaves/history` + `''/** → /login` — `title` ตาม role `dashboard.ts:52` `emp:ของฉัน / mgr:รอฉันตรวจ / hr:ทั้งหมด` + `DxDataGrid 10/20/50` + `Stepper 4 ขั้น SU DC MA + Final AP/RJ/CX`

| ชั้น | ไฟล์ | โค้ด |
|---|---|---|
| Routes 6 | `app-routing.module.ts:12` | `login/dashboard/leave/new/leave/:id/edit/leave/:id/history` |
| Shared 6 | `app.module.ts:17` | `Stepper Timeline Bell UploadZone StatusBadge Toast + Jwt/Error Interceptor` |
| API | `environment.ts:13` | `/api (proxy localhost:3000) vs prod https://leave-approval-api.vercel.app/api` |
| สี | `styles.scss:50` | `SUส้ม #fff3e0 DCฟ้า #e3f2fd MAเหลือง #fff8e1 APเขียว #e8f5e9 RJ/CXแดง #fce4ec` |

    *   **สถานะ 7 รหัส (VC รวม DC แล้ว):** `SU ยื่น → DC รอตรวจเอกสาร → MA รอหัวหน้าอนุมัติ → AP อนุมัติ / SB ส่งกลับ→SU+Y / CX ยกเลิก(ได้เฉพาะ SU) / RJ ไม่อนุมัติ(DC/MA)` — `FLOW` `SU[DC,CX] DC[MA,SU,RJ] MA[AP,SB,RJ]` ที่ `status.js:38`
    *   **1 fix = 1 commit (TISCO style):** `prefix(ขอบเขต): ไทยสั้นๆ — ทำไม` + body `ไฟล์:บรรทัด` — ตัวอย่าง `fix(dashboard): เพิ่ม badge ส่งกลับ + ปุ่มแก้ไขเฉพาะเจ้าของ — ลด emp งง` / `fix(security): ล็อค debug ด้วย admin + ลบ hardcode fix-2026-leave — ปิด P0` / `fix(detail): แยก banner SU vs panel MA + hint HR read-only — แก้หน้าว่าง`
*   **Answer EN:** "Site is 6 routes (`login/dashboard/new/edit/detail/history`) with 6 shared components, 7 status codes (`SU/DC/MA/AP/SB/CX/RJ`, `VC` merged) and 4-step flow; P1.5 polished badge/resubmit, hardened debug, split `SU/MA` panels, fixed `5-file` hint, unified SCSS, and enforced straight `SU→DC→MA` stage — each as one Thai commit `prefix(scope): short Thai — why` with `file:line` body."
*   **ไฟล์:บรรทัด:** `app-routing.module.ts:12`, `status.js:27-36`, `status.js:38-43`, `dashboard.component.html:52,60`, `debug.route.js:8-10,100`, `leave-detail.html:42,88`, `leave-form.html:118`
*   **กับดักห้ามพูด:** "`5 สถานะ`" / "`VC` ยังแยก" / "รวมหลาย fix ใน commit เดียวได้"
*   **วิธีแก้ตรงไปตรงมา:** ท่อง `6 routes + 6 shared + 7 codes + 4 ขั้น` + `P1.5 7 ข้อ` + `commit ไทย 1 fix=1 commit` ก่อนเข้าห้องสัมภาษณ์

---

> **สรุป Q57-Q63 (P1.5 7 Fixes):** `Q57` **Dashboard** badge `sendback-badge #fff3e0/#e65100` + `btn-resubmit #e65100` เฉพาะ `isOwner` ลัด `/edit` — ลด `emp` งง, `Q58` **Security P0** `debug auth+admin` + ลบ `fix-2026-leave` เหลือ `FIX_KEY` env เดียว, `Q59` **Detail** แยก `SU banner รอพนักงาน` vs `MA panel รอหัวหน้า + hint HR read-only` แก้หน้าว่าง, `Q60` **Form** `hint 5 ไฟล์` ตรง `multer 5` + `queueOnly=isResubmit` + `reason ≥5` inline, `Q61` **Polish** `timeline done #2e7d32` + `history 600px` + `dashboard/upload/leave-form SCSS unified`, `Q62` **File Stage** `emp:SU/DC → auto DC` + `HR/mgr:DC only → MA` ตรง `SU→DC→MA→AP`, `Q63` **Sitemap** `6 routes + 6 shared + 7 codes + 4 ขั้น + 1 fix=1 commit ไทย` — พร้อมตอบกรรมการ 28 ส.ค. 2026

**ยืนยัน Q57-Q63 28 ส.ค. 2026:** `dashboard.component.html:52,60`, `dashboard.component.ts:58`, `dashboard.component.scss:6-9`, `debug.route.js:8-10,100`, `leave-detail.html:42-46,88-92`, `leave-detail.ts:124,179,188`, `leave-form.html:118-119,121-126`, `leave-form.scss:285`, `timeline.component.scss:9-14`, `leave-history.component.scss:322,356`, `upload-zone.component.html:74`, `upload-zone.scss:56`, `file.route.js:61,66,83,90,115`, `document.service.js:15`, `app-routing.module.ts:12`, `status.js:27,38` | **P2 next:** `MAX_FILES constant`, `design-tokens.scss`, `firstValueFrom`, `rpc FOR UPDATE`, `RLS enable`, `notifications Realtime`

