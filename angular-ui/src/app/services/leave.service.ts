import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leave, CreateLeaveRequest, HistoryItem, UploadedFile, LeaveBalance, LeaveHistoryItem } from '../models/leave.model';
import { StepperStep, TimelineItem } from '../models/stepper.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLeaves(): Observable<Leave[]> {
    return this.http.get<Leave[]>(`${this.apiUrl}/leave`);
  }

  getLeave(id: string): Observable<Leave> {
    return this.http.get<Leave>(`${this.apiUrl}/leave/${id}`);
  }

  createLeave(data: CreateLeaveRequest): Observable<Leave> {
    return this.http.post<Leave>(`${this.apiUrl}/leave`, data);
  }

  resubmitLeave(id: string, data: CreateLeaveRequest): Observable<Leave> {
    return this.http.post<Leave>(`${this.apiUrl}/leave/${id}/resubmit`, data);
  }

  cancelLeave(id: string, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`${this.apiUrl}/leave/${id}/cancel`, { remark });
  }

  getStepper(id: string): Observable<StepperStep[]> {
    return this.http.get<StepperStep[]>(`${this.apiUrl}/leave/${id}/stepper`);
  }

  getHistory(id: string): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(`${this.apiUrl}/leave/${id}/history`);
  }

  approve(id: string, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`${this.apiUrl}/approval/${id}/approve`, { remark });
  }

  sendBack(id: string, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`${this.apiUrl}/approval/${id}/sendback`, { remark });
  }

  reject(id: string, remark: string): Observable<Leave> {
    return this.http.post<Leave>(`${this.apiUrl}/approval/${id}/reject`, { remark });
  }

  // ── My History & Balance ──

  getMyHistory(year: number): Observable<LeaveHistoryItem[]> {
    return this.http.get<LeaveHistoryItem[]>(`${this.apiUrl}/leave/my-history?year=${year}`);
  }

  getMyBalance(year: number): Observable<LeaveBalance[]> {
    return this.http.get<LeaveBalance[]>(`${this.apiUrl}/leave/my-balance?year=${year}`);
  }

  // ── File Management ──

  uploadFile(id: string, files: File[]): Observable<any> {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    return this.http.post(`${this.apiUrl}/leave/${id}/files`, formData);
  }

  getFiles(id: string): Observable<UploadedFile[]> {
    return this.http.get<UploadedFile[]>(`${this.apiUrl}/leave/${id}/files`);
  }

  deleteFile(id: string, fileId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leave/${id}/files/${fileId}`);
  }

  downloadFile(id: string, fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/leave/${id}/files/${fileId}`, { responseType: 'blob' });
  }

  uploadVerificationFile(id: string, files: File[]): Observable<any> {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    return this.http.post(`${this.apiUrl}/approval/${id}/files`, formData);
  }

  // ── Document Verification ──

  pretempPass(id: string, remark: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approval/${id}/pretemp/pass`, { remark });
  }

  pretempSendBack(id: string, remark: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approval/${id}/pretemp/sendback`, { remark });
  }

  tempPass(id: string, remark: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approval/${id}/temp/pass`, { remark });
  }

  tempSendBack(id: string, remark: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approval/${id}/temp/sendback`, { remark });
  }
}
