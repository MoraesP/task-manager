import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { IS_AUTH_REQUEST } from './api.config';
import { AuthService } from './auth.service';
import { TokenResponse } from './models';

let refreshInFlight: Observable<TokenResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const withToken = (request: HttpRequest<unknown>): HttpRequest<unknown> => {
    const token = auth.accessToken;
    return token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  };

  const isAuthRequest = req.context.get(IS_AUTH_REQUEST);

  return next(withToken(req)).pipe(
    catchError((err: unknown) => {
      if (
        !(err instanceof HttpErrorResponse) ||
        err.status !== 401 ||
        isAuthRequest ||
        !auth.accessToken
      ) {
        return throwError(() => err);
      }
      return refresh(auth, next, req, withToken, router);
    }),
  );
};

function refresh(
  auth: AuthService,
  next: HttpHandlerFn,
  original: HttpRequest<unknown>,
  withToken: (r: HttpRequest<unknown>) => HttpRequest<unknown>,
  router: Router,
): Observable<import('@angular/common/http').HttpEvent<unknown>> {
  if (!refreshInFlight) {
    refreshInFlight = auth.refreshToken().pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }
  return refreshInFlight.pipe(
    switchMap(() => {
      refreshInFlight = null;
      return next(withToken(original));
    }),
    catchError((err: unknown) => {
      refreshInFlight = null;
      auth.logout();
      router.navigate(['/entrar']);
      return throwError(() => err);
    }),
  );
}
