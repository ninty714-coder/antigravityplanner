// Client API centralisé pour toutes les communications avec le backend.
// - Envoie toujours les cookies (session httpOnly) via `credentials: 'include'`.
// - Ajoute automatiquement le header CSRF (double-submit cookie) sur les
//   requêtes de mutation (POST/PUT/PATCH/DELETE).
// - Tente un rafraîchissement de session silencieux (refresh token) une seule
//   fois en cas de 401, avant d'abandonner et de renvoyer l'utilisateur vers
//   l'écran de connexion.

const configuredApiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;

if (!configuredApiUrl && (import.meta as any).env?.PROD) {
  // En production (build Vite), VITE_API_URL est figée au moment du build.
  // Sans elle on retomberait sur localhost:4000, injoignable depuis le
  // navigateur de l'utilisateur final -> on préfère échouer bruyamment ici
  // avec un message clair plutôt que de laisser des ERR_CONNECTION_REFUSED
  // silencieux sur chaque appel API.
  // eslint-disable-next-line no-console
  console.error(
    "[config] VITE_API_URL n'est pas définie pour ce build de production. " +
      "Définissez-la dans les variables d'environnement de votre hébergeur " +
      '(ex: Vercel > Settings > Environment Variables) puis redéployez.'
  );
}

export const API_BASE_URL = configuredApiUrl || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  code: string;
  payload: any;
  constructor(status: number, code: string, message: string, payload?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  skipRefreshRetry?: boolean;
}

async function rawRequest(path: string, options: RequestOptions = {}) {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const isMutation = method !== 'GET';
  if (isMutation) {
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'error', data?.message || 'Une erreur est survenue.', data);
  }

  return data;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rawRequest('/api/auth/refresh', { method: 'POST' })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiRequest(path: string, options: RequestOptions = {}) {
  try {
    return await rawRequest(path, options);
  } catch (err) {
    const isAuthRoute = path.startsWith('/api/auth/');
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !options.skipRefreshRetry &&
      !isAuthRoute
    ) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return rawRequest(path, { ...options, skipRefreshRetry: true });
      }
    }
    throw err;
  }
}

export const api = {
  get: (path: string) => apiRequest(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => apiRequest(path, { method: 'POST', body }),
  put: (path: string, body?: unknown) => apiRequest(path, { method: 'PUT', body }),
  patch: (path: string, body?: unknown) => apiRequest(path, { method: 'PATCH', body }),
  delete: (path: string, body?: unknown) => apiRequest(path, { method: 'DELETE', body }),
};
