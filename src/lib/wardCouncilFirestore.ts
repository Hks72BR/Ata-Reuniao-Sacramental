/**
 * Funções do Firestore - Atas de Conselho de Ala
 * Sincronização na Nuvem + Edição Colaborativa em Tempo Real
 */

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  setDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { WardCouncilRecord, WardCouncilPresence } from '@/types';

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

// ============================================
// FUNÇÕES DE EDIÇÃO COLABORATIVA EM TEMPO REAL
// ============================================

/**
 * Inscrever para atualizações em tempo real de uma ata
 */
export function subscribeToWardCouncilRecord(
  id: string,
  callback: (record: WardCouncilRecord | null) => void
): Unsubscribe {
  console.log('[WardCouncilFirestore] Inscrevendo para atualizações em tempo real:', id);
  const docRef = doc(db, COLLECTION_NAME, id);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data())
      } as WardCouncilRecord;
      callback(data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[WardCouncilFirestore] Erro no listener em tempo real:', error);
  });
}

/**
 * Atualizar um campo específico da ata em tempo real
 */
export async function updateWardCouncilField(
  id: string,
  fieldPath: string,
  value: any,
  editorName?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      [fieldPath]: value,
      updatedAt: new Date().toISOString(),
    };
    if (editorName) {
      updateData.lastEditedBy = editorName;
      updateData.lastEditedAt = new Date().toISOString();
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao atualizar campo:', fieldPath, error);
    throw error;
  }
}

/**
 * Atualizar campo de organização específico
 */
export async function updateOrganizationField(
  id: string,
  orgKey: string,
  value: string,
  editorName?: string
): Promise<void> {
  return updateWardCouncilField(id, `organizationMatters.${orgKey}`, value, editorName);
}

/**
 * Atualizar presença do editor (qual campo está editando)
 */
export async function updateEditorPresence(
  ataId: string,
  sessionId: string,
  presence: WardCouncilPresence
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, ataId);
    await updateDoc(docRef, {
      [`activeEditors.${sessionId}`]: {
        ...presence,
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao atualizar presença:', error);
  }
}

/**
 * Remover presença do editor (quando sai da página)
 */
export async function removeEditorPresence(
  ataId: string,
  sessionId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, ataId);
    await updateDoc(docRef, {
      [`activeEditors.${sessionId}`]: deleteField(),
    });
    console.log('[WardCouncilFirestore] Presença removida:', sessionId);
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao remover presença:', error);
  }
}

/**
 * Criar nova ata em branco no Firestore e retornar o ID
 */
export async function createBlankWardCouncilRecord(): Promise<string> {
  try {
    const newId = `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(db, COLLECTION_NAME, newId);
    const blankRecord: WardCouncilRecord = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      presidedBy: '',
      directedBy: '',
      openingPrayer: '',
      organizationMatters: {
        rapazes: '',
        mocas: '',
        socorro: '',
        elderes: '',
        missionaria: '',
        primaria: '',
        escolaDominical: '',
        temploHistoriaFamilia: '',
      },
      actionItems: [],
      closingPrayer: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      activeEditors: {},
    };
    await setDoc(docRef, blankRecord);
    console.log('[WardCouncilFirestore] Nova ata em branco criada:', newId);
    return newId;
  } catch (error) {
    console.error('[WardCouncilFirestore] Erro ao criar ata em branco:', error);
    throw error;
  }
}
