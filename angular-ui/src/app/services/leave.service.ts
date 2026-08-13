import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leave, CreateLeaveRequest, HistoryItem, UploadedFile, LeaveBalance, LeaveHistoryItem } from '../models/leave.model';
import { StepperStep, TimelineItem } from '../models/stepper.model';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  constructor(private http: HttpClient) {}

  getLeaves(): Observable<Leave[]> {
    return this.http.get<Leave[]>('/api/leave');
  }

  getLeave(id: number): Observable<Leave> {
    return this.http.get<Leave>(`/api/leave/${id}`);
  }

  createLeave(data: CreateLeaveRequest): Observable<Leave> {
    return this.http.post<Leave>('/api/leave', data);
  }

  resubmitLeave(id: number, data: CreateLeaveRequest): Observable<Leave> {
    return this.http.post<Leave>(`/api/leave/${id}/resubmit`, data);
  }

  cancelLeave(id: number, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`/api/leave/${id}/cancel`, { remark });
  }

  getStepper(id: number): Observable<StepperStep[]> {
    return this.http.get<StepperStep[]>(`/api/leave/${id}/stepper`);
  }

  getHistory(id: number): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(`/api/leave/${id}/history`);
  }

  approve(id: number, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`/api/approval/${id}/approve`, { remark });
  }

  sendBack(id: number, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`/api/approval/${id}/sendback`, { remark });
  }

  reject(id: number, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`/api/approval/${id}/reject`, { remark });
  }

  // ── My History & Balance ──

  getMyHistory(year: number): Observable<LeaveHistoryItem[]> {
    return this.http.get<LeaveHistoryItem[]>(`/api/leave/my-history?year=${year}`);
  }

  getMyBalance(year: number): Observable<LeaveBalance[]> {
    return this.http.get<LeaveBalance[]>(`/api/leave/my-balance?year=${year}`);
  }

  // ── File Management ──

  uploadFile(id: number, files: File[]): Observable<any> {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    return this.http.post(`/api/leave/${id}/files`, formData);
  }

  getFiles(id: number): Observable<UploadedFile[]> {
    return this.http.get<UploadedFile[]>(`/api/leave/${id}/files`);
  }

  deleteFile(id: number, fileId: number): Observable<any> {
    return this.http.delete(`/api/leave/${id}/files/${fileId}`);
  }

  downloadFile(id: number, fileId: number): Observable<Blob> {
    return this.http.get(`/api/leave/${id}/files/${fileId}`, { responseType: 'blob' });
  }

  uploadVerificationFile(id: number, files: File[]): Observable<any> {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    return this.http.post(`/api/approval/${id}/files`, formData);
  }

  // ── Document Verification ──

  pretempPass(id: number, remark: string): Observable<any> {
    return this.http.post(`/api/approval/${id}/pretemp/pass`, { remark });
  }

  pretempSendBack(id: number, remark: string): Observable<any> {
    return this.http.post(`/api/approval/${id}/pretemp/sendback`, { remark });
  }

  tempPass(id: number, remark: string): Observable<any> {
    return this.http.post(`/api/approval/${id}/temp/pass`, { remark });
  }

  tempSendBack(id: number, remark: string): Observable<any> {
    return this.http.post(`/api/approval/${id}/temp/sendback`, { remark });
  }
}
