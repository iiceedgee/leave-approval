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
  private readonly READ_IDS_KEY = 'notif_read_ids';
  // Phase A: role-based — hook for Phase B notificationService
  // Phase B will replace getLeaves() with notificationService.getUnread()
  private readonly NEED_CHECK = new Set<string>(['DC', 'MA']); // fallback for isRead generic

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReadIds();
    // poll ทุก 15 วินาที — Phase A: poll getLeaves, Phase B: switch to notificationService
    interval(15000).pipe(
      startWith(0),
      switchMap(() => this.fetchNotifications().pipe(
        catchError(() => {
          // keep previous state on error — don't wipe with []
          return of(null as unknown as Leave[]);
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (leaves) => {
        if (leaves === null) return; // keep previous on error
        this.handleLeaves(leaves);
      },
      error: () => {
        // defensive: keep previous state on error
      }
    });
  }

  /** Hook for Phase B: will be notificationService.getUnread() */
  private fetchNotifications() {
    return this.leaveService.getLeaves();
  }

  private loadReadIds(): void {
    try {
      const raw = localStorage.getItem(this.READ_IDS_KEY);
      if (raw) JSON.parse(raw).forEach((k: string) => this.readIds.add(k));
    } catch {}
  }

  private saveReadIds(): void {
    try { localStorage.setItem(this.READ_IDS_KEY, JSON.stringify([...this.readIds])); } catch {}
  }

  private getReadKey(id: string, status: string): string {
    return `${id}:${status}`;
  }

  private isNeedsCheck(leave: Leave, role: string): boolean {
    const status = String(leave.current_status);
    if (role === 'emp') {
      // emp ต้องทำเมื่อถูกส่งกลับ (SU + flag Y) — SB history but current is SU+Y
      return status === 'SU' && (leave as any).flag_send_back === 'Y';
    }
    if (role === 'mgr') {
      return status === 'DC' || status === 'MA';
    }
    if (role === 'hr') {
      return status === 'DC';
    }
    return this.NEED_CHECK.has(status);
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

    let filtered = leaves;
    if (user.role === 'emp') {
      filtered = leaves.filter(l => String(l.user_id) === String(user.id));
    } else if (user.role === 'mgr') {
      filtered = leaves;
    }

    // Phase A fix: sort by updated_at desc + limit 10 (prevent 1000 rows bloat)
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date((a as any).updated_at || (a as any).created_at).getTime();
      const tb = new Date((b as any).updated_at || (b as any).created_at).getTime();
      return tb - ta;
    }).slice(0, 10);

    this.notifications = sorted.map(l => this.toNotification(l, user.role));
    this.updateUnreadCount();
  }

  private toNotification(leave: Leave, role?: string): AppNotification {
    const status = String(leave.current_status);
    const id = String(leave.id);
    const userRole = role || this.auth.getUser()?.role || '';
    const needsCheck = this.isNeedsCheck(leave, userRole);
    const readKey = this.getReadKey(id, status);
    const alreadyRead = this.readIds.has(readKey);
    // non-needsCheck → isRead=true but still displayed as read row (empty logic handled separately)
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
    // isRead already encodes per-role NEED_CHECK + id:status, just count unread
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
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
      this.readIds.add(this.getReadKey(String(n.id), String(n.status)));
      this.saveReadIds();
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
