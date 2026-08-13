import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  icon: string;
  hiding: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: ToastItem[] = [];
  private toastsSubject = new BehaviorSubject<ToastItem[]>([]);
  private nextId = 1;

  readonly toasts$: Observable<ToastItem[]> = this.toastsSubject.asObservable();

  success(message: string): void {
    this.add({ type: 'success', message, icon: 'fa-check-circle' });
  }

  error(message: string): void {
    this.add({ type: 'error', message, icon: 'fa-times-circle' });
  }

  info(message: string): void {
    this.add({ type: 'info', message, icon: 'fa-info-circle' });
  }

  warning(message: string): void {
    this.add({ type: 'warning', message, icon: 'fa-exclamation-triangle' });
  }

  dismiss(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast || toast.hiding) return;
    toast.hiding = true;
    this.emit();
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.emit();
    }, 300);
  }

  private add(item: { type: ToastItem['type']; message: string; icon: string }): void {
    const toast: ToastItem = {
      id: this.nextId++,
      type: item.type,
      message: item.message,
      icon: item.icon,
      hiding: false,
    };
    this.toasts.push(toast);
    while (this.toasts.length > 5) {
      const removed = this.toasts.shift()!;
      if (removed.hiding) continue;
      removed.hiding = true;
    }
    this.emit();
    setTimeout(() => this.dismiss(toast.id), 4000);
  }

  private emit(): void {
    this.toastsSubject.next([...this.toasts]);
  }
}
