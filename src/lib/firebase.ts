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

// Configuração do Firebase a partir de variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYaN3GTy8nI-wR9xa3OhFhUCDj1QVzRYY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ata-sacramental-829c1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ata-sacramental-829c1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ata-sacramental-829c1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "474847726992",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:474847726992:web:425cd4cf64661ef27f7715"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Nome da coleção
export const COLLECTION_NAME = 'atas-sacramentais';
