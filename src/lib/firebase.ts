/**
 * Configuração do Firebase
 * Sincronização de Atas Sacramentais na nuvem
 * 
 * SEGURANÇA:
 * - Credenciais carregadas de variáveis de ambiente
 * - Não exponha credenciais no código
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function requireFirebaseSetting(name: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`Configure ${name} no ambiente antes de iniciar o aplicativo.`);
  return value.trim();
}

// Sem projeto padrão: evita conectar a um ambiente diferente por engano.
const firebaseConfig = {
  apiKey: requireFirebaseSetting('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: requireFirebaseSetting('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: requireFirebaseSetting('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: requireFirebaseSetting('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requireFirebaseSetting('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: requireFirebaseSetting('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID)
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore e Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Nome da coleção
export const COLLECTION_NAME = 'atas-sacramentais';
