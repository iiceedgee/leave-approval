import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subject, of } from 'rxjs';
import { catchError, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { Leave } from '../../models/leave.model';
import { STATUS_LABELS, StatusCode } from '../../models/status';

export interface AppNotification {
  id: string;
  type: string;
  date: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  isRead: boolean;
}

@Component({
  standalone: false,
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  showNotifications = false;
  unreadCount = 0;

  private destroy$ = new Subject<void>();
  private readIds = new Set<string>();
  private readonly NEED_CHECK = new Set<string>(['DC', 'MA']);

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // poll ทุก 15 วินาที (ไม่ใช่ 30s) ด้วย interval(15000) switchMap
    interval(15000).pipe(
      startWith(0),
      switchMap(() => this.leaveService.getLeaves().pipe(
        catchError(() => of([] as Leave[]))
      )),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (leaves) => this.handleLeaves(leaves),
      error: () => {
        // defensive: keep previous state on error
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleLeaves(leaves: Leave[]): void {
    const user = this.auth.getUser();
    if (!user) {
      this.notifications = [];
      this.unreadCount = 0;
      return;
    }

    // reuse Dashboard / leave.service filtering: emp เห็นแค่ของตัวเอง (user_id), mgr เห็นเฉพาะ department เดียวกัน, hr เห็นหมด
    // Note: backend (leave.service.getLeaves) ได้ filter ตาม role แล้ว — client ทำ defensive filtering ซ้ำเพื่อความถูกต้อง
    let filtered = leaves;
    if (user.role === 'emp') {
      filtered = leaves.filter(l => String(l.user_id) === String(user.id));
    } else if (user.role === 'mgr') {
      // mgr: backend คืนเฉพาะ department เดียวกันแล้ว — ถ้า payload มี department/owner_department จะกรองซ้ำได้
      // ตอนนี้ Leave ไม่มี department field จึง trust ผลจาก backend (defensive: ไม่กรองซ้ำถ้าไม่มีข้อมูล)
      filtered = leaves;
    } // hr: เห็นหมด — ไม่ต้องกรอง

    // map leave -> notification {id, type, date: formatDate 14/08/2026 - 23/08/2026, status, statusLabel, statusClass}
    this.notifications = filtered.map(l => this.toNotification(l));
    this.updateUnreadCount();
  }

  private toNotification(leave: Leave): AppNotification {
    const status = String(leave.current_status);
    const id = String(leave.id);
    // unread คือ status IN ('DC','MA') ที่ต้องตรวจ และยังไม่ถูก stampRead (VC ถูกรวมเข้ากับ DC)
    const alreadyRead = this.readIds.has(id);
    const needsCheck = this.NEED_CHECK.has(status);
    const isRead = alreadyRead ? true : !needsCheck ? true : false;

    return {
      id,
      type: leave.leave_type,
      date: this.formatDateRange(leave.start_date, leave.end_date),
      status,
      statusLabel: (STATUS_LABELS as Record<string, string>)[status] ?? status,
      statusClass: `status-badge status-${status}`,
      isRead
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    // ใช้ UTC เพื่อไม่ให้ timezone ทำให้วันเลื่อน และออกเป็น DD/MM/YYYY (ไม่ใช่ 14 ส.ค.)
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getUTCFullYear());
      if (yyyy.length === 4 && dd !== 'NaN' && mm !== 'NaN') {
        return `${dd}/${mm}/${yyyy}`;
      }
    }
    // fallback แยก YYYY-MM-DD ด้วย regex
    const m = String(dateStr).match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) {
      const yyyy = m[1];
      const mm = m[2].padStart(2, '0');
      const dd = m[3].padStart(2, '0');
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateStr;
  }

  private formatDateRange(start: string, end: string): string {
    const s = this.formatDate(start);
    const e = this.formatDate(end);
    if (!s) return e;
    if (!e) return s;
    if (s === e) return s;
    return `${s} - ${e}`;
  }

  private updateUnreadCount(): void {
    // นับ unread จาก status IN ('DC','MA') ที่ต้องตรวจ และยังไม่ถูก stampRead (VC ถูกรวมแล้ว)
    this.unreadCount = this.notifications.filter(n => !n.isRead && this.NEED_CHECK.has(n.status)).length;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNotifications = false;
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  stampRead(n: AppNotification): void {
    if (!n.isRead) {
      n.isRead = true;
      this.readIds.add(String(n.id));
      this.updateUnreadCount();
    }
  }

  onClick(n: AppNotification, event?: Event): void {
    if (event) event.stopPropagation();
    this.stampRead(n);
    this.showNotifications = false;
    this.router.navigate(['/leave', n.id]);
  }
}
