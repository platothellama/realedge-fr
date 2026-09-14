export const environment = {
  production: true,
  apiUrl: 'https://realedge-frontend.onrender.com/api',
  // PHASE 1: injected at build time from GOOGLE_MAPS_API_KEY env
  // (see inject-env.js + .env.example). Never hardcode the key here.
  GOOGLE_MAPS_API_KEY: ''
};
