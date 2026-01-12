/**
 * Funções do Firestore - Atas de Conselho de Ala
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
import { WardCouncilRecord } from '@/types';

const COLLECTION_NAME = 'atas-conselho-ala';

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
 * Salvar ata de conselho de ala no Firestore
 */
export async function saveWardCouncilRecordToCloud(record: WardCouncilRecord): Promise<string> {
  try {
    console.log('[WardCouncilFirestore] Salvando ata de conselho...');
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
      console.log('[WardCouncilFirestore] Ata atualizada:', record.id);
      return record.id;
    } else {
      // Criar novo registro com ID customizado
      const newId = `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, COLLECTION_NAME, newId);
      await setDoc(docRef, { ...recordData, id: newId });
      console.log('[WardCouncilFirestore] Nova ata criada:', newId);
      return newId;
    }
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao salvar ata:', error);
    throw error;
  }
}

/**
 * Buscar todas as atas de conselho de ala do Firestore
 */
export async function getAllWardCouncilRecordsFromCloud(): Promise<WardCouncilRecord[]> {
  try {
    console.log('[WardCouncilFirestore] Buscando todas as atas de conselho...');
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('[WardCouncilFirestore] Atas encontradas:', querySnapshot.size);
    
    const records = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as WardCouncilRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao buscar atas:', error);
    throw error;
  }
}

/**
 * Buscar ata de conselho de ala específica por ID
 */
export async function getWardCouncilRecordFromCloud(id: string): Promise<WardCouncilRecord | null> {
  try {
    console.log('[WardCouncilFirestore] Buscando ata:', id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('[WardCouncilFirestore] Ata encontrada');
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      } as WardCouncilRecord;
    } else {
      console.log('[WardCouncilFirestore] Ata não encontrada');
      return null;
    }
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao buscar ata:', error);
    throw error;
  }
}

/**
 * Deletar ata de conselho de ala do Firestore
 */
export async function deleteWardCouncilRecordFromCloud(id: string): Promise<void> {
  try {
    console.log('[WardCouncilFirestore] Deletando ata:', id);
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    console.log('[WardCouncilFirestore] Ata deletada com sucesso');
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao deletar ata:', error);
    throw error;
  }
}

/**
 * Buscar atas de conselho de ala por status
 */
export async function getWardCouncilRecordsByStatus(status: 'draft' | 'completed' | 'archived'): Promise<WardCouncilRecord[]> {
  try {
    console.log('[WardCouncilFirestore] Buscando atas com status:', status);
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
      } as WardCouncilRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao buscar atas por status:', error);
    throw error;
  }
}
