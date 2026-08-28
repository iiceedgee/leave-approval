import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast/toast.service';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private handling401 = false;

  constructor(
    private router: Router,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const userFriendlyMessage = this.getUserFriendlyMessage(error);
        this.logError(error, userFriendlyMessage);

        // ไม่ toast สำหรับ request ที่ component จัดการเองอยู่แล้ว (เช่น getStepper/history fallback)
        const silentUrls = ['/stepper', '/history', '/my-balance', '/my-history'];
        const isSilent = silentUrls.some(u => error.url?.includes(u));

        switch (error.status) {
          case 401:
            if (this.handling401) break;
            this.handling401 = true;
            this.auth.logout();
            if (!isSilent) this.toast.info('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
            this.router.navigate(['/login']).finally(() => {
              setTimeout(() => (this.handling401 = false), 1000);
            });
            break;

          case 403:
            if (!isSilent) this.toast.warning('คุณไม่มีสิทธิ์ดำเนินการนี้');
            break;

          case 404:
            // 404 จาก stepper/history ไม่ต้อง toast — ให้ component แสดง fallback เอง
            if (!isSilent) this.toast.warning(userFriendlyMessage || 'ไม่พบทรัพยากรที่ร้องขอ');
            break;

          case 500:
            if (!isSilent) this.toast.error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองอีกครั้ง');
            break;

          default:
            if (!isSilent) {
              if (error.status >= 400 && error.status < 500) {
                this.toast.warning(userFriendlyMessage);
              } else if (error.status !== 0) {
                this.toast.error(userFriendlyMessage);
              } else {
                // status 0 = network/CORS — ไม่สแปม
                this.toast.error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ');
              }
            }
            break;
        }

        return throwError(() => error);
      })
    );
  }

  private getUserFriendlyMessage(error: HttpErrorResponse): string {
    if (error.error?.message && typeof error.error.message === 'string') {
      return error.error.message;
    }
    if (error.error?.error && typeof error.error.error === 'string') {
      return error.error.error;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง';
  }

  private logError(error: HttpErrorResponse, userMessage: string): void {
    // TODO: Integrate with Sentry or other monitoring service
    console.error(`[ErrorInterceptor] ${error.status} ${error.statusText || ''}`, {
      url: error.url,
      message: error.message,
      userMessage,
      error
    });
  }
}
