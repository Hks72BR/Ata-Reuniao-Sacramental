/**
 * Funções do Firestore - Sincronização na Nuvem
 * Mantém compatibilidade com IndexedDB local
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, COLLECTION_NAME } from './firebase';
import { SacramentalRecord } from '@/types';

/**
 * Converter timestamp do Firebase para ISO string
 */
function convertTimestamps(data: any): any {
  const converted = { ...data };
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate().toISOString();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate().toISOString();
  }
  return converted;
}

/**
 * Salvar ata no Firestore
 */
export async function saveRecordToCloud(record: SacramentalRecord): Promise<string> {
  try {
    const recordData = {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (record.id) {
      // Atualizar existente
      const docRef = doc(db, COLLECTION_NAME, record.id);
      await updateDoc(docRef, recordData as any);
      return record.id;
    } else {
      // Criar novo
      const docRef = await addDoc(collection(db, COLLECTION_NAME), recordData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    throw error;
  }
}

/**
 * Buscar todas as atas do Firestore
 */
export async function getAllRecordsFromCloud(): Promise<SacramentalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as SacramentalRecord));
  } catch (error) {
    console.error('Erro ao buscar atas do Firestore:', error);
    throw error;
  }
}

/**
 * Buscar ata específica por ID
 */
export async function getRecordFromCloud(id: string): Promise<SacramentalRecord | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      } as SacramentalRecord;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar ata do Firestore:', error);
    throw error;
  }
}

/**
 * Deletar ata do Firestore
 */
export async function deleteRecordFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar do Firestore:', error);
    throw error;
  }
}

/**
 * Buscar atas por data
 */
export async function searchRecordsByDateInCloud(dateString: string): Promise<SacramentalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', dateString),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as SacramentalRecord));
  } catch (error) {
    console.error('Erro ao buscar por data no Firestore:', error);
    throw error;
  }
}

/**
 * Listener em tempo real para mudanças nas atas
 */
export function subscribeToRecords(
  callback: (records: SacramentalRecord[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as SacramentalRecord));
    callback(records);
  });

  return unsubscribe;
}
