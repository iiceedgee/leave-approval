import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeaveFormComponent } from './pages/leave-form/leave-form.component';
import { LeaveDetailComponent } from './pages/leave-detail/leave-detail.component';
import { LeaveHistoryComponent } from './pages/leave-history/leave-history.component';
import { StepperComponent } from './shared/stepper/stepper.component';
import { TimelineComponent } from './shared/timeline/timeline.component';
import { StatusBadgeComponent } from './shared/status-badge/status-badge.component';
import { ToastComponent } from './shared/toast/toast.component';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { UploadZoneComponent } from './shared/upload-zone/upload-zone.component';
import { Dialog } from './common/dialog/dialog';
import { SweetAlertDialog } from './common/dialog/sweetalert-dialog';

import { JwtInterceptor, ErrorInterceptor } from './interceptors';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    LeaveFormComponent,
    LeaveDetailComponent,
    LeaveHistoryComponent,
    StepperComponent,
    TimelineComponent,
    StatusBadgeComponent,
    ToastComponent,
    UploadZoneComponent,
    NotificationBellComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    { provide: Dialog, useClass: SweetAlertDialog },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
