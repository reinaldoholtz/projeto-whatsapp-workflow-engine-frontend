import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { Toast } from '@shared/models';

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800', icon: 'check_circle', iconColor: 'text-emerald-500' },
  error:   { bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',                 icon: 'error',         iconColor: 'text-red-500'     },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',         icon: 'warning',       iconColor: 'text-amber-500'   },
  info:    { bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',              icon: 'info',          iconColor: 'text-blue-500'    },
};

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in"
          [ngClass]="styles(toast).bg"
        >
          <span class="material-icons-round text-xl flex-shrink-0 mt-0.5" [ngClass]="styles(toast).iconColor">
            {{ styles(toast).icon }}
          </span>
          <p class="text-sm text-gray-800 dark:text-gray-100 flex-1">{{ toast.message }}</p>
          <button
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            (click)="toastService.dismiss(toast.id)"
          >
            <span class="material-icons-round text-lg">close</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
  styles(toast: Toast) { return TOAST_STYLES[toast.type]; }
}
