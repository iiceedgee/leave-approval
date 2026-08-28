import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, Subject, of, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UploadedFile } from '../../models/leave.model';
import { LeaveService } from '../../services/leave.service';
import { ToastService } from '../toast/toast.service';

@Component({
  standalone: false,
  selector: 'app-upload-zone',
  templateUrl: './upload-zone.component.html',
  styleUrls: ['./upload-zone.component.scss'],
})
export class UploadZoneComponent implements OnInit, OnDestroy, OnChanges {
  @Input() leaveId!: string;
  @Input() accept = '.pdf,.jpg,.jpeg,.png,.docx';
  @Input() multiple = true;
  @Input() maxFiles = 5;
  @Input() maxSizeMB = 10;
  @Input() uploadFn?: (files: File[]) => Observable<any>;
  @Input() getFilesFn?: () => Observable<UploadedFile[]>;
  @Input() deleteFn?: (fileId: string) => Observable<any>;
  @Input() canDelete: boolean | ((file: UploadedFile) => boolean) = true;
  @Output() uploadComplete = new EventEmitter<File[]>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  pendingFiles: File[] = [];
  existingFileList: UploadedFile[] = [];
  loading = false;
  uploading = false;
  isDragging = false;
  previewFile: {
    file: UploadedFile;
    url: string;
    safeUrl: SafeResourceUrl | null;
    kind: 'pdf' | 'image' | 'other';
  } | null = null;

  private destroy$ = new Subject<void>();
  private previewRequestId = 0;

