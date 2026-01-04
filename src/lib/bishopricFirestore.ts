/**
 * Funções do Firestore - Atas de Reunião de Bispado
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
import { BishopricRecord } from '@/types';

const COLLECTION_NAME = 'atas-bispado';

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
 * Salvar ata de bispado no Firestore
 */
export async function saveBishopricRecordToCloud(record: BishopricRecord): Promise<string> {
  try {
    console.log('[BishopricFirestore] Salvando ata de bispado...');
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
      console.log('[BishopricFirestore] Ata atualizada:', record.id);
      return record.id;
    } else {
      // Criar novo registro com ID customizado
      const newId = `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, COLLECTION_NAME, newId);
      await setDoc(docRef, { ...recordData, id: newId });
      console.log('[BishopricFirestore] Nova ata criada:', newId);
      return newId;
    }
  } catch (error) {
    console.error('[BishopricFirestore] Erro ao salvar ata:', error);
    throw error;
  }
}

/**
 * Buscar todas as atas de bispado do Firestore
 */
export async function getAllBishopricRecordsFromCloud(): Promise<BishopricRecord[]> {
  try {
    console.log('[BishopricFirestore] Buscando todas as atas de bispado...');
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('[BishopricFirestore] Atas encontradas:', querySnapshot.size);
    
    const records = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as BishopricRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[BishopricFirestore] Erro ao buscar atas:', error);
    throw error;
  }
}

/**
 * Buscar ata de bispado específica por ID
 */
export async function getBishopricRecordFromCloud(id: string): Promise<BishopricRecord | null> {
  try {
    console.log('[BishopricFirestore] Buscando ata:', id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('[BishopricFirestore] Ata encontrada');
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      } as BishopricRecord;
    } else {
      console.log('[BishopricFirestore] Ata não encontrada');
      return null;
    }
  } catch (error) {
    console.error('[BishopricFirestore] Erro ao buscar ata:', error);
    throw error;
  }
}

/**
 * Deletar ata de bispado do Firestore
 */
export async function deleteBishopricRecordFromCloud(id: string): Promise<void> {
  try {
    console.log('[BishopricFirestore] Deletando ata:', id);
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    console.log('[BishopricFirestore] Ata deletada com sucesso');
  } catch (error) {
    console.error('[BishopricFirestore] Erro ao deletar ata:', error);
    throw error;
  }
}

/**
 * Buscar atas de bispado por status
 */
export async function getBishopricRecordsByStatus(status: 'draft' | 'completed' | 'archived'): Promise<BishopricRecord[]> {
  try {
    console.log('[BishopricFirestore] Buscando atas com status:', status);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const records = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as BishopricRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[BishopricFirestore] Erro ao buscar atas por status:', error);
    throw error;
  }
}
