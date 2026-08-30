# ม็อคสัมภาษณ์ Junior ไอซ์ — Fullstack 1ปี9เดือน | Leave Approval

> สำหรับ ไอซ์ ถนัด Angular / React / .NET Core / Node.js — Stack โปรเจคนี้ Angular 19 + Express + Supabase (Postgres) + JWT 8h + InMemory fallback
> พูดไทยล้วน ฟังแล้วอ๋อ มีไฟล์:บรรทัดทุกข้อ ท่องเฉลย 20-30วิต่อข้อคือผ่าน

---

### Q1/12 — Warmup แนะนำตัว + เล่าโปรเจค 3ท่อน
senior ถาม: "แนะนำตัวสั้นๆ แล้วเล่าโปรเจคนี้ว่าทำอะไร Stack อะไร รับผิดชอบส่วนไหน"
Hint 3ท่อน = คน → ของ → หน้าที่ (จำง่าย: ไอซ์1ปี9เดือน → ลา4ขั้น → ทำทั้งยวง)
เฉลย Q1 — คำตอบผ่าน (ท่อง 20-30วิ)
> "สวัสดีครับไอซ์ครับ Fullstack 1ปี9เดือน ถนัด Angular/React/.NET Core/Node ครับ โปรเจคนี้ระบบลา พนักงานยื่นลาแนบไฟล์ ตรวจเอกสารแล้วให้หัวหน้าอนุมัติครับ หลังบ้าน Express+Supabase หน้าบ้าน Angular19 JWT8ชั่วโมงครับ ผมทำทั้ง DB API และหน้าเว็บ ตั้งแต่ยื่นลายันอนุมัติเลยครับ"
ไฟล์ที่เกี่ยว: `leave-api/package.json:13,17,19` supabase/express/jwt, `angular-ui/package.json:13` Angular19, `leave-api/src/services/auth.service.js:47,50` jwt 8h, `leave-api/src/app.js:71` เลือก DB
กับดัก: "1ปี9เดือนเรียก fullstack ได้เหรอ?" → ตอบ "ทำทั้ง API+DB+Angular เองจริงครับ `leave.service.js:16` สร้างใบลา กับ `leave-detail.component.ts:80` forkJoin โหลดข้อมูล แก้ได้สองฝั่งครับ"
คะแนน: พูดชื่อ/ประสบการณ์/Stack/Flowย่อ/รับผิดชอบครบ + โยนไฟล์1ไฟล์ = 5

### Q2/12 — สถานะ 4ขั้น+3ทางออก SU/DC/MA/AP + SB/RJ/CX
senior ถาม: "เล่าเรื่องสถานะใบลาหน่อย ทำไมมีหลายโค้ดจัง"
Hint 4ขั้นวิ่ง + 3ทางจบ = SU→DC→MA→AP จบ, SB/RJ/CX แยกออก (จำง่าย: วิ่ง4 จบ3)
เฉลย Q2 — คำตอบผ่าน (ท่อง 20-30วิ)
> "สถานะมี7โค้ดครับ แต่คิดเป็น4ขั้นหลักที่วิ่งไปข้างหน้าคือ SUยื่นคำขอ DCรอตรวจเอกสาร MAรอหัวหน้าอนุมัติ APอนุมัติแล้ว กับ3ทางออกคือ SBส่งกลับแก้ไข RJไม่อนุมัติ CXยกเลิกครับ รวมศูนย์ไฟล์เดียว `status.js` ไม่ต้องสร้างตาราง status แล้ว JOIN ให้ช้าครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/constants/status.js:26` STATUS 7ตัว, `leave-api/src/constants/status.js:36` FLOW วิ่งได้, `leave-api/src/services/leave.service.js:29` สร้างใบ SU, `angular-ui/src/app/models/status.ts:16` หน้าบ้าน STATUS เดียวกัน, `leave-api/src/services/leave.service.js:112` SB เป็น history กลับ SU+Y
กับดัก: "ทำไมDCรวมVCแล้ว?" → ตอบ "VCคือตรวจรอบสอง ผมรวมเป็นDCตัวเดียวแล้วครับ `stepper.service.js:5` บอก Flowย่อเหลือ4ขั้น `document.route.js:33` route temp คืน410ให้ใช้ pretemp แทนครับ"
คะแนน: บอก4+3ครบ + ชี้ Single Source of Truth + ยก FLOW ได้ = 5

