import { loadEnv } from 'vite';

const mode = process.argv[2] || 'development';
const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
const requiredPins = ['VITE_SACRAMENTAL_PIN', 'VITE_BAPTISMAL_PIN', 'VITE_WARD_COUNCIL_PIN', 'VITE_DELETE_PIN'];
const requiredFirebase = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID'];
let valid = true;
for (const name of [...requiredPins, ...requiredFirebase, 'VITE_WARD_COUNCIL_ADMIN_PIN']) {
  const value = env[name];
  if (name === 'VITE_WARD_COUNCIL_ADMIN_PIN' && !value) {
    console.log(`${name}: utiliza VITE_DELETE_PIN`);
    continue;
  }
  const configured = name.endsWith('_PIN') ? /^\d{4}$/.test(value || '') : Boolean(value?.trim());
  console.log(`${name}: ${configured ? 'configurada' : 'ausente ou inválida'}`);
  valid = valid && configured;
}
process.exitCode = valid ? 0 : 1;
