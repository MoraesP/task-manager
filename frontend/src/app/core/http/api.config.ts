import { HttpContextToken } from '@angular/common/http';

/** Base da API. Em dev o `proxy.conf.json` encaminha `/api` para o backend. */
export const API_BASE = '/api/v1';

export const ACCESS_TOKEN_KEY = 'tm.accessToken';
export const REFRESH_TOKEN_KEY = 'tm.refreshToken';

/**
 * Marca uma requisição para NÃO exibir toast automático de erro — o componente
 * trata o erro por conta própria (ex.: reverter card no quadro).
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** Marca requisições de autenticação, que o interceptor de refresh deve ignorar. */
export const IS_AUTH_REQUEST = new HttpContextToken<boolean>(() => false);