  constructor(
    private leaveService: LeaveService,
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this.leaveId) {
      this.loadExistingFiles();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['leaveId'] && this.leaveId && !changes['leaveId'].firstChange) {
      this.loadExistingFiles();
    }
  }

  ngOnDestroy(): void {
    if (this.previewFile?.url) {
      URL.revokeObjectURL(this.previewFile.url);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private addFiles(files: File[]): void {
    const remaining = Math.max(0, this.maxFiles - this.pendingFiles.length);
    const toAdd = files.slice(0, remaining);
    const allowedExtensions = this.accept.split(',').map(s => s.trim().toLowerCase());

    for (const file of toAdd) {
      const ext = '.' + file.name.split('.').pop()!.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        this.toast.warning(`ไฟล์ ${file.name} ไม่อยู่ในประเภทที่อนุญาต`);
        continue;
      }
      if (file.size > this.maxSizeMB * 1024 * 1024) {
        this.toast.warning(`ไฟล์ ${file.name} มีขนาดใหญ่กว่า ${this.maxSizeMB}MB`);
        continue;
      }
      this.pendingFiles.push(file);
    }

    if (files.length > remaining) {
      this.toast.warning(`สามารถอัปโหลดได้สูงสุด ${this.maxFiles} ไฟล์`);
    }
  }

  removePending(index: number): void {
    this.pendingFiles.splice(index, 1);
  }

  loadExistingFiles(): void {
    if (!this.leaveId) {
      this.existingFileList = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    const fn = this.getFilesFn || (() => this.leaveId ? this.leaveService.getFiles(this.leaveId) : of([]));
    fn().pipe(takeUntil(this.destroy$)).subscribe({
      next: (files) => {
        this.existingFileList = Array.isArray(files) ? files : [];
        this.loading = false;
      },
      error: () => {
        this.existingFileList = [];
        this.loading = false;
      },
    });
  }

  downloadFile(fileId: string, fileName: string): void {
    if (!this.leaveId || !fileId) {
      this.toast.error('รหัสไฟล์ไม่ถูกต้อง');
      return;
    }
    this.leaveService.downloadFile(this.leaveId, fileId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        // ถ้า API ส่ง JSON error กลับมาเป็น blob (เช่น 404) → ต้องเช็คก่อน
        if (blob.type && blob.type.includes('application/json')) {
          (blob as any).text().then((t: string) => {
            try {
              const j = JSON.parse(t);
              this.toast.error(j.message || 'ดาวน์โหลดไฟล์ล้มเหลว');
            } catch {
              this.toast.error('ดาวน์โหลดไฟล์ล้มเหลว');
            }
          });
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      error: (err) => this.toast.error(err?.error?.message || 'ดาวน์โหลดไฟล์ล้มเหลว'),
    });
  }

  getPreviewKind(file: UploadedFile): 'pdf' | 'image' | 'other' {
    const mime = (file.mime_type || '').toLowerCase();
    const name = (file.original_name || '').toLowerCase();
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
    if (mime === 'application/pdf' || ext === '.pdf') {
      return 'pdf';
    }
    if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return 'image';
    }
    return 'other';
  }

  openPreview(file: UploadedFile): void {
    if (!this.leaveId || !file?.id) {
      this.toast.error('รหัสไฟล์ไม่ถูกต้อง');
      return;
    }
    const kind = this.getPreviewKind(file);
    if (kind === 'other') {
      this.previewFile = { file, url: '', safeUrl: null, kind };
      return;
    }
    const reqId = ++this.previewRequestId;
    this.leaveService.downloadFile(this.leaveId, file.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        if (reqId !== this.previewRequestId) return;
        if (blob.type && blob.type.includes('application/json')) {
          this.previewFile = { file, url: '', safeUrl: null, kind: 'other' };
          this.toast.error('เปิดดูไฟล์ล้มเหลว');
          return;
        }
        const url = URL.createObjectURL(blob);
        this.previewFile = {
          file,
          url,
          safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(url),
          kind,
        };
      },
      error: (err) => this.toast.error(err?.error?.message || 'เปิดดูไฟล์ล้มเหลว'),
    });
  }

  closePreview(): void {
    this.previewRequestId++;
    if (this.previewFile?.url) {
      URL.revokeObjectURL(this.previewFile.url);
    }
    this.previewFile = null;
  }

  onOverlayClick($event: Event): void {
    if ($event.target === $event.currentTarget) {
      this.closePreview();
    }
  }

  @HostListener('document:keydown.escape')
  onKeydownEscape(): void {
    if (this.previewFile) {
      this.closePreview();
    }
  }

  canDeleteFile(file: UploadedFile): boolean {
    if (typeof this.canDelete === 'function') {
      return (this.canDelete as (f: UploadedFile) => boolean)(file);
    }
    return this.canDelete;
  }

  formatFileSize(bytes: number): string {
    const n = Number(bytes) || 0;
    if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
    if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
    return n + ' B';
  }

  deleteFile(fileId: string): void {
    const fn = this.deleteFn || ((fid: string) => this.leaveService.deleteFile(this.leaveId, fid));
    fn(fileId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success('ลบไฟล์เรียบร้อย');
        this.loadExistingFiles();
      },
      error: (err) => this.toast.error(err.message || 'ลบไฟล์ล้มเหลว'),
    });
  }

  async uploadAll(): Promise<void> {
    if (this.uploading) return;
    if (this.pendingFiles.length === 0) {
      this.toast.warning('กรุณาเลือกไฟล์ก่อนอัปโหลด');
      return;
    }
    if (!this.leaveId) {
      this.toast.warning('ไฟล์จะถูกอัปโหลดเมื่อกดยื่นคำขอ');
      return;
    }
    this.uploading = true;
    const files = [...this.pendingFiles];
    this.pendingFiles = [];
    let obs: Observable<any>;
    try {
      const fn = this.uploadFn || ((f: File[]) => this.leaveService.uploadFile(this.leaveId, f));
      obs = fn(files);
    } catch (err: any) {
      this.toast.error(err?.message || 'อัปโหลดไฟล์ล้มเหลว');
      this.pendingFiles = [...files, ...this.pendingFiles];
      this.uploading = false;
      throw err;
    }
    try {
      const res: any = await firstValueFrom(obs.pipe(takeUntil(this.destroy$)));
      if (res && res.autoTransitionOk === false) {
        this.toast.warning(res.warning || 'อัปโหลดสำเร็จแต่สถานะไม่เปลี่ยน กรุณารีเฟรช');
      } else {
        this.toast.success('อัปโหลดไฟล์เรียบร้อย');
      }
      this.uploadComplete.emit(files);
      this.loadExistingFiles();
    } catch (err: any) {
      this.toast.error('อัปโหลดไฟล์ล้มเหลว: ' + (err.error?.message || err.message || ''));
      this.pendingFiles = [...files, ...this.pendingFiles];
      throw err;
    } finally {
      this.uploading = false;
    }
  }
}
