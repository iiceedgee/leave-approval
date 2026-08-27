/**
 * Environment configuration — Production (Vercel — Frontend Project A)
 *
 * - Dev (`environment.ts`) uses `apiUrl: '/api'` proxied by `proxy.conf.json` to http://localhost:3000.
 * - Prod uses absolute URL of the separate API project deployed on Vercel.
 *   Placeholder: `https://leave-api.vercel.app/api` — REPLACE with your real API URL after deploying `api/`.
 *   Example: if API project URL is `https://my-leave-api-abc123.vercel.app`, set:
 *     apiUrl: 'https://my-leave-api-abc123.vercel.app/api'
 *
 * This file is swapped in via `angular.json > configurations.production.fileReplacements`
 * when running `ng build --configuration production`.
 *
 * Vercel frontend rewrites (vercel.json) also proxy `/api/*` to the same API for same-origin fallback.
 */
export const environment = {
  production: true,
  apiUrl: 'https://leave-approval-api.vercel.app/api',
};
