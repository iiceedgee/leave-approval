import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    const allowedRoles = route.data['roles'] as string[];
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const user = this.auth.getUser();
    if (user && allowedRoles.includes(user.role)) return true;
    this.router.navigate(['/dashboard']);
    return false;
  }
}
