/**
 * IndexedDB Database Service + Firebase Firestore + SQLite (Native)
 * Sincronização híbrida: Firestore (nuvem) + Local (IndexedDB na Web / SQLite no Mobile)
 */

import { SacramentalRecord } from '@/types';
import { Capacitor } from '@capacitor/core';
import { sqliteService } from './sqlite';
import {
  saveRecordToCloud,
  getAllRecordsFromCloud,
  deleteRecordFromCloud,
} from './firestore';

const DB_NAME = 'AtaSacramentalDB';
const DB_VERSION = 1;
const STORE_NAME = 'sacramentalRecords';

let db: IDBDatabase | null = null;
let useCloud = true;
const isNative = Capacitor.isNativePlatform();

// Tentar detectar se Firebase está configurado
try {
  import('./firebase');
} catch {
  useCloud = false;
  console.warn('Firebase não configurado, usando apenas armazenamento local');
}

// Inicialização do Banco de Dados
export async function initDB(): Promise<void> {
  if (isNative) {
    await sqliteService.init();
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Erro ao abrir banco de dados IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

async function getIndexedDB(): Promise<IDBDatabase> {
  if (db) return db;
  await initDB();
  return db!;
}

/**
 * Salvar uma nova ata ou atualizar existente
 */
export async function saveRecord(record: SacramentalRecord): Promise<string> {
  const id = record.id || generateId();
  
  const recordToSave: SacramentalRecord = {
    ...record,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: record.createdAt || new Date().toISOString(),
  };

  // 1. Salvar na Nuvem (Firestore)
  if (useCloud) {
    try {
      await saveRecordToCloud(recordToSave);
    } catch (error) {
      console.warn('Erro ao salvar no Firestore, mantendo apenas local:', error);
    }
  }

  // 2. Salvar Localmente (SQLite ou IndexedDB)
  if (isNative) {
    await sqliteService.saveRecord(recordToSave);
  } else {
    await saveRecordLocalIndexedDB(recordToSave);
  }

  return id;
}

async function saveRecordLocalIndexedDB(record: SacramentalRecord): Promise<string> {
  const database = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onerror = () => reject(new Error('Erro ao salvar no IndexedDB'));
    request.onsuccess = () => resolve(record.id!);
  });
}

/**
 * Obter todas as atas
 */
export async function getAllRecords(): Promise<SacramentalRecord[]> {
  if (useCloud) {
    try {
      const records = await getAllRecordsFromCloud();
      // Atualizar cache local em background
      for (const record of records) {
        if (isNative) {
          sqliteService.saveRecord(record).catch(() => {});
        } else {
          saveRecordLocalIndexedDB(record).catch(() => {});
        }
      }
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.warn('Erro ao buscar do Firestore, usando local:', error);
    }
  }

  // Fallback Local
  if (isNative) {
    return sqliteService.getAllRecords();
  } else {
    return getAllRecordsLocalIndexedDB();
  }
}

async function getAllRecordsLocalIndexedDB(): Promise<SacramentalRecord[]> {
  const database = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(new Error('Erro ao buscar no IndexedDB'));
    request.onsuccess = () => {
      const records = request.result;
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(records);
    };
  });
}

/**
 * Obter uma ata pelo ID
 */
export async function getRecord(id: string): Promise<SacramentalRecord | null> {
  if (isNative) {
    return sqliteService.getRecord(id);
  }

  const database = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(new Error('Erro ao buscar ata'));
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Deletar uma ata
 */
export async function deleteRecord(id: string): Promise<void> {
  if (useCloud) {
    try {
      await deleteRecordFromCloud(id);
    } catch (error) {
      console.warn('Erro ao deletar do Firestore:', error);
    }
  }

  if (isNative) {
    await sqliteService.deleteRecord(id);
  } else {
    const database = await getIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(new Error('Erro ao deletar localmente'));
      request.onsuccess = () => resolve();
    });
  }
}

// Funções auxiliares mantidas para compatibilidade
export async function searchRecordsByDate(date: string): Promise<SacramentalRecord[]> {
  const all = await getAllRecords();
  return all.filter(r => r.date === date);
}

export async function getRecordsByStatus(status: string): Promise<SacramentalRecord[]> {
  const all = await getAllRecords();
  return all.filter(r => r.status === status);
}

function generateId(): string {
  return `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
