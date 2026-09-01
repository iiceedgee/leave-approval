import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { Leave } from '../../models/leave.model';
import { User } from '../../models/user.model';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  leaves: Leave[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  // ── Pagination state (backward compat: defaults keep client paging working) ──
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  // ── Server-search state (additive: แทน dxo-search-panel) ──
  q = '';
  searchDebounce: any = null;

  readonly roleLabels: Record<string, string> = { emp: 'พนักงาน', mgr: 'หัวหน้า', hr: 'HR' };

  constructor(
    private auth: AuthService,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    try {
      this.user = this.auth.getUser();
    } catch {
      this.user = null;
    }
    this.loadLeaves();
  }

  loadLeaves(): void {
    this.loading = true;
    this.leaveService.getLeaves(this.page, this.limit, this.q).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          // backward compat: backend ยังส่ง array เดิม
          this.leaves = res;
          this.total = res.length;
          this.totalPages = Math.ceil(this.total / this.limit) || 1;
        } else {
          // paginated shape: { data, total, page, limit, totalPages }
          const paginated = res as { data: Leave[]; total: number; page: number; limit: number; totalPages: number };
          this.leaves = Array.isArray(paginated.data) ? paginated.data : [];
          this.total = typeof paginated.total === 'number' ? paginated.total : this.leaves.length;
          this.page = typeof paginated.page === 'number' ? paginated.page : this.page;
          this.limit = typeof paginated.limit === 'number' ? paginated.limit : this.limit;
          this.totalPages = typeof paginated.totalPages === 'number' ? paginated.totalPages : (Math.ceil(this.total / this.limit) || 1);
        }
        this.loading = false;
      },
      error: () => { this.leaves = []; this.loading = false; }
    });
  }

  onPageChange(page: number): void {
    if (!page || page < 1) return;
    if (this.totalPages > 0 && page > this.totalPages) return;
    this.page = page;
    this.loadLeaves();
  }

  onPageSizeChange(limit: number): void {
    if (!limit || limit < 1) return;
    this.limit = limit;
    this.page = 1;
    this.loadLeaves();
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

  onSearch(q: string): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.q = (q || '').trim();
      this.page = 1;
      this.loadLeaves();
    }, 300);
  }

  clearSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.q = '';
    this.page = 1;
    this.loadLeaves();
  }

  highlight(text: string, q: string): string {
    if (!text || !q || !q.trim()) return this.escapeHtml(text || '');
    const qq = this.escapeHtml(q.trim());
    const escaped = this.escapeHtml(text);
    try {
      const re = new RegExp(`(${this.escapeRegExp(qq)})`, 'gi');
      return escaped.replace(re, '<mark>$1</mark>');
    } catch { return escaped; }
  }

  private escapeHtml(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.destroy$.next();
    this.destroy$.complete();
  }

  get title(): string {
    if (!this.user) return '';
    if (this.user.role === 'emp') return 'รายการคำขอของฉัน';
    if (this.user.role === 'mgr') return 'คำขอลาที่รอฉันตรวจสอบ';
    return 'คำขอลาทั้งหมด';
  }

  isOwner(leave: Pick<Leave, 'user_id'> | null | undefined): boolean {
    if (!leave || !this.user?.id) return false;
    return String((leave as any).user_id) === String(this.user.id);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
