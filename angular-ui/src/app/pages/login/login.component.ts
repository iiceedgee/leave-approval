import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    this.username = this.username.trim();
    this.password = this.password.trim();
    if (!this.username || !this.password) {
      this.error = 'กรุณากรอก username และ password';
      return;
    }
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        const target = '/dashboard';
        this.router.navigate([target]).then(ok => {
          if (!ok) {
            console.warn('[login] navigate blocked', target, 'isLoggedIn', this.auth.isLoggedIn());
            this.error = 'เข้าสู่ระบบสำเร็จแต่ไม่สามารถเปลี่ยนหน้าได้ กรุณารีเฟรช';
          }
        });
      },
      error: (err) => { this.error = err.error?.message || 'เข้าสู่ระบบไม่สำเร็จ'; }
    });
  }
}
