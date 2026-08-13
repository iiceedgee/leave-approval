import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeaveFormComponent } from './pages/leave-form/leave-form.component';
import { LeaveDetailComponent } from './pages/leave-detail/leave-detail.component';
import { LeaveHistoryComponent } from './pages/leave-history/leave-history.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'leave/new', component: LeaveFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['emp'] } },
  { path: 'leave/:id/edit', component: LeaveFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['emp'] } },
  { path: 'leave/:id', component: LeaveDetailComponent, canActivate: [AuthGuard] },
  { path: 'my-leaves/history', component: LeaveHistoryComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
