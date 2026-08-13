import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { ToastService } from '../../shared/toast/toast.service';
import { showDialog, showConfirmDialog } from '../../common/dialog/dialog';
import { Leave, UploadedFile } from '../../models/leave.model';
import { StepperStep, TimelineItem } from '../../models/stepper.model';

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
    const id = +this.route.snapshot.paramMap.get('id')!;
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

  private loadData(id: number): void {
    this.loading = true;
    this.leaveService.getLeave(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (leave) => {
        this.leave = leave;
        forkJoin([
          this.leaveService.getStepper(id),
          this.leaveService.getHistory(id),
        ]).pipe(takeUntil(this.destroy$)).subscribe({
          next: ([steps, items]) => {
            this.stepperSteps = steps;
            this.timelineItems = items;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get canApprove(): boolean {
    return this.user?.role === 'mgr' && this.leave?.current_status === 'M';
  }

  get canDoPretemp(): boolean {
    return (this.user?.role === 'mgr' || this.user?.role === 'hr') && this.leave?.current_status === 'P';
  }

  get canDoTemp(): boolean {
    return (this.user?.role === 'mgr' || this.user?.role === 'hr') && this.leave?.current_status === 'T';
  }

  get canSendBack(): boolean {
    return (this.user?.role === 'mgr' || this.user?.role === 'hr') &&
      (this.leave?.current_status === 'P' || this.leave?.current_status === 'T' || this.leave?.current_status === 'M');
  }

  get canReject(): boolean {
    return (this.user?.role === 'mgr' || this.user?.role === 'hr') &&
      (this.leave?.current_status === 'T' || this.leave?.current_status === 'M');
  }

  get canCancel(): boolean {
    return this.user?.role === 'emp' &&
      this.user?.id === this.leave?.user_id &&
      this.leave?.current_status === 'F';
  }

  get canResubmit(): boolean {
    return this.user?.role === 'emp' &&
      this.user?.id === this.leave?.user_id &&
      this.leave?.flag_send_back === 'Y';
  }

  get canUploadDoc(): boolean {
    return this.user?.role === 'emp' &&
      this.user?.id === this.leave?.user_id &&
      (this.leave?.current_status === 'F' || this.leave?.flag_send_back === 'Y');
  }

  get showApprovalPanel(): boolean {
    return this.canApprove || this.canSendBack || this.canReject;
  }

  private async guardHrBlockedAtM(): Promise<boolean> {
    if (this.user?.role !== 'hr') return false;
    if (this.leave?.current_status === 'M') {
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
      message: 'ยืนยันว่าเอกสารครบถ้วนถูกต้อง?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.pretempPass(id, this.pretempRemark).toPromise();
      this.toast.success('ตรวจสอบความครบถ้วนผ่านแล้ว');
      setTimeout(() => this.loadData(id), 800);
    } catch (err: any) {
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handlePretempSendBack(): Promise<void> {
    const id = this.leave!.id;
    if (!this.pretempRemark) {
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
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleTempPass(): Promise<void> {
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
      title: 'ยืนยันตรวจสอบความถูกต้อง',
      message: 'ยืนยันว่าเอกสารถูกต้อง?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.tempPass(id, this.tempRemark).toPromise();
      this.toast.success('ตรวจสอบความถูกต้องผ่านแล้ว');
      setTimeout(() => this.loadData(id), 800);
    } catch (err: any) {
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleTempSendBack(): Promise<void> {
    const id = this.leave!.id;
    if (!this.tempRemark) {
      this.toast.warning('กรุณาระบุเหตุผลที่ส่งกลับ');
      return;
    }
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันส่งกลับแก้ไข',
      message: 'ยืนยันส่งกลับแก้ไขเอกสาร?',
    });
    if (!confirmed) return;
    try {
      await this.leaveService.tempSendBack(id, this.tempRemark).toPromise();
      this.toast.success('ส่งกลับแก้ไขเรียบร้อย');
      setTimeout(() => this.loadData(id), 800);
    } catch (err: any) {
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
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
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleSendBack(): Promise<void> {
    if (await this.guardHrBlockedAtM()) return;
    if (!this.approvalRemark) {
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
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async handleReject(): Promise<void> {
    if (await this.guardHrBlockedAtM()) return;
    if (!this.approvalRemark) {
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
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
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
      this.toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  onEmpUpload(files: File[]): any {
    return this.leaveService.uploadFile(this.leave!.id, files);
  }

  onEmpDelete(fileId: number): any {
    return this.leaveService.deleteFile(this.leave!.id, fileId);
  }

  canEmpDelete(file: UploadedFile): boolean {
    return file.uploaded_by === this.user?.id;
  }

  onVerificationUpload(files: File[]): any {
    return this.leaveService.uploadVerificationFile(this.leave!.id, files);
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
