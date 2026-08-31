import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { LeaveBalance, LeaveHistoryItem } from '../../models/leave.model';
import { STATUS, STATUS_LABELS, getStatusThai } from '../../models/status';
import { formatThaiDateRange, toBuddhistYear, recentYears } from '../../utils/date-util';

@Component({
  standalone: false,
  selector: 'app-leave-history',
  templateUrl: './leave-history.component.html',
  styleUrls: ['./leave-history.component.scss'],
})
export class LeaveHistoryComponent implements OnInit {
  user: any = null;
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  years = recentYears(5);

  balances: LeaveBalance[] = [];
  history: LeaveHistoryItem[] = [];
  loading = true;
  errorMessage = '';

  // ── Pagination state (backward compat: keep client paging if API returns array) ──
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  readonly STATUS_LABELS: Record<string, string> = STATUS_LABELS;

  readonly toBuddhistYear = toBuddhistYear;
  readonly formatThaiDateRange = formatThaiDateRange;

  constructor(
    private auth: AuthService,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    try { this.user = this.auth.getUser(); } catch { this.user = null; }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin([
      this.leaveService.getMyBalance(this.selectedYear),
      this.leaveService.getMyHistory(this.selectedYear, this.page, this.limit),
    ]).subscribe({
      next: ([balances, historyRes]) => {
        this.balances = Array.isArray(balances) ? balances : [];
        if (Array.isArray(historyRes)) {
          // backward compat: backend ยังส่ง array
          this.history = historyRes;
          this.total = historyRes.length;
          this.totalPages = Math.ceil(this.total / this.limit) || 1;
        } else {
          const paginated = historyRes as { data: LeaveHistoryItem[]; total: number; page: number; limit: number; totalPages: number };
          this.history = Array.isArray(paginated.data) ? paginated.data : [];
          this.total = typeof paginated.total === 'number' ? paginated.total : this.history.length;
          this.page = typeof paginated.page === 'number' ? paginated.page : this.page;
          this.limit = typeof paginated.limit === 'number' ? paginated.limit : this.limit;
          this.totalPages = typeof paginated.totalPages === 'number' ? paginated.totalPages : (Math.ceil(this.total / this.limit) || 1);
        }
        this.loading = false;
      },
      error: () => {
        this.balances = [];
        this.history = [];
        this.loading = false;
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองอีกครั้ง';
      },
    });
  }

  onPageChange(page: number): void {
    if (!page || page < 1) return;
    if (this.totalPages > 0 && page > this.totalPages) return;
    this.page = page;
    this.loadData();
  }

  onPageSizeChange(limit: number): void {
    if (!limit || limit < 1) return;
    this.limit = limit;
    this.page = 1;
    this.loadData();
  }

  onGridOptionChanged(e: any): void {
    if (!e || !e.fullName) return;
    if (e.fullName === 'paging.pageIndex') {
      const newPage = (typeof e.value === 'number' ? e.value : 0) + 1;
      if (newPage !== this.page) this.onPageChange(newPage);
    }
    if (e.fullName === 'paging.pageSize') {
      const newSize = typeof e.value === 'number' ? e.value : this.limit;
      if (newSize !== this.limit) this.onPageSizeChange(newSize);
    }
  }

  getStatusLabel(code: string): string {
    return getStatusThai(code);
  }

  getStatusClass(code: string): string {
    const map: Record<string, string> = {
      AP: 'status-approved', CX: 'status-cancelled', RJ: 'status-rejected',
      SB: 'status-sendback', SU: 'status-sendback', F: 'status-sendback',
      DC: 'status-pending', MA: 'status-warning',
      VC: 'status-pending', // legacy VC alias -> DC (deprecated)
    };
    return map[code] || 'status-other';
  }

  calcProgress(used: number, quota: number): number {
    if (quota === 0) return 0;
    return Math.min(100, Math.round((used / quota) * 100));
  }

  viewDetail(id: string): void {
    this.router.navigate(['/leave', id]);
  }

  onYearChange(): void {
    this.page = 1;
    this.loadData();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
