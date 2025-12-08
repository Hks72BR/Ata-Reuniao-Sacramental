/**
 * Configuração do Firebase
 * Sincronização de Atas Sacramentais na nuvem
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYaN3GTy8nI-wR9xa3OhFhUCDj1QVzRYY",
  authDomain: "ata-sacramental-829c1.firebaseapp.com",
  projectId: "ata-sacramental-829c1",
  storageBucket: "ata-sacramental-829c1.firebasestorage.app",
  messagingSenderId: "474847726992",
  appId: "1:474847726992:web:425cd4cf64661ef27f7715"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Nome da coleção
export const COLLECTION_NAME = 'atas-sacramentais';