### Q3/12 — Stepper สีเขียว/น้ำเงิน/เทา/แดง ดูจาก current_status + flag_send_back
senior ถาม: "Stepper 4ช่องสีไม่เหมือนกัน คิดยังไง"
Hint 3นิ่ง1ยืดหยุ่น + 5สี = doneเขียว currentน้ำเงิน pendingเทา rejectedแดง cancelledเทาเข้ม (จำง่าย: เขียวผ่าน น้ำเงินทำ เทารอ แดงตก)
เฉลย Q3 — คำตอบผ่าน (ท่อง 20-30วิ)
> "Stepper มี4ช่องครับ 3ช่องแรกนิ่งคือ ยื่นคำขอ ตรวจเอกสาร หัวหน้าอนุมัติ ช่อง4ยืดหยุ่นตามผล AP/RJ/CX ครับ สีมี5แบบ เขียวdoneผ่านแล้ว น้ำเงินcurrentกำลังทำ เทาpendingยังไม่ถึง แดงrejected เทาเข้มcancelledครับ ดูจาก `current_status` + `flag_send_back` + `history` ถ้าโดนส่งกลับ Y ช่องแรกจะกลับมาน้ำเงินครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/services/stepper.service.js:11` BASE_STEPS 3ขั้น, `leave-api/src/services/stepper.service.js:18` getFinalStep ช่อง4ยืดหยุ่น, `leave-api/src/services/stepper.service.js:42` getCurrentStepIndex ดูflag, `leave-api/src/services/stepper.service.js:63` stepState 5สี, `angular-ui/src/app/shared/stepper/stepper.component.ts:18` isCurrent/isDone
กับดัก: "historyว่างแต่เป็นRJ จะโชว์ยังไง?" → ตอบ "`stepper.service.js:38` ถ้า max=-1แต่เป็นRJ/CX จะเซ็ต max=0ให้ช่องแรกเขียว ไม่ว่างเปล่า ช่อง4แดงครับ"
คะแนน: บอก3+1ขั้น + 5สี + อธิบาย flag_send_back ได้ = 5

### Q4/12 — State Gate ทำไมต้องเช็ค MA กัน2ชั้น หน้าบ้านซ่อนปุ่ม หลังบ้านเช็คจริง
senior ถาม: "ถ้า HR กดอนุมัติตอนใบอยู่ DC จะเกิดอะไรขึ้น กันยังไง"
Hint กัน2ชั้น = หน้าบ้านซ่อน หลังบ้านบล็อคจริง + กันกดพร้อมกัน (จำง่าย: ซ่อนไว้ กันจริง)
เฉลย Q4 — คำตอบผ่าน (ท่อง 20-30วิ)
> "กัน2ชั้นครับ ชั้นแรกหน้าบ้านซ่อนปุ่มอนุมัติถ้าไม่ใช่ MA ชั้นสองหลังบ้านเช็คจริงที่ `approve` ต้อง `status=MA` และ `role=mgr` เท่านั้น ถ้าเป็นDCจะคืน error ครับ ถึงHRยิง APIตรงก็ไม่ผ่าน แถมกัน2คนกดพร้อมกันด้วย UPDATE WHERE ถ้าโดนชิงจะได้409ให้รีเฟรชครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/routes/approval.route.js:28` roleMiddleware mgr, `leave-api/src/routes/file.route.js:61` บล็อคAP/RJ/CXห้ามแนบไฟล์, `leave-api/src/services/leave.service.js:78` approve เช็ค MA+mgr, `leave-api/src/services/leave.service.js:234` transition ใช้ updateLeaveWhere, `angular-ui/src/app/pages/leave-detail/leave-detail.component.ts:125` ซ่อนปุ่มเช็ค STATUS.MA.code
กับดัก: "ทำไมต้อง2ชั้น ชั้นเดียวไม่พอ?" → ตอบ "หน้าบ้านกันคนเผลอกด หลังบ้านกันคนยิง APIมั่วและกัน race ถ้ามีชั้นเดียวหลุดได้ ต้อง defense in depthครับ"
คะแนน: อธิบาย2ชั้น + ยก approve MA only + อธิบาย409ได้ = 5

