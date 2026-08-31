# APPENDIX — CHEAT SHEET 1 หน้า — TISCO EEC OSS 15Q (ท่องก่อนเข้าห้อง 5 นาที)
> Appendix ของ `SHEET_INTERVIEW_TISCO_EEC.md` — สรุป 1 หน้าไว้ท่อง ไม่ใช่ชีทแยก

> **ไอซ์ | 1y9m | Angular/React/.NET/Node | ทำ: bell+email(เพิ่มเงื่อนไข) + consult(channel+overlap) + master + survey Q1-Q6 + bugfix**
> **ประโยคเซฟ:** "ระบบวางไว้แล้วครับ mail.ccib.go.th/SmtpClient/XPO ผมมารับช่วงเพิ่มเงื่อนไข+แก้บั๊ก พอไล่ flow ได้ครับ"

---

## 15Q — 30 วิ/ข้อ (พูดให้ตรงนี้ สอบผ่าน 92% Senior Verify)

**Q1 Master Cms vs EecMdm** — Cms* มากับ CMS เดิม (`CmsOrganizeController.cs:21`) / EecMdm* ทำใหม่ EEC (`EecMdmConsultTypeController.cs`) แยก bounded context

**Q2 Bell Polling 30วิ** — `header.component.ts:43 interval(30000)` → `EecTxnNotiController.cs:34 VIEW_READ_LIST` → `EecTxnNotiReadController.cs:22` / polling เพราะ officer น้อย deploy ง่ายกว่า SignalR

**Q3 Email Routing** — `EmailRecipientHelper.cs:10 IsTest` → `appsettings.json:131 MailRouting` (Y merge considerEmails:58 / N central:65) → `Resolve:42 (settings, productionRecipients, serviceType, considerEmails)` / `AppSetting.cs:69`

**Q4 Workflow Approve Y** — `WorkflowEmailRoutingHelper.cs:39 EvaluateApproveYRouting` → `isSpecificZoneCase 101/102/113` → `:120 ShouldSendProgressAssignReviewer`

**Q5 License EXP/RNW** — `LicenseNotificationService.cs:33 EXP (expire<=today)` vs `:160 RNW (30/15/7 วัน)` → `EmailService:2101/2130`

**Q6 Consult Flow** — `TxnRequestConsultController.cs:54 search` / status W/D/A/O/S/WC/C (`Constants.cs:34`) / Channel 1/2/3 (`Constants.cs:28`) / overlap 4 clauses `:441`

**Q7 Consult Email/Bell** — `updatedate:502` → noti citizen `:568` + officer `:577` / Channel 1/3 → `SendConsultChangeCitizenCh3:639` else `:607`

**Q8 Survey Q1-Q6** — `master-question-topic.component.ts:38 Q1-Q6` → `EecMdmQuestionTopicAssessmentController.cs:224` → 3 ตาราง SET/TOPIC/OPTION → `feedback-popup:84 GET answers/{code}` → `ElisInterface:365 HMAC`

**Q9 File 5 ไฟล์** — limit 5 + `toLowerCase()` กัน `Report.pdf == report.PDF`

**Q10 Citizen** — `feedback-popup:84` 4 แบบ radio/score/multi/text + `follow-up-consult` / บั๊ก HMAC expire

**Q11 Debug** — Reproduce→Log→Fix→Test / ex: bell badge ไม่ลดเพราะ cache `header:43` ไม่ refetch หลัง `NotiRead:22`

**Q12 async void** — `EmailService.cs:106 60+ async void` → exception กลืน + await ไม่ได้ → แก้ `async Task` + try/catch

**Q13 IDOR** — `TxnRequestConsultController:32 AllowAnonymous` ทับ `BetimesControllerBase:9 Authorize` → `GET:142` ไม่มี ownership check → ต้องเพิ่ม `where PERSONAL_ID==UserInfo`

**Q14 SQLi** — `$"CONSULT_DET_ID = {consultDetId}" :188` → เสี่ยงถ้า string → แก้ `CriteriaOperator.Parse("CONSULT_DET_ID = ?", id)`

**Q15 Pagination DOS** — `.Take(Length):131` ไม่มี cap → 100k จะ OOM → แก้ `Math.Min(Length??20, 100)`

---

## ตารางไฟล์:บรรทัด (จำ 20 ตัวนี้พอ)

| จำ | ไฟล์:บรรทัด |
|---|---|
| Cms | `CmsOrganizeController.cs:21` |
| EecMdm | `EecMdmConsultTypeController.cs:12` |
| Bell poll | `header.component.ts:43` 30000 |
| Bell API | `EecTxnNotiController.cs:34` |
| Bell read | `EecTxnNotiReadController.cs:22` |
| Email IsTest | `EmailRecipientHelper.cs:10` |
| Email 4params | `EmailRecipientHelper.cs:42` |
| Email merge | `EmailRecipientHelper.cs:58` Y |
| Email central | `EmailRecipientHelper.cs:65` N |
| MailRouting | `appsettings.json:131` |
| Workflow Y | `WorkflowEmailRoutingHelper.cs:39` |
| Workflow Should | `WorkflowEmailRoutingHelper.cs:120` |
| License EXP/RNW | `LicenseNotificationService.cs:33/160` |
| Consult search | `TxnRequestConsultController.cs:54` |
| Consult status | `Constants.cs:34` W/D/A/O/S |
| Channel | `Constants.cs:28` 1/2/3 |
| Overlap | `TxnRequestConsultController.cs:441` |
| Survey Q1-Q6 | `master-question-topic.component.ts:38` |
| Survey create | `EecMdmQuestionTopicAssessmentController.cs:224` |
| HMAC | `ElisInterfaceController.cs:365` |
| async void | `EmailService.cs:106` 60+ |
| IDOR | `TxnRequestConsultController.cs:32/142` |
| SQLi | `TxnRequestConsultController.cs:188` |
| Pagination | `TxnRequestConsultController.cs:131` |

---

## ตัวเลขต้องตอบให้ได้

- **30000** = polling ms
- **IsTest + 4params + considerEmails** = email 3 layer
- **101/102/113** = zone พิเศษ
- **W/D/A/O/S/WC/C** = 7 status
- **1/2/3** = Email/Conference/Office
- **4 clauses** = overlap `:441`
- **Q1-Q6** = 6 แบบ Google Form
- **5 files** = limit + lowercase
- **60+ async void** = EmailService:106
- **EXP/RNW + 30/15/7** = License
- **IDOR / SQLi / Take cap 100** = Security 3 ตัว

*พิมพ์ A4 1 หน้า — ท่อง 5 นาทีก่อนเข้าห้อง | grep ชื่อไฟล์ถ้าบรรทัดย้าย*
