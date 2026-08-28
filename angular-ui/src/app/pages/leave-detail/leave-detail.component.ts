import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { ToastService } from '../../shared/toast/toast.service';
import { showDialog, showConfirmDialog } from '../../common/dialog/dialog';
import { Leave, UploadedFile } from '../../models/leave.model';
import { StepperStep, TimelineItem } from '../../models/stepper.model';
import { STATUS } from '../../models/status';

@Component({
  standalone: false,
  selector: 'app-leave-detail',
  templateUrl: './leave-detail.component.html',
  styleUrls: ['./leave-detail.component.scss'],
})
export class LeaveDetailComponent implements OnInit, OnDestroy {
  leave: Leave | null = null;
  stepperSteps: StepperStep[] = [];
  timelineItems: TimelineItem[] = [];
  user: any = null;
  loading = true;
  showTimeline = false;
  showCelebration = false;
  confettiPieces: any[] = [];
  private destroy$ = new Subject<void>();

  pretempRemark = '';
  /** @deprecated VC flow removed — kept for backward compat, do not use in new code */
  tempRemark = '';
  approvalRemark = '';

  constructor(
    private auth: AuthService,
    private leaveService: LeaveService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    const id = this.route.snapshot.paramMap.get('id')!;
    if (!id) {
      this.toast.error('ไม่พบรหัสคำขอ');
      this.loading = false;
      return;
    }
    this.loadData(id);
  }

  private makeConfetti(): any[] {
    const colors = ['#0E3362', '#2e7d32', '#c62828', '#ff9800', '#1565c0', '#fbc02d'];
    return Array.from({ length: 60 }, () => ({
      left: Math.random() * 100 + 'vw',
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8 + 's',
      duration: 2.5 + Math.random() * 2 + 's',
    }));
  }

