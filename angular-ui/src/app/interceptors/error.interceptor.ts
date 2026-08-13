import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast/toast.service';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
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

        switch (error.status) {
          case 401:
            this.auth.logout();
            this.toast.info('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
            this.router.navigate(['/login']);
            break;

          case 403:
            this.toast.warning('คุณไม่มีสิทธิ์ดำเนินการนี้');
            break;

          case 404:
            this.toast.warning('ไม่พบทรัพยากรที่ร้องขอ');
            break;

          case 500:
            this.toast.error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองอีกครั้ง');
            break;

          default:
            if (error.status >= 400 && error.status < 500) {
              this.toast.warning(userFriendlyMessage);
            } else {
              this.toast.error(userFriendlyMessage);
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
