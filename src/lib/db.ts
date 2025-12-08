/**
 * IndexedDB Database Service + Firebase Firestore
 * Sincronização híbrida: Firestore (nuvem) + IndexedDB (local/backup)
 */

import { SacramentalRecord } from '@/types';
import {
  saveRecordToCloud,
  getAllRecordsFromCloud,
  deleteRecordFromCloud,
  searchRecordsByDateInCloud,
} from './firestore';

const DB_NAME = 'AtaSacramentalDB';
const DB_VERSION = 1;
const STORE_NAME = 'sacramentalRecords';

let db: IDBDatabase | null = null;
let useCloud = true; // Flag para usar Firebase por padrão

// Tentar detectar se Firebase está configurado
try {
  import('./firebase');
} catch {
  useCloud = false;
  console.warn('Firebase não configurado, usando apenas IndexedDB local');
}

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Erro ao abrir banco de dados'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Criar object store se não existir
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Criar índices para busca rápida
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function getDB(): Promise<IDBDatabase> {
  if (db) {
    return db;
  }
  return initDB();
}

/**
 * Salvar uma nova ata ou atualizar existente
 * Prioriza Firestore, fallback para IndexedDB
 */
export async function saveRecord(record: SacramentalRecord): Promise<string> {
  const id = record.id || generateId();
  
  const recordToSave: SacramentalRecord = {
    ...record,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: record.createdAt || new Date().toISOString(),
  };

  // Tentar salvar no Firestore primeiro
  if (useCloud) {
    try {
      const cloudId = await saveRecordToCloud(recordToSave);
      // Salvar cópia local como backup
      await saveRecordLocal(recordToSave);
      return cloudId;
    } catch (error) {
      console.warn('Erro ao salvar no Firestore, usando IndexedDB:', error);
      // Se falhar, salva apenas localmente
      return saveRecordLocal(recordToSave);
    }
  }

  // Modo offline - salvar apenas localmente
  return saveRecordLocal(recordToSave);
}

/**
 * Salvar ata localmente no IndexedDB
 */
async function saveRecordLocal(record: SacramentalRecord): Promise<string> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onerror = () => {
      reject(new Error('Erro ao salvar ata localmente'));
    };

    request.onsuccess = () => {
      resolve(record.id!);
    };
  });
}

/**
 * Obter uma ata pelo ID
 */
export async function getRecord(id: string): Promise<SacramentalRecord | null> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => {
      reject(new Error('Erro ao buscar ata'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

/**
 * Obter todas as atas
 * Prioriza Firestore, fallback para IndexedDB
 */
export async function getAllRecords(): Promise<SacramentalRecord[]> {
  // Tentar buscar do Firestore primeiro
  if (useCloud) {
    try {
      const records = await getAllRecordsFromCloud();
      // Atualizar cache local
      for (const record of records) {
        await saveRecordLocal(record).catch(() => {}); // Ignora erros de cache
      }
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('Erro ao buscar do Firestore, usando IndexedDB:', error);
      // Se falhar, busca localmente
      return getAllRecordsLocal();
    }
  }

  // Modo offline - buscar apenas localmente
  return getAllRecordsLocal();
}

/**
 * Obter todas as atas do IndexedDB local
 */
async function getAllRecordsLocal(): Promise<SacramentalRecord[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('Erro ao buscar atas localmente'));
    };

    request.onsuccess = () => {
      const records = request.result;
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(records);
    };
  });
}

/**
 * Buscar atas por data
 * Prioriza Firestore, fallback para IndexedDB
 */
export async function searchRecordsByDate(date: string): Promise<SacramentalRecord[]> {
  // Tentar buscar do Firestore primeiro
  if (useCloud) {
    try {
      return await searchRecordsByDateInCloud(date);
    } catch (error) {
      console.warn('Erro ao buscar do Firestore, usando IndexedDB:', error);
      // Se falhar, busca localmente
      return searchRecordsByDateLocal(date);
    }
  }

  // Modo offline - buscar apenas localmente
  return searchRecordsByDateLocal(date);
}

/**
 * Buscar atas por data no IndexedDB local
 */
async function searchRecordsByDateLocal(date: string): Promise<SacramentalRecord[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    const request = index.getAll(date);

    request.onerror = () => {
      reject(new Error('Erro ao buscar atas por data localmente'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Buscar atas por intervalo de datas
 */
export async function searchRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<SacramentalRecord[]> {
  const allRecords = await getAllRecords();

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return allRecords.filter((record) => {
    const recordDate = new Date(record.date).getTime();
    return recordDate >= start && recordDate <= end;
  });
}

/**
 * Deletar uma ata
 * Deleta do Firestore e do IndexedDB
 */
export async function deleteRecord(id: string): Promise<void> {
  // Tentar deletar do Firestore primeiro
  if (useCloud) {
    try {
      await deleteRecordFromCloud(id);
    } catch (error) {
      console.warn('Erro ao deletar do Firestore:', error);
    }
  }

  // Deletar localmente também
  await deleteRecordLocal(id);
}

/**
 * Deletar ata do IndexedDB local
 */
async function deleteRecordLocal(id: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      reject(new Error('Erro ao deletar ata localmente'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Buscar atas por status
 */
export async function getRecordsByStatus(
  status: 'draft' | 'completed' | 'archived'
): Promise<SacramentalRecord[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll(status);

    request.onerror = () => {
      reject(new Error('Erro ao buscar atas por status'));
    };

    request.onsuccess = () => {
      const records = request.result.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      resolve(records);
    };
  });
}

/**
 * Exportar todas as atas como JSON
 */
export async function exportAllRecords(): Promise<string> {
  const records = await getAllRecords();
  return JSON.stringify(records, null, 2);
}

/**
 * Importar atas de um arquivo JSON
 */
export async function importRecords(jsonData: string): Promise<number> {
  try {
    const records = JSON.parse(jsonData) as SacramentalRecord[];
    let count = 0;

    for (const record of records) {
      await saveRecord(record);
      count++;
    }

    return count;
  } catch (error) {
    throw new Error('Erro ao importar atas: formato JSON inválido');
  }
}

/**
 * Gerar ID único
 */
function generateId(): string {
  return `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Limpar todas as atas (cuidado!)
 */
export async function clearAllRecords(): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error('Erro ao limpar atas'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
