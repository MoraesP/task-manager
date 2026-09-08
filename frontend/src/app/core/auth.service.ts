import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { API_BASE, ACCESS_TOKEN_KEY, IS_AUTH_REQUEST, REFRESH_TOKEN_KEY } from './api.config';
import { AuthUser, TokenResponse } from './models';

const authCtx = () => new HttpContext().set(IS_AUTH_REQUEST, true);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _sessionChecked = signal(false);

  readonly user = this._user.asReadonly();
  readonly sessionChecked = this._sessionChecked.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  private get refreshTokenValue(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /** Chamado no bootstrap: recupera a sessão a partir do token guardado. */
  initialize(): Promise<void> {
    if (!this.accessToken) {
      this._sessionChecked.set(true);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.http.get<AuthUser>(`${API_BASE}/users/me`).subscribe({
        next: (u) => {
          this._user.set(u);
          this._sessionChecked.set(true);
          resolve();
        },
        error: () => {
          this.clear();
          this._sessionChecked.set(true);
          resolve();
        },
      });
    });
  }

  register(name: string, email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(
      `${API_BASE}/auth/register`,
      { name, email, password },
      { context: authCtx() },
    );
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<TokenResponse>(`${API_BASE}/auth/login`, { email, password }, { context: authCtx() })
      .pipe(switchMap((t) => this.completeAuth(t)));
  }

  acceptInvitation(token: string, name?: string, password?: string): Observable<AuthUser> {
    return this.http
      .post<TokenResponse>(
        `${API_BASE}/auth/accept-invitation`,
        { token, name: name || null, password: password || null },
        { context: authCtx() },
      )
      .pipe(switchMap((t) => this.completeAuth(t)));
  }

  refreshToken(): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(
        `${API_BASE}/auth/refresh`,
        { refreshToken: this.refreshTokenValue },
        { context: authCtx() },
      )
      .pipe(tap((t) => this.storeTokens(t)));
  }

  logout(): void {
    const refreshToken = this.refreshTokenValue;
    if (refreshToken) {
      this.http.post(`${API_BASE}/auth/logout`, { refreshToken }, { context: authCtx() }).subscribe({
        error: () => void 0,
      });
    }
    this.clear();
  }

  private completeAuth(tokens: TokenResponse): Observable<AuthUser> {
    this.storeTokens(tokens);
    return this.http
      .get<AuthUser>(`${API_BASE}/users/me`)
      .pipe(tap((u) => this._user.set(u)));
  }

  private storeTokens(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._user.set(null);
  }
}
