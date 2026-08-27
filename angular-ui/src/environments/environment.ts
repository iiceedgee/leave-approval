/**
 * Environment configuration — Development
 *
 * - Dev uses `apiUrl: '/api'` via Angular dev-server proxy (proxy.conf.json -> http://localhost:3000)
 *   so that `ng serve` avoids CORS and works with `ng serve --proxy-config proxy.conf.json`.
 * - Prod (`environment.prod.ts`) uses absolute URL of the API project on Vercel
 *   e.g. `https://leave-api.vercel.app/api` — replaced at build via fileReplacements.
 *
 * DO NOT hardcode `/api/...` in services; use `environment.apiUrl` instead.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
};
