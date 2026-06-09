import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900
                flex items-center justify-center p-4">

      <!-- Theme toggle -->
      <button
        (click)="themeService.toggle()"
        class="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg
               text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <span class="material-icons-round">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-900/50">
            <span class="material-icons-round text-white text-3xl">chat</span>
          </div>
          <h1 class="text-2xl font-bold text-white">CRM WhatsApp</h1>
          <p class="text-slate-400 text-sm mt-1">Gestão de WhatsApp — Imóveis</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-white/10">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Entrar na sua conta</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                E-mail
              </label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  email
                </span>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="admin@corretor.com.br"
                  class="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl
                         bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                         transition-colors placeholder-gray-400"
                />
              </div>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-red-500 text-xs mt-1">E-mail inválido</p>
              }
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Senha
              </label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  lock
                </span>
                <input
                  [type]="showPass() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-slate-600 rounded-xl
                         bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                         transition-colors placeholder-gray-400"
                />
                <button type="button"
                        (click)="togglePassword()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <span class="material-icons-round text-lg">
                    {{ showPass() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Error -->
            @if (error()) {
              <div class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                          dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <span class="material-icons-round text-base">error</span>
                {{ error() }}
              </div>
            }

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || auth.loading()"
              class="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50
                     disabled:cursor-not-allowed text-white font-semibold rounded-xl
                     transition-colors duration-200 flex items-center justify-center gap-2"
            >
              @if (auth.loading()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Entrando...
              } @else {
                <span class="material-icons-round text-base">login</span>
                Entrar
              }
            </button>
          </form>

          <p class="text-center text-xs text-gray-400 mt-6">
            CRM WhatsApp v1.0 — Imóveis
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  auth           = inject(AuthService);
  themeService   = inject(ThemeService);
  private toast  = inject(ToastService);

  showPass = signal(false);
  error    = signal('');

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  togglePassword(): void {
    this.showPass.update(v => !v);
  }
  
  onSubmit() {
    if (this.form.invalid) return;
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.toast.success('Login realizado com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const message =
          err?.error?.message ||
          (err.status === 401
            ? 'Usuário ou senha inválidos.'
            : 'Erro ao conectar. Tente novamente.');

        this.error.set(message);
      }
    });
  }
}
