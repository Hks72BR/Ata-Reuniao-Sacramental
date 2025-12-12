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
  setDoc,
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
    // Remover campos undefined e preparar dados
    const cleanRecord = JSON.parse(JSON.stringify(record)); // Remove undefined
    
    const recordData = {
      ...cleanRecord,
      createdAt: cleanRecord.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (record.id) {
      // Verificar se documento existe antes de atualizar
      const docRef = doc(db, COLLECTION_NAME, record.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Atualizar existente
        const { id, ...dataToUpdate } = recordData; // Remove id do update
        await updateDoc(docRef, dataToUpdate);
        return record.id;
      } else {
        // Documento não existe, criar novo com o ID
        await setDoc(docRef, recordData);
        return record.id;
      }
    } else {
      // Criar novo sem ID específico
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
    console.log('[Firestore] Iniciando busca de atas...');
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('[Firestore] Documentos encontrados:', querySnapshot.size);
    
    const records = querySnapshot.docs.map(doc => {
      console.log('[Firestore] Doc ID:', doc.id, 'Data:', doc.data());
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as SacramentalRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[Firestore] Erro ao buscar atas:', error);
    throw error;
  }
}

/**
 * Buscar ata específica por ID
 */
export async function getRecordFromCloud(id: string): Promise<SacramentalRecord | null> {
  try {
    console.log('[Firestore] Buscando ata com ID:', id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      } as SacramentalRecord;
      console.log('[Firestore] Ata encontrada:', data);
      return data;
    }
    console.warn('[Firestore] Ata não existe no Firebase');
    return null;
  } catch (error) {
    console.error('[Firestore] Erro ao buscar ata do Firestore:', error);
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
    // Buscar apenas por data, sem orderBy composto (evita necessidade de índice)
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', dateString)
    );
    const querySnapshot = await getDocs(q);
    
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as SacramentalRecord));
    
    // Ordenar localmente
    return records.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