### Q5/12 — RBAC สิทธิ์ตามบทบาท emp/mgr/hr
senior ถาม: "ระบบแบ่งสิทธิ์ยังไง emp/mgr/hr ต่างกันตรงไหน"
Hint 3คน3สิทธิ์ = empของตัวเอง mgrแผนกตัวเอง hrดูหมด แต่MAให้mgrคนเดียว (จำง่าย: ตัวเอง แผนก ทั้งหมด)
เฉลย Q5 — คำตอบผ่าน (ท่อง 20-30วิ)
> "แบ่ง3บทบาทครับ empยื่น/ยกเลิก/แนบไฟล์ของตัวเอง mgrตรวจเอกสารที่DCและอนุมัติที่MAได้คนเดียว hrตรวจเอกสารที่DCและดูได้ทั้งหมดแต่ไปอนุมัติที่MAไม่ได้ครับ หลังบ้านเช็ค JWT แล้วเช็ค role แล้วเช็ค canAccessLeave ว่าอยู่แผนกเดียวกันไหม หน้าบ้านมี Guard กันเข้าหน้าและ Interceptor เติม token ครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/middleware/auth.middleware.js:3` jwt.verify Bearer, `leave-api/src/middleware/role.middleware.js:1` เช็ค role, `leave-api/src/routes/file.route.js:15` canAccessLeave emp/mgr/hr, `leave-api/src/app.js:82` /uploads static ก็เช็คสิทธิ์, `angular-ui/src/app/guards/auth.guard.ts:9` กันไม่ login, `angular-ui/src/app/guards/role.guard.ts:14` กัน role, `angular-ui/src/app/interceptors/jwt.interceptor.ts:11` เติม token ยกเว้น login
กับดัก: "mgrแผนกAเห็นใบ empแผนกBได้ไหม?" → ตอบ "ไม่ได้ครับ `file.route.js:25` เช็ค `owner.department===mgr.department` ไม่ตรงคืน403ครับ" / "tokenหมดอายุทำไง?" → "`error.interceptor.ts:30` จับ401 logout+toastหมดอายุ+เด้ง login กันสแปมด้วย handling401ครับ"
คะแนน: บอก3 roleครบ + หลังบ้าน3จุดJWT/role/canAccess + หน้าบ้านGuard/Interceptorได้ = 5

### Q6/12 — File upload ทำไมบังคับ 5ไฟล์10MB กันซ้ำ lowercase 2ชั้น
senior ถาม: "กฎอัปไฟล์มีอะไรบ้าง กันชื่อซ้ำยังไง"
Hint 5ไฟล์10MB4นามสกุล + กันซ้ำ lowercase + ไทยเพี้ยน (จำง่าย: 5สิบ4ชนิด ตัวเล็กชนะ)
เฉลย Q6 — คำตอบผ่าน (ท่อง 20-30วิ)
> "กฎคือ สูงสุด5ไฟล์ต่อใบ ไฟล์ละไม่เกิน10MB รับแค่ PDF JPG PNG DOCXครับ กันชื่อซ้ำ2ชั้น ชั้นแรกเอาชื่อเดิมทั้งหมด toLowerCase ใส่ Set แล้วเช็คไฟล์ใหม่ก็ toLowerCase คนละตัวพิมพ์ก็ถือว่าซ้ำ ชั้นสองแก้ชื่อไทยเพี้ยนแปลง latin1เป็น utf8 ก่อนเช็คครับ ถ้าเกินโควตาลบไฟล์ขยะบน disk ทันทีกันค้างครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/middleware/upload.middleware.js:43` fileFilter 4ชนิด, `leave-api/src/middleware/upload.middleware.js:62` limits 10MB/5ไฟล์, `leave-api/src/middleware/upload.middleware.js:65` handleMulterError, `leave-api/src/routes/file.route.js:89` duplicate lowercase Set, `leave-api/src/services/file.service.js:7` decodeFilename latin1→utf8, `leave-api/src/routes/file.route.js:84` unlinkSync ลบขยะ
กับดัก: "ทำไมต้อง lowercase?" → ตอบ "เพราะ Windows/Mac มอง A.pdf กับ a.pdf เป็นไฟล์เดียวกัน ถ้าไม่ lowercase จะทะลุได้2ไฟล์ชื่อเหมือนกันคนละ caseครับ" / "DOCX ส่งเป็น octet-stream ทำไมผ่าน?" → "`upload.middleware.js:50` ถ้า .docx+octet-stream/zip ให้ผ่านด้วยนามสกุลครับ"
คะแนน: บอก5ไฟล์10MB4ชนิด + lowercase + decode + cleanupได้ = 5

