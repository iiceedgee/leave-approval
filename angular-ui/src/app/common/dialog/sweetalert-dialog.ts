import { Injectable } from '@angular/core';
import { Dialog } from './dialog';
import Swal from 'sweetalert2';

@Injectable()
export class SweetAlertDialog extends Dialog {
  constructor() {
    super();
  }

  info(title: string, message?: string, btnText?: string): Promise<void> {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: `<i class="fa fa-thumbs-up"></i> ${btnText || 'ตกลง'}`,
      showConfirmButton: true
    }).then();
  }

  error(title: string, message?: string, btnText?: string): Promise<void> {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      denyButtonText: `<i class="far fa-frown"></i> ${btnText || 'ตกลง'}`,
      showDenyButton: true,
      showConfirmButton: false
    }).then();
  }

  warning(title: string, message?: string, btnText?: string): Promise<void> {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: `<i class="fa fa-thumbs-up"></i> ${btnText || 'ตกลง'}`,
      showConfirmButton: true
    }).then();
  }

  confirm(title: string, message?: string, okText?: string, cancelText?: string): Promise<boolean> {
    return new Promise(r => {
      Swal.fire({
        title,
        text: message,
        icon: 'question',
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonText: `<i class="fa fa-thumbs-up"></i> ${okText || 'ใช่'}`,
        denyButtonText: `<i class="fa fa-thumbs-down"></i> ${cancelText || 'ไม่'}`
      }).then(sr => r(sr.isConfirmed));
    });
  }

  pass(title: string, message?: string, btnText?: string): Promise<void> {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: `${btnText || 'ตกลง'}`,
      showConfirmButton: true
    }).then();
  }
}
