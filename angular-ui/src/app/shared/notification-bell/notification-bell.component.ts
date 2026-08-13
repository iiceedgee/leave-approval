import { Component, HostListener, OnInit } from '@angular/core';

export interface MockNotification {
  id: number;
  type: string;
  title: string;
  detail: string;
  time: string;
  isRead: boolean;
  actionLink: string;
}

@Component({
  standalone: false,
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit {
  notifications: MockNotification[] = [
    {
      id: 12,
      type: 'sendback',
      title: 'คำขอลา #12 ถูกส่งกลับให้แก้ไข',
      detail: 'เอกสารไม่ครบถ้วน กรุณาแก้ไขและส่งคำขอใหม่อีกครั้ง',
      time: '2026-08-05T10:45:00',
      isRead: false,
      actionLink: '/leave/12/edit'
    },
    {
      id: 8,
      type: 'approved',
      title: 'คำขอลา #8 ได้รับอนุมัติเรียบร้อยแล้ว',
      detail: 'หัวหน้าอนุมัติคำขอลาของคุณเรียบร้อย',
      time: '2026-08-05T09:20:00',
      isRead: false,
      actionLink: '/leave/8'
    },
    {
      id: 5,
      type: 'rejected',
      title: 'คำขอลา #5 ถูกไม่อนุมัติ',
      detail: 'คำขอไม่ผ่านการอนุมัติ เนื่องจากติดภารกิจสำคัญของหน่วยงาน',
      time: '2026-08-04T16:10:00',
      isRead: false,
      actionLink: '/leave/5'
    },
    {
      id: 3,
      type: 'pending',
      title: 'คำขอลา #3 รอตรวจสอบ',
      detail: 'คำขอของคุณอยู่ระหว่างรอตรวจสอบเอกสาร',
      time: '2026-08-03T11:05:00',
      isRead: true,
      actionLink: '/leave/3'
    }
  ];

  showNotifications = false;
  unreadCount = 0;

  ngOnInit(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNotifications = false;
  }

  toggleNotifications($event: Event): void {
    $event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  stampRead(n: MockNotification): void {
    if (!n.isRead) {
      n.isRead = true;
      this.unreadCount = this.notifications.filter(x => !x.isRead).length;
    }
  }
}
