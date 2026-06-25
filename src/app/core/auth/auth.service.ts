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

  private _user    = signal<AuthUser | null>(this.loadUser());
  private _loading = signal(false);

  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isMaster   = computed(() => this._user()?.role === 'MASTER');
  readonly isMasterAdminMode = computed(() => this.isMaster() && !!this._user()?.adminMode);
  readonly isMasterTenantMode = computed(() => this.isMaster() && !this._user()?.adminMode);
  readonly isAdmin    = computed(() => this._user()?.role === 'ADMIN' || this.isMaster());
  readonly tenantId   = computed(() => this._user()?.tenantId ?? null);
  readonly databaseName = computed(() => this._user()?.databaseName ?? null);
  readonly tenantName = computed(() => this._user()?.tenantName ?? null);

  login(req: LoginRequest) {
    this._loading.set(true);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => {
        this.applyAuthResponse(res);
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
      tap(res => this.applyAuthResponse(res))
    );
  }

  logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  hasRefreshToken(): boolean {
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  forceLogoutToLogin(): void {
    const wasLoggedIn = this.isLoggedIn();
    this.clearSession();
    if (wasLoggedIn) {
      const returnUrl = this.router.routerState.snapshot.url;
      this.router.navigate(['/auth/login'], {
        queryParams: returnUrl && returnUrl !== '/' ? { returnUrl } : {},
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  applyAuthResponse(res: AuthResponse): void {
    this.saveTokens(res);
    this._user.set({
      email:        res.email,
      role:         res.role as AuthUser['role'],
      tenantId:     res.tenantId ?? null,
      databaseName: res.databaseName ?? null,
      adminMode:    res.adminMode ?? null,
      tenantName:   res.tenantName ?? null,
    });
  }

  private saveTokens(res: AuthResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    const user: AuthUser = {
      email:        res.email,
      role:         res.role as AuthUser['role'],
      tenantId:     res.tenantId ?? null,
      databaseName: res.databaseName ?? null,
      adminMode:    res.adminMode ?? null,
      tenantName:   res.tenantName ?? null,
    };
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
