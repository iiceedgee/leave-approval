import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginResponse, User, RegisterRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      // storage เสีย — ล้างทิ้งกันพังทั้งแอป
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      base64 += '='.repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(base64);
      // atob returns latin1 binary — decode UTF-8 safely (รองรับ fullName ภาษาไทย)
      const json = decodeURIComponent(
        Array.prototype.map.call(binary, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(json);
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch { return false; }
  }
}
