// PHASE 1 (production hardening): GOOGLE_MAPS_API_KEY comes from the
// environment, never from hardcoded source.
//
// Sources (first set wins):
//   1. process.env.GOOGLE_MAPS_API_KEY (CI secret — preferred for builds)
//   2. realedge-fr/.env  (local dev convenience, gitignored — see .env.example)
//
// Behavior:
//   - Key present: injected into src/environments/environment.prod.ts
//     (idempotent — safe to run repeatedly; no-op when already injected).
//   - Key absent: files untouched, warning printed; the app boots with maps
//     disabled (GoogleMapsService rejects with a clear error).
//
// NOTE: a browser key is public by nature. After rotating the previously
// hardcoded key, restrict it in Google Cloud Console: HTTP referrers
// (production domain + localhost for dev) and only the Maps JavaScript API
// + Places API.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const localEnv = dotenv.config({ path: path.resolve(__dirname, '.env') }).parsed || {};
const apiKey = process.env.GOOGLE_MAPS_API_KEY || localEnv.GOOGLE_MAPS_API_KEY || '';

if (!apiKey) {
  console.log('WARNING: GOOGLE_MAPS_API_KEY not set — production build will ship with maps disabled.');
  process.exit(0);
}

const prodEnvPath = path.resolve(__dirname, 'src/environments/environment.prod.ts');
let content = fs.readFileSync(prodEnvPath, 'utf8');
const next = content.replace(
  /GOOGLE_MAPS_API_KEY:\s*'[^']*'/,
  `GOOGLE_MAPS_API_KEY: '${apiKey}'`
);
if (next === content) {
  console.log('WARNING: GOOGLE_MAPS_API_KEY placeholder not found in environment.prod.ts — nothing injected.');
  process.exit(0);
}
fs.writeFileSync(prodEnvPath, next);
console.log('Google Maps API key injected into environment.prod.ts from environment (not committed).');
