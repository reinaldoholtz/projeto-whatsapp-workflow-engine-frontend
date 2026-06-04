import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>(
    (localStorage.getItem('crm_theme') as Theme) ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  readonly theme     = this._theme.asReadonly();
  readonly isDark    = () => this._theme() === 'dark';

  constructor() {
    effect(() => {
      const t = this._theme();
      document.documentElement.classList.toggle('dark', t === 'dark');
      localStorage.setItem('crm_theme', t);
    });
    // Apply immediately on init
    document.documentElement.classList.toggle('dark', this.isDark());
  }

  toggle() {
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme) {
    this._theme.set(theme);
  }
}
