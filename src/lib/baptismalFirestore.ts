/**
 * Funções do Firestore - Atas Batismais
 * Sincronização na Nuvem
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { BaptismalRecord } from '@/types';

const COLLECTION_NAME = 'atas-batismais';

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
 * Salvar ata batismal no Firestore
 */
export async function saveBaptismalRecordToCloud(record: BaptismalRecord): Promise<string> {
  try {
    console.log('[BaptismalFirestore] Salvando ata batismal...');
    const cleanRecord = JSON.parse(JSON.stringify(record));
    
    const recordData = {
      ...cleanRecord,
      createdAt: cleanRecord.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (record.id && record.id.startsWith('ata-')) {
      // Atualizar registro existente
      const docRef = doc(db, COLLECTION_NAME, record.id);
      await setDoc(docRef, recordData, { merge: true });
      console.log('[BaptismalFirestore] Ata atualizada:', record.id);
      return record.id;
    } else {
      // Criar novo registro com ID customizado
      const newId = `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, COLLECTION_NAME, newId);
      await setDoc(docRef, { ...recordData, id: newId });
      console.log('[BaptismalFirestore] Nova ata criada:', newId);
      return newId;
    }
  } catch (error) {
    console.error('[BaptismalFirestore] Erro ao salvar ata:', error);
    throw error;
  }
}

/**
 * Buscar todas as atas batismais do Firestore
 */
export async function getAllBaptismalRecordsFromCloud(): Promise<BaptismalRecord[]> {
  try {
    console.log('[BaptismalFirestore] Buscando todas as atas batismais...');
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('[BaptismalFirestore] Atas encontradas:', querySnapshot.size);
    
    const records = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as BaptismalRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[BaptismalFirestore] Erro ao buscar atas:', error);
    throw error;
  }
}

/**
 * Buscar ata batismal específica por ID
 */
export async function getBaptismalRecordFromCloud(id: string): Promise<BaptismalRecord | null> {
  try {
    console.log('[BaptismalFirestore] Buscando ata com ID:', id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      } as BaptismalRecord;
      console.log('[BaptismalFirestore] Ata encontrada');
      return data;
    }
    console.warn('[BaptismalFirestore] Ata não existe');
    return null;
  } catch (error) {
    console.error('[BaptismalFirestore] Erro ao buscar ata:', error);
    throw error;
  }
}

/**
 * Deletar ata batismal do Firestore
 */
export async function deleteBaptismalRecordFromCloud(id: string): Promise<void> {
  try {
    console.log('[BaptismalFirestore] Deletando ata:', id);
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    console.log('[BaptismalFirestore] Ata deletada com sucesso');
  } catch (error) {
    console.error('[BaptismalFirestore] Erro ao deletar ata:', error);
    throw error;
  }
}

/**
 * Buscar atas batismais por data
 */
export async function searchBaptismalRecordsByDateInCloud(dateString: string): Promise<BaptismalRecord[]> {
  try {
    console.log('[BaptismalFirestore] Buscando atas pela data:', dateString);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '==', dateString),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('[BaptismalFirestore] Atas encontradas para a data:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as BaptismalRecord));
  } catch (error) {
    console.error('[BaptismalFirestore] Erro ao buscar por data:', error);
    throw error;
  }
}
