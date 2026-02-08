/**
 * Funções do Firestore - Entrevistas do Bispado
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
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { InterviewRecord } from '@/types';

const COLLECTION_NAME = 'entrevistas-bispado';

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
 * Salvar registro de entrevistas no Firestore
 */
export async function saveInterviewRecordToCloud(record: InterviewRecord): Promise<string> {
  try {
    console.log('[InterviewsFirestore] Salvando registro de entrevistas...');
    const cleanRecord = JSON.parse(JSON.stringify(record));
    
    const recordData = {
      ...cleanRecord,
      createdAt: cleanRecord.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (record.id && record.id.startsWith('interview-')) {
      // Atualizar registro existente
      const docRef = doc(db, COLLECTION_NAME, record.id);
      await setDoc(docRef, recordData, { merge: true });
      console.log('[InterviewsFirestore] Registro atualizado:', record.id);
      return record.id;
    } else {
      // Criar novo registro com ID customizado
      const newId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, COLLECTION_NAME, newId);
      await setDoc(docRef, { ...recordData, id: newId });
      console.log('[InterviewsFirestore] Novo registro criado:', newId);
      return newId;
    }
  } catch (error) {
    console.error('[InterviewsFirestore] Erro ao salvar registro:', error);
    throw error;
  }
}

/**
 * Buscar todos os registros de entrevistas do Firestore
 */
export async function getAllInterviewRecordsFromCloud(): Promise<InterviewRecord[]> {
  try {
    console.log('[InterviewsFirestore] Buscando todos os registros de entrevistas...');
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('[InterviewsFirestore] Documentos encontrados:', querySnapshot.size);
    
    const records = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data()),
      } as InterviewRecord;
    });
    
    return records;
  } catch (error) {
    console.error('[InterviewsFirestore] Erro ao buscar registros:', error);
    throw error;
  }
}

/**
 * Buscar um registro específico de entrevistas
 */
export async function getInterviewRecordByIdFromCloud(id: string): Promise<InterviewRecord | null> {
  try {
    console.log('[InterviewsFirestore] Buscando registro:', id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as InterviewRecord;
    }
    
    return null;
  } catch (error) {
    console.error('[InterviewsFirestore] Erro ao buscar registro:', error);
    throw error;
  }
}

/**
 * Excluir registro de entrevistas
 */
export async function deleteInterviewRecordFromCloud(id: string): Promise<void> {
  try {
    console.log('[InterviewsFirestore] Excluindo registro:', id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    console.log('[InterviewsFirestore] Registro excluído:', id);
  } catch (error) {
    console.error('[InterviewsFirestore] Erro ao excluir registro:', error);
    throw error;
  }
}
