import { Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  template: `
    <header class="fixed top-0 right-0 left-64 z-30 h-16 bg-white dark:bg-slate-800
                   border-b border-gray-100 dark:border-slate-700 flex items-center px-6 gap-4">

      <!-- Search -->
      <div class="flex-1 max-w-md">
        <div class="relative">
          <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar leads, workflows..."
            class="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200
                   dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-200
                   placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40
                   transition-colors"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <!-- Theme toggle -->
        <button
          (click)="themeService.toggle()"
          class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400
                 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          [title]="themeService.isDark() ? 'Modo claro' : 'Modo escuro'"
        >
          <span class="material-icons-round text-xl">
            {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>

        <!-- Notifications -->
        <button class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors relative">
          <span class="material-icons-round text-xl">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- Profile dropdown -->
        <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-600">
          <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-semibold">
              {{ auth.user()?.email?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div class="hidden sm:block">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
              {{ auth.user()?.email }}
            </p>
            <p class="text-xs text-gray-400">{{ auth.user()?.role }}</p>
          </div>
          <button
            (click)="auth.logout()"
            title="Sair"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                   hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors ml-1"
          >
            <span class="material-icons-round text-lg">logout</span>
          </button>
        </div>
      </div>
    </header>
  `
})
export class TopbarComponent {
  auth         = inject(AuthService);
  themeService = inject(ThemeService);
  menuToggle   = output<void>();
}
