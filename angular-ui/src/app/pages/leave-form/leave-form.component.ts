import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
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
  resubmitId: number | null = null;
  tempLeaveId: number | null = null;
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
  get uploadLeaveId(): number {
    if (this.isResubmit && this.resubmitId !== null) {
      return this.resubmitId;
    }
    return this.tempLeaveId || 0;
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
      this.resubmitId = +id;
      this.tempLeaveId = this.resubmitId;
      this.showUploadSection = true;
      this.leaveService.getLeave(this.resubmitId).pipe(
        takeUntil(this.destroy$)
      ).subscribe(l => {
        this.leaveType = l.leave_type;
        this.startDate = l.start_date;
        this.endDate = l.end_date;
        this.reason = l.reason;
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

    if (this.endDate < this.startDate) {
      this.msg = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น';
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
   * 5. Navigate to dashboard after a short delay
   */
  private handleCreate(data: CreateLeaveRequest): void {
    this.leaveService.createLeave(data).pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: (res) => {
        this.tempLeaveId = res.id;
        this.showUploadSection = true;
        this.msg = 'ส่งคำขอลาเรียบร้อย ✅';
        this.isError = false;

        const hasPending = this.uploadZone?.pendingFiles?.length > 0;
        const navigate = () => setTimeout(
          () => this.router.navigate(['/dashboard']),
          this.NAVIGATION_DELAY_MS
        );

        if (hasPending) {
          this.uploadZone.uploadAll().then(navigate).catch(navigate);
        } else {
          navigate();
        }
      },
      error: (err) => {
        this.msg = err.error?.message || 'เกิดข้อผิดพลาด';
        this.isError = true;
      },
    });
  }

  /**
   * Handles the resubmit flow:
   * 1. POST the resubmit data
   * 2. On success, upload any new pending files
   * 3. Keep the user on the page to see the success message
   */
  private handleResubmit(data: CreateLeaveRequest): void {
    const id = this.resubmitId;
    if (id === null) return;

    this.leaveService.resubmitLeave(id, data).pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: () => {
        this.msg = 'ส่งคำขออีกครั้งเรียบร้อย ✅';
        this.isError = false;

        if (this.uploadZone?.pendingFiles?.length > 0) {
          this.uploadZone.uploadAll().catch(() => {});
        }
      },
      error: (err) => {
        this.msg = err.error?.message || 'เกิดข้อผิดพลาด';
        this.isError = true;
      },
    });
  }
}
