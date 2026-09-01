import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuditService } from '../../services/audit.service';
import { AuditLog } from '../../models/audit.model';

@Component({
  standalone: false,
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss'],
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  user: any = null;

  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  loading = true;
  errorMessage = '';

  q = '';
  searchDebounce: any = null;

  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  constructor(
    private auth: AuthService,
    private auditService: AuditService,
    private router: Router
  ) {}

  ngOnInit(): void {
    try {
      this.user = this.auth.getUser();
    } catch {
      this.user = null;
    }
    this.loadLogs();
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auditService.getAuditLogs().subscribe({
      next: (data) => {
        this.logs = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err: any) => {
        this.logs = [];
        this.filteredLogs = [];
        this.total = 0;
        this.totalPages = 0;
        this.loading = false;
        const status = err?.status;
        if (status === 401) this.errorMessage = 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่';
        else if (status === 403) this.errorMessage = 'ไม่มีสิทธิ์ดู Audit — เฉพาะ HR เท่านั้น';
        else this.errorMessage = 'ไม่สามารถโหลดประวัติ Audit ได้ กรุณาลองอีกครั้ง';
      },
    });
  }

  applyFilter(): void {
    const qq = (this.q || '').trim().toLowerCase();
    let filtered = this.logs;
    if (qq) {
      filtered = this.logs.filter((log) => {
        const method = (log.method || '').toLowerCase();
        const path = (log.path || '').toLowerCase();
        const status = String(log.statusCode || '').toLowerCase();
        const ip = (log.ip || '').toLowerCase();
        const userId = (log.userId || '').toLowerCase();
        const thai = this.mapThai(log.path, log.method).toLowerCase();
        return (
          method.includes(qq) ||
          path.includes(qq) ||
          status.includes(qq) ||
          ip.includes(qq) ||
          userId.includes(qq) ||
          thai.includes(qq)
        );
      });
    }
    this.total = filtered.length;
    this.totalPages = Math.ceil(this.total / this.limit) || 1;
    if (this.page > this.totalPages) this.page = this.totalPages;
    if (this.page < 1) this.page = 1;
    const start = (this.page - 1) * this.limit;
    this.filteredLogs = filtered.slice(start, start + this.limit);
  }

  onSearch(q: string): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.q = (q || '').trim();
      this.page = 1;
      this.applyFilter();
    }, 300);
  }

  clearSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.q = '';
    this.page = 1;
    this.applyFilter();
  }

  onPageChange(page: number): void {
    if (!page || page < 1) return;
    if (this.totalPages > 0 && page > this.totalPages) return;
    this.page = page;
    this.applyFilter();
  }

  onPageSizeChange(limit: number): void {
    if (!limit || limit < 1) return;
    this.limit = limit;
    this.page = 1;
    this.applyFilter();
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

  highlight(text: string, q: string): string {
    if (!text || !q || !q.trim()) return this.escapeHtml(text || '');
    const qq = this.escapeHtml(q.trim());
    const escaped = this.escapeHtml(text);
    try {
      const re = new RegExp(`(${this.escapeRegExp(qq)})`, 'gi');
      return escaped.replace(re, '<mark>$1</mark>');
    } catch {
      return escaped;
    }
  }

  private escapeHtml(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getMethodClass(method: string): string {
    const m = (method || '').toUpperCase();
    if (m === 'GET') return 'method-get';
    if (m === 'POST') return 'method-post';
    if (m === 'PUT') return 'method-put';
    if (m === 'PATCH') return 'method-patch';
    if (m === 'DELETE') return 'method-delete';
    return 'method-other';
  }

  getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'status-success';
    if (statusCode >= 300 && statusCode < 400) return 'status-warning';
    if (statusCode >= 400 && statusCode < 500) return 'status-error';
    if (statusCode >= 500) return 'status-fatal';
    return 'status-other';
  }

  mapThai(path: string, method: string): string {
    const p = (path || '').toLowerCase();
    const m = (method || '').toUpperCase();

    if (p === '/api/auth/login') return 'เข้าสู่ระบบ';
    if (p === '/api/auth/register') return 'ลงทะเบียน';
    if (p === '/api/audit-logs') return 'ดู Audit Logs';
    if (p === '/api/health') return 'ตรวจสอบระบบ';
    if (p === '/api/leave/my-history' || p.startsWith('/api/leave/my-history')) return 'ดูประวัติการลา';
    if (p === '/api/leave/my-balance' || p.startsWith('/api/leave/my-balance')) return 'ดูยอดคงเหลือ';
    if (p.match(/^\/api\/leave\/[^/]+\/resubmit/)) return 'ส่งกลับแก้ไข';
    if (p.match(/^\/api\/leave\/[^/]+\/cancel/)) return 'ยกเลิกคำขอลา';
    if (p.match(/^\/api\/leave\/[^/]+\/files/)) {
      return m === 'POST' ? 'อัปโหลดไฟล์' : m === 'DELETE' ? 'ลบไฟล์' : 'ดูไฟล์';
    }
    if (p.match(/^\/api\/leave\/[^/]+\/stepper/)) return 'ดูขั้นตอน';
    if (p.match(/^\/api\/leave\/[^/]+\/history/)) return 'ดูประวัติ';
    if (p.match(/^\/api\/approval\/[^/]+\/approve/)) return 'อนุมัติ';
    if (p.match(/^\/api\/approval\/[^/]+\/sendback/)) return 'ส่งกลับแก้ไข';
    if (p.match(/^\/api\/approval\/[^/]+\/reject/)) return 'ปฏิเสธ';
    if (p.match(/^\/api\/approval\/[^/]+\/pretemp\/pass/)) return 'ตรวจเอกสารผ่าน (DC)';
    if (p.match(/^\/api\/approval\/[^/]+\/pretemp\/sendback/)) return 'ส่งกลับเอกสาร';
    if (p.match(/^\/api\/approval\/[^/]+\/temp\/pass/)) return 'ตรวจเอกสารผ่าน (VC)';
    if (p.match(/^\/api\/approval\/[^/]+\/temp\/sendback/)) return 'ส่งกลับเอกสาร (VC)';
    if (p.match(/^\/api\/approval\/[^/]+\/files/)) return 'อัปโหลดไฟล์ตรวจ';
    if (p.match(/^\/api\/approval\/[^/]+\/verifications/)) return 'ดูการตรวจสอบ';
    if (p === '/api/leave' && m === 'POST') return 'ยื่นคำขอลา';
    if (p === '/api/leave' && m === 'GET') return 'ดูรายการลา';
    if (p.match(/^\/api\/leave\/[^/]+$/) && m === 'GET') return 'ดูรายละเอียดลา';
    if (p.startsWith('/api/leave')) return 'จัดการคำขอลา';
    if (p.startsWith('/api/approval')) return 'จัดการอนุมัติ';
    if (p.startsWith('/api/auth')) return 'จัดการสิทธิ์';
    return p || '-';
  }

  formatThaiTime(timestamp: string): string {
    if (!timestamp) return '-';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
