import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {

        // Sem refresh token disponível — sessão já expirada, redireciona direto
        if (!auth.hasRefreshToken()) {
          auth.forceLogoutToLogin();
          return throwError(() => err);
        }

        return auth.refreshToken().pipe(
          switchMap(() => {
            const newToken = auth.getAccessToken();
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retried);
          }),
          catchError(() => {
            // Refresh token também expirou/inválido — força logout e redireciona
            auth.forceLogoutToLogin();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
