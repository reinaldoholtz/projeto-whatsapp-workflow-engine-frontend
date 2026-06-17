import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="space-y-6 max-w-2xl">
      <div class="page-header">
        <div>
          <h1>Configurações</h1>
          <p>Preferências do sistema</p>
        </div>
      </div>

      <!-- Appearance -->
      <div class="card p-6 space-y-4">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Aparência</h2>
        <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Modo Escuro</p>
            <p class="text-xs text-gray-400">Alterna entre tema claro e escuro</p>
          </div>
          <button
            (click)="themeService.toggle()"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            [ngClass]="themeService.isDark() ? 'bg-primary-600' : 'bg-gray-200'"
          >
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              [ngClass]="themeService.isDark() ? 'translate-x-6' : 'translate-x-1'">
            </span>
          </button>
        </div>
      </div>

      <!-- Account -->
      <div class="card p-6 space-y-4">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white">Conta</h2>
        <div class="flex items-center gap-4 py-3">
          <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
            <span class="text-white text-lg font-bold">
              {{ auth.user()?.email?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ auth.user()?.email }}</p>
            <span class="badge badge-admin">{{ auth.user()?.role }}</span>
          </div>
        </div>
        <button (click)="auth.logout()" class="btn-danger">
          <span class="material-icons-round text-base">logout</span>
          Sair da conta
        </button>
      </div>

      <!-- Info -->
      <div class="card p-6">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Sobre</h2>
        <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex justify-between"><span>Versão</span><span class="font-medium text-gray-700 dark:text-gray-300">1.0.0</span></div>
          <!-- <div class="flex justify-between"><span>Backend</span><span class="font-medium text-gray-700 dark:text-gray-300">Java 17 + Spring Boot 3</span></div>
          <div class="flex justify-between"><span>Frontend</span><span class="font-medium text-gray-700 dark:text-gray-300">Angular 19</span></div>
          <div class="flex justify-between"><span>API</span><span class="font-medium text-gray-700 dark:text-gray-300">Meta WhatsApp Cloud API</span></div> -->
        </div>
      </div>
    </div>
  `
})
export class SettingsPageComponent {
  themeService = inject(ThemeService);
  auth         = inject(AuthService);
}
