import { AppComponent } from '../../app.component';

export abstract class Dialog {
  abstract info(title?: string, message?: string, btnText?: string): Promise<void>;
  abstract error(title?: string, message?: string, btnText?: string): Promise<void>;
  abstract warning(title?: string, message?: string, btnText?: string): Promise<void>;
  abstract confirm(title?: string, message?: string, okText?: string, cancelText?: string): Promise<boolean>;
  abstract pass(title?: string, message?: string, btnText?: string): Promise<void>;
}

export interface ShowDialogOptions {
  type?: 'info' | 'error' | 'warning' | 'pass';
  title?: string;
  message: string;
  buttonText?: string;
}

export interface ShowConfirmDialogOptions {
  title?: string;
  message: string;
  okButtonText?: string;
  cancelButtonText?: string;
}

export function showDialog(options: ShowDialogOptions): Promise<void> {
  const buildedDialog = AppComponent.InjectorInstance.get(Dialog);
  const type = options.type ?? 'info';
  switch (type) {
    case 'info':
      return buildedDialog.info(options.title, options.message, options.buttonText ?? 'ปิด');
    case 'error':
      return buildedDialog.error(options.title, options.message, options.buttonText ?? 'ปิด');
    case 'warning':
      return buildedDialog.warning(options.title, options.message, options.buttonText ?? 'ปิด');
    case 'pass':
      return buildedDialog.pass(options.title, options.message, options.buttonText ?? 'ตกลง');
  }
}

export function showConfirmDialog(options: ShowConfirmDialogOptions): Promise<boolean> {
  const buildedDialog = AppComponent.InjectorInstance.get(Dialog);
  return buildedDialog.confirm(options.title, options.message, options.okButtonText ?? 'ยืนยัน', options.cancelButtonText ?? 'ปฏิเสธ');
}
