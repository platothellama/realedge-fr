const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = dotenv.config({ path: path.resolve(__dirname, '../.env') }).parsed;

const indexPath = path.resolve(__dirname, 'src/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

if (env.GOOGLE_MAPS_API_KEY) {
  indexHtml = indexHtml.replace(
    'YOUR_API_KEY_HERE',
    env.GOOGLE_MAPS_API_KEY
  );
  fs.writeFileSync(indexPath, indexHtml);
  console.log('Google Maps API key injected from .env');
} else {
  console.log('WARNING: GOOGLE_MAPS_API_KEY not found in .env');
}
