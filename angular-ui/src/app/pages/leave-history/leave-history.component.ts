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
  user = this.auth.getUser();
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  years = recentYears(5);

  balances: LeaveBalance[] = [];
  history: LeaveHistoryItem[] = [];
  loading = true;
  errorMessage = '';

  readonly STATUS_LABELS: Record<string, string> = STATUS_LABELS;

  readonly toBuddhistYear = toBuddhistYear;
  readonly formatThaiDateRange = formatThaiDateRange;

  constructor(
    private auth: AuthService,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin([
      this.leaveService.getMyBalance(this.selectedYear),
      this.leaveService.getMyHistory(this.selectedYear),
    ]).subscribe({
      next: ([balances, history]) => {
        this.balances = balances;
        this.history = history;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองอีกครั้ง';
      },
    });
  }

  getStatusLabel(code: string): string {
    return getStatusThai(code);
  }

  getStatusClass(code: string): string {
    const map: Record<string, string> = {
      AP: 'status-approved', CX: 'status-cancelled', RJ: 'status-rejected',
      SB: 'status-sendback', SU: 'status-pending', F: 'status-pending',
      DC: 'status-sendback', MA: 'status-approved',
      VC: 'status-sendback', // legacy VC alias -> DC (deprecated)
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
    this.loadData();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