  /** @public — also used by uploadComplete handlers to refresh status after SU->DC */
  loadData(id: string): void {
    if (!id || typeof id !== 'string') {
      this.loading = false;
      this.toast.error('รหัสคำขอไม่ถูกต้อง');
      return;
    }
    this.loading = true;
    this.leaveService.getLeave(id).pipe(
      takeUntil(this.destroy$),
      switchMap(leave => {
        if (!leave || !leave.id) throw new Error('leave not found');
        this.leave = leave;
        return forkJoin({
          steps: this.leaveService.getStepper(id).pipe(catchError(err => { console.error('[stepper]', err); return of([] as StepperStep[]); })),
          items: this.leaveService.getHistory(id).pipe(catchError(err => { console.error('[history]', err); return of([] as TimelineItem[]); }))
        }).pipe(
          map(({ steps, items }) => ({ leave, steps, items })),
          catchError(err => { console.error('[forkJoin]', err); return of({ leave, steps: [] as StepperStep[], items: [] as TimelineItem[] }); })
        );
      }),
      finalize(() => this.loading = false),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ leave, steps, items }) => {
        this.leave = leave;
        this.stepperSteps = Array.isArray(steps) ? steps : [];
        this.timelineItems = Array.isArray(items) ? items : [];
      },
      error: (err) => {
        console.error('[leave-detail] load failed', err);
        this.toast.error(err?.error?.message || err?.message || 'โหลดข้อมูลล้มเหลว');
        this.stepperSteps = [];
        this.timelineItems = [];
      }
    });
  }

  /** Reload current leave — convenience wrapper for uploadComplete events */
  reloadLeave(): void {
    if (this.leave?.id) {
      this.loadData(this.leave.id);
    }
  }

  /** Called by <app-upload-zone> after successful emp upload */
  onEmpUploadComplete(): void {
    // Emp upload at SU triggers backend SU->DC; need to refresh status/stepper
    // Do immediate reload plus safety delayed reload to handle eventual consistency
    this.reloadLeave();
  }

  /** Called by <app-upload-zone> after HR/MGR verification upload at DC */
  onVerificationUploadComplete(): void {
    this.reloadLeave();
  }

  get canApprove(): boolean {
    return this.user?.role === 'mgr' && this.leave?.current_status === STATUS.MA.code;
  }

  // ตรวจเอกสารได้ทั้ง HR/MGR, แต่อนุมัติได้แค่ MGR — simplified flow DC -> MA (no VC)
  get canDoPretemp(): boolean {
    return (this.user?.role === 'hr' || this.user?.role === 'mgr') && this.leave?.current_status === STATUS.DC.code;
  }

  // VC flow removed — kept for type compat only, always false now.
  // Use canDoPretemp (DC -> MA) instead.
  /** @deprecated */
  get canDoTemp(): boolean {
    return false;
  }

  get canSendBack(): boolean {
    // HR/MGR ส่งกลับได้ที่ DC, ส่วน MA ให้ MGR เท่านั้น (VC removed)
    if (this.leave?.current_status === STATUS.DC.code) {
      return this.user?.role === 'hr' || this.user?.role === 'mgr';
    }
    if (this.leave?.current_status === STATUS.MA.code) {
      return this.user?.role === 'mgr';
    }
    return false;
  }

  get canReject(): boolean {
    // Simplified: DC ให้ HR/MGR ไม่อนุมัติได้, MA ให้ MGR เท่านั้น (VC removed)
    if (this.leave?.current_status === STATUS.DC.code) {
      return this.user?.role === 'hr' || this.user?.role === 'mgr';
    }
    if (this.leave?.current_status === STATUS.MA.code) {
      return this.user?.role === 'mgr';
    }
    return false;
  }

  get canCancel(): boolean {
    return this.user?.role === 'emp' &&
      this.user?.id === this.leave?.user_id &&
      this.leave?.current_status === STATUS.SU.code;
  }

  get canResubmit(): boolean {
    return this.user?.role === 'emp' &&
      this.user?.id === this.leave?.user_id &&
      this.leave?.flag_send_back === 'Y';
  }

  get canUploadDoc(): boolean {
    // เหลือทางเดียว: หลังส่งกลับให้ไปที่ฟอร์มเท่านั้น — ซ่อนแผงอัปโหลดบน Detail เพื่อไม่ให้งง
    return false;
  }

  get showApprovalPanel(): boolean {
    // Plan A — strict separation: approval panel only at MA (never at DC)
    return this.leave?.current_status === STATUS.MA.code && (this.canApprove || this.canSendBack || this.canReject);
  }

  get isWaitingForUpload(): boolean {
    return this.leave?.current_status === STATUS.SU.code;
  }

  get shouldShowWaitingForHr(): boolean {
    const isHrOrMgr = this.user?.role === 'hr' || this.user?.role === 'mgr';
    return !!isHrOrMgr && this.isWaitingForUpload;
  }

  /** Disabled state for DC send-back / reject buttons — requires remark + not loading */
  get isPretempSendDisabled(): boolean {
    return !this.pretempRemark?.trim() || this.loading;
  }

  /** Alias for pretemp reject — same rule: remark required */
  get isPretempRejectDisabled(): boolean {
    return !this.pretempRemark?.trim() || this.loading;
  }

  /** Disabled state for MA send-back / reject buttons — requires approvalRemark + not loading */
  get isApprovalSendDisabled(): boolean {
    return !this.approvalRemark?.trim() || this.loading;
  }

  /** Alias for MA reject — same rule as sendBack at MA */
  get isRejectDisabled(): boolean {
    return !this.approvalRemark?.trim() || this.loading;
  }

  private async guardHrBlockedAtM(): Promise<boolean> {
    if (this.user?.role !== 'hr') return false;
    if (this.leave?.current_status === STATUS.MA.code) {
      await showDialog({
        type: 'warning',
        title: 'ไม่สามารถดำเนินการได้',
        message: 'ต้องให้หัวหน้าอนุมัติก่อน',
        buttonText: 'ตกลง',
      });
      return true;
    }
    return false;
  }

  async handlePretempPass(): Promise<void> {
    const id = this.leave!.id;
    if (await this.guardHrBlockedAtM()) return;
    let files: UploadedFile[] | undefined;
    try {
      files = await this.leaveService.getFiles(id).toPromise();
    } catch {}
    if (!files || files.length === 0) {
      const proceed = await showConfirmDialog({
        title: 'ยังไม่มีเอกสารแนบ',
        message: 'ยังไม่มีเอกสารแนบในคำขอนี้ ต้องการดำเนินการต่อหรือไม่?',
      });
      if (!proceed) return;
    }
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันตรวจสอบความครบถ้วน',
      message: 'ยืนยันว่าเอกสารครบถ้วนถูกต้อง? (จะส่งต่อให้หัวหน้าอนุมัติ)',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.pretempPass(id, this.pretempRemark).toPromise();
      this.toast.success('ตรวจสอบความครบถ้วนผ่านแล้ว — ส่งต่อรอหัวหน้าอนุมัติ');
      setTimeout(() => this.loadData(id), 800);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handlePretempSendBack(): Promise<void> {
    const id = this.leave!.id;
    if (!this.pretempRemark || !this.pretempRemark.trim()) {
      this.toast.warning('กรุณาระบุเหตุผลที่ส่งกลับ');
      return;
    }
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันส่งกลับแก้ไข',
      message: 'ยืนยันส่งกลับแก้ไขเอกสาร?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.pretempSendBack(id, this.pretempRemark).toPromise();
      this.toast.success('ส่งกลับแก้ไขเรียบร้อย');
      setTimeout(() => this.loadData(id), 800);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handlePretempReject(): Promise<void> {
    const id = this.leave?.id;
    if (!id || typeof id !== 'string') {
      this.toast.error('รหัสคำขอไม่ถูกต้อง');
      return;
    }
    if (!this.pretempRemark || !this.pretempRemark.trim()) {
      this.toast.warning('กรุณาระบุเหตุผล');
      return;
    }
    // No HR block at DC — but keep guard for consistency if status races to MA
    if (await this.guardHrBlockedAtM()) return;
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันการไม่อนุมัติ',
      message: 'ยืนยันการไม่อนุมัติคำขอนี้?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.reject(id, this.pretempRemark).toPromise();
      this.toast.success('ไม่อนุมัติสำเร็จ');
      setTimeout(() => this.loadData(id), 800);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  /**
   * @deprecated VC flow removed — use handlePretempPass (DC->MA) instead.
   * Kept for backward compat; delegates to pretemp.
   */
  async handleTempPass(): Promise<void> {
    console.warn('[deprecated] handleTempPass called — VC flow removed, delegating to pretempPass');
    return this.handlePretempPass();
  }

  /**
   * @deprecated VC flow removed — use handlePretempSendBack (DC->SU) instead.
   */
  async handleTempSendBack(): Promise<void> {
    console.warn('[deprecated] handleTempSendBack called — VC flow removed, delegating to pretempSendBack');
    // map tempRemark -> pretempRemark for compat
    if (this.tempRemark && !this.pretempRemark) this.pretempRemark = this.tempRemark;
    return this.handlePretempSendBack();
  }

  async handleApprove(): Promise<void> {
    if (await this.guardHrBlockedAtM()) return;
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันอนุมัติ',
      message: 'ยืนยันการอนุมัติคำขอนี้?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.approve(this.leave!.id, this.approvalRemark).toPromise();
      this.toast.success('อนุมัติสำเร็จ');
      this.confettiPieces = this.makeConfetti();
      this.showCelebration = true;
      setTimeout(() => {
        this.showCelebration = false;
        this.loadData(this.leave!.id);
      }, 2500);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleSendBack(): Promise<void> {
    if (await this.guardHrBlockedAtM()) return;
    if (!this.approvalRemark || !this.approvalRemark.trim()) {
      this.toast.warning('กรุณาระบุเหตุผลที่ส่งกลับ');
      return;
    }
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันส่งกลับแก้ไข',
      message: 'ยืนยันส่งกลับแก้ไขคำขอนี้?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.sendBack(this.leave!.id, this.approvalRemark).toPromise();
      this.toast.success('ส่งกลับแก้ไขเรียบร้อย');
      setTimeout(() => this.loadData(this.leave!.id), 800);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleReject(): Promise<void> {
    if (await this.guardHrBlockedAtM()) return;
    if (!this.approvalRemark || !this.approvalRemark.trim()) {
      this.toast.warning('กรุณาระบุเหตุผล');
      return;
    }
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันการไม่อนุมัติ',
      message: 'ยืนยันการไม่อนุมัติคำขอนี้?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.reject(this.leave!.id, this.approvalRemark).toPromise();
      this.toast.success('ไม่อนุมัติสำเร็จ');
      setTimeout(() => this.loadData(this.leave!.id), 800);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleCancel(): Promise<void> {
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันการยกเลิก',
      message: 'ยืนยันการยกเลิกคำขอนี้?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.cancelLeave(this.leave!.id, 'ยกเลิกโดยผู้ขอ').toPromise();
      this.toast.success('ยกเลิกคำขอเรียบร้อย');
      setTimeout(() => this.loadData(this.leave!.id), 800);
    } catch (err: any) {
      this.toast.error(err?.error?.message || err?.message || 'เกิดข้อผิดพลาด');
    }
  }

  onEmpUpload(files: File[]): any {
    if (!this.leave?.id) {
      this.toast.error('รหัสคำขอไม่ถูกต้อง');
      throw new Error('leave id missing');
    }
    return this.leaveService.uploadFile(this.leave.id, files);
  }

  onEmpDelete(fileId: string): any {
    if (!this.leave?.id) {
      this.toast.error('รหัสคำขอไม่ถูกต้อง');
      throw new Error('leave id missing');
    }
    return this.leaveService.deleteFile(this.leave.id, fileId);
  }

  canEmpDelete(file: UploadedFile): boolean {
    return !!file && file.uploaded_by === this.user?.id;
  }

  onVerificationUpload(files: File[]): any {
    if (!this.leave?.id) {
      this.toast.error('รหัสคำขอไม่ถูกต้อง');
      throw new Error('leave id missing');
    }
    return this.leaveService.uploadVerificationFile(this.leave.id, files);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
