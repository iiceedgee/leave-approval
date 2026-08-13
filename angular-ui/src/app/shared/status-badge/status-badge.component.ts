import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  private readonly statusMap: Record<string, string> = {
    F: 'รอดำเนินการ',
    P: 'รอตรวจสอบเอกสาร',
    T: 'ตรวจสอบความถูกต้อง',
    M: 'รอหัวหน้าตรวจสอบ',
    S: 'อนุมัติแล้ว',
    B: 'ส่งกลับแก้ไข',
    C: 'ยกเลิก',
    U: 'ไม่อนุมัติ',
  };

  @Input() statusCode = 'F';

  get label(): string { return this.statusMap[this.statusCode] || this.statusCode; }
}
