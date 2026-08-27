import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class DashboardComponent implements OnInit {
  user: User | null = null;
  leaves: Leave[] = [];
  loading = true;

  readonly roleLabels: Record<string, string> = { emp: 'พนักงาน', mgr: 'หัวหน้า', hr: 'HR' };

  constructor(
    private auth: AuthService,
    private leaveService: LeaveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    this.leaveService.getLeaves().subscribe({
      next: (data) => { this.leaves = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get title(): string {
    if (!this.user) return '';
    if (this.user.role === 'emp') return 'รายการคำขอของฉัน';
    if (this.user.role === 'mgr') return 'คำขอลาที่รอฉันตรวจสอบ';
    return 'คำขอลาทั้งหมด';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
