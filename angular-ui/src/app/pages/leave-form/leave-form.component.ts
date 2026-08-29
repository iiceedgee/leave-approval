import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { UploadZoneComponent } from '../../shared/upload-zone/upload-zone.component';
import { CreateLeaveRequest } from '../../models/leave.model';

@Component({
  standalone: false,
  selector: 'app-leave-form',
  templateUrl: './leave-form.component.html',
  styleUrls: ['./leave-form.component.scss']
})
export class LeaveFormComponent implements OnInit, OnDestroy {
  @ViewChild('uploadZone') uploadZone!: UploadZoneComponent;

  isResubmit = false;
  resubmitId: string | null = null;
  resubmitNo: string | null = null;
  tempLeaveId: string | null = null;
  isSubmitting = false;
  showUploadSection = false;

  leaveType = '';
  startDate = '';
  endDate = '';
  reason = '';
  msg = '';
  isError = false;
  user = this.auth.getUser();

  readonly leaveTypes = ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน', 'ลาคลอด', 'ลาอุปสมบท'];
  readonly NAVIGATION_DELAY_MS = 1500;

  private destroy$ = new Subject<void>();

  /**
   * Upload function that references the dynamically assigned tempLeaveId.
   * After a new leave is created, tempLeaveId is set to the server-assigned ID,
   * so pending files are uploaded against the correct leave record.
   */
  uploadFilesFn = (files: File[]) => {
    if (this.tempLeaveId === null) {
      throw new Error('tempLeaveId is not set');
    }
    return this.leaveService.uploadFile(this.tempLeaveId, files);
  };

  /** Computed leave ID to pass to the upload-zone component. */
  get uploadLeaveId(): string {
    if (this.isResubmit && this.resubmitId !== null) {
      return this.resubmitId;
    }
    return this.tempLeaveId || '';
  }

  constructor(
    private auth: AuthService,
    private leaveService: LeaveService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isResubmit = true;
      this.resubmitId = id;
      this.tempLeaveId = this.resubmitId;
      this.showUploadSection = true;
      this.leaveService.getLeave(this.resubmitId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: l => {
          if (!l || !l.id) {
            this.msg = 'ไม่พบคำขอลา';
            this.isError = true;
            return;
          }
          this.resubmitNo = (l as any).request_no || null;
          this.leaveType = l.leave_type;
          this.startDate = l.start_date;
          this.endDate = l.end_date;
          this.reason = l.reason;
        },
        error: (err) => {
          this.msg = err?.error?.message || 'โหลดข้อมูลล้มเหลว';
          this.isError = true;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Toggles the collapsible file-upload section. */
  toggleUpload(): void {
    this.showUploadSection = !this.showUploadSection;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Validates the form and dispatches to create or resubmit handlers. */
  submit(): void {
    this.msg = '';
    this.isError = false;

    if (!this.leaveType || !this.startDate || !this.endDate) {
      this.msg = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      this.isError = true;
      return;
    }

    const s = new Date(this.startDate);
    const e = new Date(this.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      this.msg = 'รูปแบบวันที่ไม่ถูกต้อง';
      this.isError = true;
      return;
    }
    if (e < s) {
      this.msg = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น';
      this.isError = true;
      return;
    }
    if (!this.reason || this.reason.trim().length < 5) {
      this.msg = 'เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร';
      this.isError = true;
      return;
    }
    if (!this.isResubmit && (!this.uploadZone || this.uploadZone.pendingFiles.length === 0)) {
      this.msg = 'กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์';
      this.isError = true;
      return;
    }

    const data: CreateLeaveRequest = {
      leave_type: this.leaveType,
      start_date: this.startDate,
      end_date: this.endDate,
      reason: this.reason,
    };

    this.isSubmitting = true;

    if (this.isResubmit) {
      this.handleResubmit(data);
    } else {
      this.handleCreate(data);
    }
  }

  /**
   * Handles the create-leave flow:
   * 1. POST the leave data
   * 2. On success, set tempLeaveId so the upload zone uses the correct leave ID
   * 3. Auto-expand the upload section
   * 4. Upload any pending files the user may have queued
   * 5. Navigate to dashboard after a short delay (only if upload succeeds)
   */
  private handleCreate(data: CreateLeaveRequest): void {
    this.leaveService.createLeave(data).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async (res) => {
        this.tempLeaveId = res.id;
        this.showUploadSection = true;
        // Fix race: Input [leaveId] ยังเป็น '' ตอน detectChanges ยังไม่ทัน — sync ตรงๆก่อน uploadAll
        if (this.uploadZone) (this.uploadZone as any).leaveId = this.tempLeaveId;

        const hasPending = this.uploadZone?.pendingFiles?.length > 0;

        if (hasPending) {
          try {
            await this.uploadZone.uploadAll();
            this.msg = 'ส่งคำขอลาเรียบร้อย ✅';
            this.isError = false;
            this.isSubmitting = false;
            setTimeout(() => this.router.navigate(['/dashboard']), this.NAVIGATION_DELAY_MS);
          } catch (err: any) {
            this.isSubmitting = false;
            this.msg = err?.error?.message || err?.message || 'อัปโหลดไฟล์ล้มเหลว';
            this.isError = true;
          }
        } else {
          this.msg = 'ส่งคำขอลาเรียบร้อย ✅';
          this.isError = false;
          this.isSubmitting = false;
          setTimeout(() => this.router.navigate(['/dashboard']), this.NAVIGATION_DELAY_MS);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.msg = err.error?.message || 'เกิดข้อผิดพลาด';
        this.isError = true;
      },
    });
  }

  /**
   * Handles the resubmit flow (atomic):
   * ส่งข้อมูล + ไฟล์แนบพร้อมกันใน request เดียว (Flame: multipart) กัน flag ล้างก่อนอัปโหลด
   * เดิมแยก 2 request: POST /resubmit (JSON) แล้วค่อย POST /files -> ถ้าไฟล์พังจะค้าง DC,N ส่งซ้ำไม่ได้
   */
  private handleResubmit(data: CreateLeaveRequest): void {
    const id = this.resubmitId;
    if (id === null) {
      this.isSubmitting = false;
      this.msg = 'ไม่พบรหัสคำขอลา';
      this.isError = true;
      return;
    }

    const files = this.uploadZone?.pendingFiles ? [...this.uploadZone.pendingFiles] : [];

    this.leaveService.resubmitLeave(id, data, files).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // สำเร็จแบบ atomic — เคลียร์ pending และโหลดไฟล์ใหม่
        if (files.length > 0 && this.uploadZone) {
          this.uploadZone.pendingFiles = [];
          this.uploadZone.loadExistingFiles();
        }
        this.msg = 'ส่งคำขออีกครั้งเรียบร้อย ✅';
        this.isError = false;
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/dashboard']), this.NAVIGATION_DELAY_MS);
      },
      error: (err) => {
        this.isSubmitting = false;
        // 409 = โดน tab อื่นชิงไปแล้ว — ให้รีเฟรชแทนโชว์ 400 งง
        if (err.status === 409) {
          this.msg = err.error?.message || 'คำขอนี้ถูกส่งไปแล้ว กำลังรีเฟรช';
          this.isError = true;
          setTimeout(() => this.router.navigate(['/dashboard']), 1200);
        } else {
          this.msg = err.error?.message || err?.message || 'เกิดข้อผิดพลาด';
          this.isError = true;
        }
      },
    });
  }
}
