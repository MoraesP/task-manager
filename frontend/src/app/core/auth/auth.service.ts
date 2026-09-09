import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthUser, TokenResponse } from '@shared/models';
import {
  ACCESS_TOKEN_KEY,
  API_BASE,
  IS_AUTH_REQUEST,
  REFRESH_TOKEN_KEY,
} from '@core/http/api.config';

const contextoDeAutenticacao = () => new HttpContext().set(IS_AUTH_REQUEST, true);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _usuario = signal<AuthUser | null>(null);
  private readonly _sessaoVerificada = signal(false);

  readonly usuario = this._usuario.asReadonly();
  readonly sessaoVerificada = this._sessaoVerificada.asReadonly();
  readonly estaAutenticado = computed(() => this._usuario() !== null);

  get tokenDeAcesso(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  private get valorDoRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /** Chamado no bootstrap: recupera a sessão a partir do token guardado. */
  inicializar(): Promise<void> {
    if (!this.tokenDeAcesso) {
      this._sessaoVerificada.set(true);
      return Promise.resolve();
    }
    return new Promise((resolver) => {
      this.http.get<AuthUser>(`${API_BASE}/users/me`).subscribe({
        next: (usuario) => {
          this._usuario.set(usuario);
          this._sessaoVerificada.set(true);
          resolver();
        },
        error: () => {
          this.limpar();
          this._sessaoVerificada.set(true);
          resolver();
        },
      });
    });
  }

  registrar(name: string, email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(
      `${API_BASE}/auth/register`,
      { name, email, password },
      { context: contextoDeAutenticacao() },
    );
  }

  entrar(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<TokenResponse>(
        `${API_BASE}/auth/login`,
        { email, password },
        { context: contextoDeAutenticacao() },
      )
      .pipe(switchMap((tokens) => this.concluirAutenticacao(tokens)));
  }

  aceitarConvite(token: string, name?: string, password?: string): Observable<AuthUser> {
    return this.http
      .post<TokenResponse>(
        `${API_BASE}/auth/accept-invitation`,
        { token, name: name || null, password: password || null },
        { context: contextoDeAutenticacao() },
      )
      .pipe(switchMap((tokens) => this.concluirAutenticacao(tokens)));
  }

  renovarToken(): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(
        `${API_BASE}/auth/refresh`,
        { refreshToken: this.valorDoRefreshToken },
        { context: contextoDeAutenticacao() },
      )
      .pipe(tap((tokens) => this.guardarTokens(tokens)));
  }

  sair(): void {
    const refreshToken = this.valorDoRefreshToken;
    if (refreshToken) {
      this.http
        .post(`${API_BASE}/auth/logout`, { refreshToken }, { context: contextoDeAutenticacao() })
        .subscribe({
          error: () => void 0,
        });
    }
    this.limpar();
  }

  private concluirAutenticacao(tokens: TokenResponse): Observable<AuthUser> {
    this.guardarTokens(tokens);
    return this.http
      .get<AuthUser>(`${API_BASE}/users/me`)
      .pipe(tap((usuario) => this._usuario.set(usuario)));
  }

  private guardarTokens(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private limpar(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._usuario.set(null);
  }
}
