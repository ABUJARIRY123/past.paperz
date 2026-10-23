// src/utils/api.js
// Calls your Express backend with the current Supabase access token.
import { supabase } from '../supabaseClient'; // adjust to your Supabase client path

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

// Captured before installAuthFetch runs, so apiFetch never goes through the wrapper twice.
const rawFetch = window.fetch.bind(window);

// getSession refreshes the access token automatically when it has expired.
export async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export async function authHeaders() {
  const token = await getAccessToken();
  if (!token) throw new Error('You are signed out. Please sign in again.');
  return { Authorization: `Bearer ${token}` };
}

// Returns parsed JSON and throws an Error (with .status) on any non-2xx response.
export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('You are signed out. Please sign in again.');

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const isForm = options.body instanceof FormData;

  const res = await rawFetch(url, {
    ...options,
    headers: {
      // Let the browser set the multipart boundary for FormData uploads.
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      data.message || data.error || `${options.method || 'GET'} ${url} returned ${res.status}`
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

// Wraps window.fetch once, so every plain fetch() to your backend carries a fresh,
// valid token, overriding whatever the calling file put in the header
// ("Bearer undefined", a stale Redux token, and so on).
export function installAuthFetch() {
  if (window.__authFetchInstalled) return;
  window.__authFetchInstalled = true;

  window.fetch = async (input, init = {}) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    const isApi = url.startsWith(API_BASE) || url.startsWith('/api');
    if (!isApi) return rawFetch(input, init);

    const token = await getAccessToken();
    const headers = new Headers(
      init.headers || (input instanceof Request ? input.headers : undefined)
    );

    if (token) headers.set('Authorization', `Bearer ${token}`);
    else headers.delete('Authorization'); // server then answers "Sign in to continue"

    return rawFetch(input, { ...init, headers });
  };
}

// If any file uses axios, add this once where the instance is created:
// axios.interceptors.request.use(async (config) => {
//   const token = await getAccessToken();
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   else delete config.headers.Authorization;
//   return config;
// });