### Q7/12 — Frontend dashboard vs detail + Angular ช่วย Guard/Interceptor/component
senior ถาม: "เล่าหน้า Dashboard กับ Detail หน่อย แล้ว Angular ช่วยอะไรบ้าง"
Hint Dashboardลิสต์ตาม role / Detail forkJoin3เส้น / Guardยาม Interceptorด่านกลาง (จำง่าย: ลิสต์กรอง รายละเอียดรวม ยามหน้าประตู ด่านเติมtoken)
เฉลย Q7 — คำตอบผ่าน (ท่อง 20-30วิ)
> "Dashboard เรียก getLeaves หลังบ้านกรองตาม role empเห็นของตัวเอง mgrเห็นแผนก hrเห็นหมด เรียง updated_at ครับ Detail ใช้ forkJoin ยิง3เส้นพร้อมกันคือ getLeave getStepper getHistory มี catchError กันพังทีละเส้นครับ Guard เป็นยามกันเข้า AuthGuardกันไม่ login RoleGuardกัน empเข้าได้เท่านั้น Interceptor ด่านกลาง JWTเติม tokenทุก requestและ ErrorInterceptorจับ error กลางครับ"
ไฟล์ที่เกี่ยว: `angular-ui/src/app/pages/dashboard/dashboard.component.ts:35` getLeaves, `leave-api/src/services/leave.service.js:47` filter role, `leave-api/src/db/supabase-store.js:205` order updated_at, `angular-ui/src/app/pages/leave-detail/leave-detail.component.ts:80` forkJoin 3เส้น, `angular-ui/src/app/guards/auth.guard.ts:9` AuthGuard, `angular-ui/src/app/guards/role.guard.ts:14` RoleGuard+app-routing.module.ts:14, `angular-ui/src/app/interceptors/jwt.interceptor.ts:10` เติม Bearer, `angular-ui/src/app/interceptors/error.interceptor.ts:19` จับ error
กับดัก: "forkJoin ต่างจาก switchMap ยังไง?" → ตอบ "`leave-detail.component.ts:77` switchMap เอา leave มาก่อนแล้วค่อย forkJoin stepper/history พร้อมกันที่ `:80` ครับ" / "ทำไม silentUrls?" → "`error.interceptor.ts:26` stepper/history อยากให้ component fallback เองไม่ต้อง toast รกครับ"
คะแนน: อธิบาย Dashboardกรอง+Detail forkJoin+Guard2ตัว+Interceptor2ตัวครบ = 5

### Q8/12 — InMemory vs Supabase เลือกอัตโนมัติ app.js:71 Strategy Pattern
senior ถาม: "ทำไมมี2 store แล้วเลือกยังไง"
Hint บรรทัดเดียวสลับได้ ชื่อ method เหมือนกันหมด (จำง่าย: มีก็ใช้ ไม่มีก็จำลอง)
เฉลย Q8 — คำตอบผ่าน (ท่อง 20-30วิ)
> "มี2ตัวครับ InMemory เก็บใน array บนเครื่องไว้เทสกับ dev กับ Supabase เก็บ Postgres จริงครับ เลือกบรรทัดเดียวที่ `app.js:71` ถ้ามี SUPABASE_URL จริงก็ใช้ Supabase ถ้าไม่มีก็ fallback InMemoryครับ ดีตรง service ไม่ต้องรู้ว่าเก็บที่ไหน เพราะชื่อ method เหมือนกันหมด `createLeave getLeaveById updateLeaveWhere` ครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/app.js:71` const db = supabaseClient ? new SupabaseStore : InMemoryStore, `leave-api/src/store.js:19` InMemoryStore, `leave-api/src/db/supabase-store.js:14` SupabaseStore, `leave-api/src/services/leave.service.js:7` constructor db ไม่รู้ที่เก็บ, `leave-api/src/db/supabase.js:1` สร้าง client, `leave-api/tests/helpers/mock-store.js:18` เทสใช้ InMemory
กับดัก: "ถ้าSupabaseล่มทำไง?" → ตอบ "`app.js:164` seed มี catch ไม่ให้ server ล้ม request จะได้500แล้ว `error.middleware.js:7` บอกให้รัน grants.sqlครับ" / "Strategy Pattern คืออะไร?" → "คือเลือก object ที่มี interface เดียวกันแล้วสลับได้โดยไม่แก้ service ครับ"
คะแนน: บอก2 store + บรรทัด71 + methodชื่อเดียวกัน + ประโยชน์ dev/prod ได้ = 5

