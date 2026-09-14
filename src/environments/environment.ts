export const environment = {
  production: false,
  // Local backend. Use `ng serve --configuration production` (or the
  // deployed build) to target the hosted API instead.
  apiUrl: 'http://localhost:8000/api',
  // PHASE 1: no hardcoded Maps key. Local dev: set GOOGLE_MAPS_API_KEY in
  // realedge-fr/.env (see .env.example) or export it before building; the
  // production build injects it via inject-env.js. Empty = maps disabled
  // with a clear error (app still boots).
  GOOGLE_MAPS_API_KEY: ''
};
