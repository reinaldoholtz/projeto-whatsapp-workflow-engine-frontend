import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 4000) {
    const id = crypto.randomUUID();
    this._toasts.update(t => [...t, { id, type, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string)   { this.show(message, 'error', 6000); }
  warning(message: string) { this.show(message, 'warning'); }
  info(message: string)    { this.show(message, 'info'); }

  dismiss(id: string) {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