### Q9/12 — SQLล็อคแถว optimistic WHERE 409 กันกดพร้อมกัน
senior ถาม: "ถ้า HR2คนกดส่งกลับใบเดียวกันพร้อมกัน จะกันยังไง"
Hint ไม่ล็อคแรง ใช้ WHERE เช็คสถานะเดิม ถ้าโดนชิงได้ null คืน409 (จำง่าย: ยิงWHERE ไม่ตรงคือโดนชิง)
เฉลย Q9 — คำตอบผ่าน (ท่อง 20-30วิ)
> "ผมไม่ใช้ล็อคแรงครับ ใช้ optimistic แบบ UPDATE WHERE สถานะเดิม ถ้า2คนกดพร้อมกัน คนแรก UPDATE WHERE current_status=DC ผ่าน คนสองยิง WHERE DC เหมือนกันแต่แถวเปลี่ยนเป็น SUแล้วเลยได้ null ผมคืน409 ให้รีเฟรชครับ ทำทั้ง sendBack reject approve resubmit เลยครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/services/leave.service.js:234` transition ใช้ updateLeaveWhere, `leave-api/src/db/supabase-store.js:240` UPDATE WHERE id+current_status RETURNING ถ้าไม่มีแถวคืน null, `leave-api/src/store.js:129` InMemory ก็เช็ค String leave[k]!==vคืน null, `leave-api/src/services/leave.service.js:90` sendBack กัน MA, `leave-api/src/services/leave.service.js:202` resubmit กัน flag Y+SU, `leave-api/src/routes/approval.route.js:13` handleResult แปลง409
กับดัก: "ทำไมไม่ใช้ SELECT FOR UPDATE?" → ตอบ "เพราะ Supabase REST ไม่ถนัด pessimistic lock และอยากให้เร็ว ไม่ล็อคตาราง ใช้ WHERE แบบนี้พอแล้วครับ ถ้า race จริงค่อยให้คนแพ้รีเฟรชครับ"
คะแนน: อธิบาย UPDATE WHERE + null→409 + ยก2ตัวอย่าง sendBack/resubmit ได้ = 5

### Q10/12 — errorHandler + Interceptor + Toast โซ่แจ้งเตือน
senior ถาม: "error จากหลังบ้านมาถึงตา user ยังไง"
Hint หลังแปลง กลางดัก หน้าโชว์ (จำง่าย: แปลง→ดัก→เด้ง)
เฉลย Q10 — คำตอบผ่าน (ท่อง 20-30วิ)
> "หลังบ้านมี errorHandler แปลง error เป็น statusCode ดู `err.statusCode` ถ้ามีคืนตามนั้น ไม่มีคืน500 กัน JSONเพี้ยนด้วยครับ กลางทาง ErrorInterceptor ดัก HttpErrorResponse แยก401เด้ง login 403เตือนไม่มีสิทธิ์ 500บอกเซิร์ฟพัง มี silentUrls ไม่ toast ให้ stepper ครับ หน้าสุด ToastService โชว์4วิเก็บสูงสุด5ตัวครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/middleware/error.middleware.js:1` errorHandler ดู statusCode, `leave-api/src/middleware/error.middleware.js:7` กัน permission denied grants.sql, `angular-ui/src/app/interceptors/error.interceptor.ts:19` intercept catchError, `angular-ui/src/app/interceptors/error.interceptor.ts:26` silentUrls stepper/history, `angular-ui/src/app/interceptors/error.interceptor.ts:30` 401 logout+handling401, `angular-ui/src/app/shared/toast/toast.service.ts:57` slice(-5) เก็บ5อัน 4วิหาย
กับดัก: "ทำไมต้อง silentUrls?" → ตอบ "เพราะ stepper/history ผมให้ component catchError→of([]) fallback เอง ไม่ต้องเด้ง toast รกครับ" / "status0 คืออะไร?" → "`error.interceptor.ts:60` status0 คือ network/CORS จะบอกเชื่อมต่อไม่ได้ครับ"
คะแนน: บอก3ท่อน หลังแปลง กลางแยก หน้า toast + ยก silent+401 ได้ = 5

