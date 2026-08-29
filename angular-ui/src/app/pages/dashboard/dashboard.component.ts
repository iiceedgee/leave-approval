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
    this.leaveService.getLeaves().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.leaves = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => { this.leaves = []; this.loading = false; }
    });
  }

  ngOnDestroy(): void {
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
