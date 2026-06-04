import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import { AuthResponse, AuthUser, LoginRequest } from '@shared/models';

const ACCESS_TOKEN_KEY  = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';
const USER_KEY          = 'crm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  // ── Signals ──────────────────────────────────────────────────────────────
  private _user    = signal<AuthUser | null>(this.loadUser());
  private _loading = signal(false);

  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isAdmin    = computed(() => this._user()?.role === 'ADMIN');

  // ── Auth ──────────────────────────────────────────────────────────────────
  login(req: LoginRequest) {
    this._loading.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => {
        this.saveTokens(res);
        this._user.set({ email: res.email, role: res.role as AuthUser['role'] });
        this._loading.set(false);
      }),
      catchError(err => {
        this._loading.set(false);
        throw err;
      })
    );
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return EMPTY;
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private saveTokens(res: AuthResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    const user: AuthUser = { email: res.email, role: res.role as AuthUser['role'] };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