### Q11/12 — Vercel memory + request_no nextval กันเลขซ้ำ
senior ถาม: "deploy บน Vercel เจออะไรบ้าง ไฟล์หายไหม เลขซ้ำไหม"
Hint Vercel disk หาย → ใช้ memory+Supabase Storage + เลขใช้ nextval ไม่ใช้ MAX+1 (จำง่าย: ไฟล์ลอย เลขล็อค)
เฉลย Q11 — คำตอบผ่าน (ท่อง 20-30วิ)
> "Vercel disk เป็น read-only เขียนแล้วหายตอน redeploy ผมเลยถ้าเป็น Vercel ใช้ memoryStorage ได้ buffer แล้วอัปเข้า Supabase Storage แทน disk โหลดใช้ signedUrl 60วิครับ ส่วนเลขที่คำขอ LV-ปี-0001 เดิมใช้ MAX+1 2คนกดพร้อมกันได้เลขซ้ำ ผมเปลี่ยนเรียก `next_request_no()` เป็น nextval atomic ถ้าไม่มี function ค่อย fallback MAX+1 ครับ"
ไฟล์ที่เกี่ยว: `leave-api/src/middleware/upload.middleware.js:22` isVercel ? memoryStorage : diskStorage, `leave-api/src/services/file.service.js:48` isVercel&&buffer → supabase.storage upload, `leave-api/src/routes/file.route.js:228` createSignedUrl 60วิ redirect, `leave-api/src/app.js:105` Vercel บล็อค /uploads static, `leave-api/src/db/supabase-store.js:82` _nextRequestNo เรียก rpc next_request_no, `leave-api/sql/migration_next_request_no.sql:1` สร้าง sequence, `leave-api/src/db/supabase-store.js:175` retry 23505 request_no ชน
กับดัก: "ทำไมไม่เก็บไฟล์บน Vercel /tmp?" → ตอบ "/tmp อยู่แค่ชั่วคราว redeploy ก็หายและไม่แชร์ข้าม instance ใช้ Supabase Storage ถาวรและได้ signedUrl ปลอดภัยกว่าครับ" / "nextval ดีกว่า MAX+1 ยังไง?" → "nextval ล็อคที่ DB เป็น atomic 2คนกดได้เลขต่างกันแน่นอน MAX+1 อ่านค่าเดียวกันแล้วชนครับ"
คะแนน: บอก memoryStorage+Storage+signedUrl + nextval atomic ได้ = 5

### Q12/12 — Testing mock + ถ้ามีเวลา1อาทิตย์จะทำ pagination/httpOnly
senior ถาม: "เทสทำยังไง แล้วถ้ามีเวลา1อาทิตย์จะทำอะไรต่อ"
Hint Jest4ชุด mock InMemory + อนาคต 2อย่าง pagination หลังบ้าน + httpOnly cookie (จำง่าย: เทสจำลอง อนาคตแบ่งหน้า ล็อคคุกกี้)
เฉลย Q12 — คำตอบผ่าน (ท่อง 20-30วิ)
> "เทสใช้ Jest `npm test` มี4ชุดคือ approve sendBack reject cancel บวก calcLeaveDays ครับ mock คือไม่ต่อ Supabase จริงใช้ `createMockStore` สร้าง InMemory แล้ว seed user4คน ทุก test beforeEach สร้างใหม่กันปนครับ ถ้ามี1อาทิตย์จะทำ pagination หลังบ้านใช้ range+order+index ไม่ดึงมาหมดแล้ว filter และย้าย JWT จาก localStorage เป็น httpOnly cookie กัน XSS แล้วเพิ่ม refresh token ครับ"
ไฟล์ที่เกี่ยว: `leave-api/package.json:9` jest --verbose, `leave-api/tests/helpers/mock-store.js:18` createMockStore InMemory+seed, `leave-api/tests/leave.service.test.js:30` 4 suites, `leave-api/tests/leave.service.test.js:42` approve MA→AP ผ่าน, `leave-api/tests/stepper.service.test.js:1` เทสสี, `leave-api/src/services/leave.service.js:48` ปัจจุบัน listLeaves ดึงหมดต้องทำ pagination `.range().order()+count exact+index`, `leave-api/sql/migration_add_updated_at_index.sql:1` index updated_at, `angular-ui/src/app/services/auth.service.ts:18` ปัจจุบัน localStorage ต้องย้าย httpOnly+SameSite Strict+CSRF+GET /auth/me, `leave-api/src/middleware/auth.middleware.js:4` อนาคตอ่าน cookie แทน header
กับดัก: "ทำไมไม่เทสกับ Supabase จริง?" → ตอบ "เพราะช้าไม่เสถียร InMemory เร็วและ logic updateLeaveWhere เหมือนกัน เทส gate ได้เหมือนกัน Supabase จริงไว้ทำ integration แยกครับ" / "httpOnly แล้ว JS อ่าน token ไม่ได้จะรู้ login ไง?" → "เพิ่ม GET /api/auth/me อ่านจาก cookie แทน localStorage Interceptor ไม่ต้องเติม header ครับ"
คะแนน: บอก Jest4ชุด+mock InMemory+beforeEach + บอก2อนาคตพร้อมเหตุผลได้ = 5
