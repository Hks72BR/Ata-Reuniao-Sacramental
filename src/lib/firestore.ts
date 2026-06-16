/**
 * Funções do Firestore - Sincronização na Nuvem
 * Mantém compatibilidade com IndexedDB local
 * 
 * ✅ Multi-Tenant: Dados isolados por wardId
 * ✅ Cache: Reduz leituras do Firestore (TTL 1 hora)
 * ✅ Paginação: Limita quantidade de documentos carregados
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
  limit,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db, auth, COLLECTION_NAME } from './firebase';
import { SacramentalRecord } from '@/types';

const CACHE_TTL = 3600000; // 1 hora em milissegundos
const PAGE_SIZE = 50; // Carregar 50 atas por vez

/**
 * Obter wardId do usuário autenticado
 */
function getCurrentWardId(): string | null {
  const user = auth.currentUser;
  if (!user?.email) {
    console.warn('[Firestore] Usuário não autenticado');
    return null;
  }
  // Extrair ala-jardim de ala-jardim@igreja.com
  const wardId = user.email.split('@')[0];
  console.log('[Firestore] WardId atual:', wardId);
  return wardId;
}

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
 * Salvar ata no Firestore (com wardId)
 */
export async function saveRecordToCloud(record: SacramentalRecord): Promise<string> {
  const wardId = getCurrentWardId();
  if (!wardId) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  try {
    // Remover campos undefined e preparar dados
    const cleanRecord = JSON.parse(JSON.stringify(record)); // Remove undefined
    
    const recordData = {
      ...cleanRecord,
      wardId, // ✅ Adicionar wardId para isolamento
      createdAt: cleanRecord.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let savedId: string;

    if (record.id) {
      // Verificar se documento existe antes de atualizar
      const docRef = doc(db, COLLECTION_NAME, record.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Atualizar existente
        const { id, ...dataToUpdate } = recordData; // Remove id do update
        await updateDoc(docRef, dataToUpdate);
        savedId = record.id;
      } else {
        // Documento não existe, criar novo com o ID
        await setDoc(docRef, recordData);
        savedId = record.id;
      }
    } else {
      // Criar novo sem ID específico
      const docRef = await addDoc(collection(db, COLLECTION_NAME), recordData);
      savedId = docRef.id;
    }

    // ✅ Limpar cache após salvar (forçar reload)
    clearRecordsCache();
    
    return savedId;
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    throw error;
  }
}

/**
 * Buscar todas as atas do Firestore (com cache e filtro por wardId)
 */
export async function getAllRecordsFromCloud(): Promise<SacramentalRecord[]> {
  const wardId = getCurrentWardId();
  if (!wardId) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  try {
    // ✅ Verificar cache primeiro
    const cacheKey = `records_cache_${wardId}`;
    const cacheTimeKey = `cache_time_${wardId}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheTimeKey);
    
    if (cached && cacheTime) {
      const age = Date.now() - Number(cacheTime);
      if (age < CACHE_TTL) {
        console.log(`[Firestore] ✅ Usando cache (${Math.round(age / 1000)}s atrás)`);
        return JSON.parse(cached);
      } else {
        console.log('[Firestore] Cache expirado, buscando do servidor...');
      }
    }

    console.log('[Firestore] Iniciando busca de atas...');
    
    // ✅ Query com filtro por wardId + paginação
    const q = query(
      collection(db, COLLECTION_NAME),
      where('wardId', '==', wardId), // Isolamento multi-tenant
      orderBy('date', 'desc'),
      limit(PAGE_SIZE) // Paginação
    );
    
    const querySnapshot = await getDocs(q);
    console.log('[Firestore] Documentos encontrados:', querySnapshot.size, `(wardId: ${wardId})`);
    
    const records = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as SacramentalRecord;
    });
    
    // ✅ Salvar no cache
    localStorage.setItem(cacheKey, JSON.stringify(records));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    console.log('[Firestore] Cache atualizado');
    
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
    // ✅ Limpar cache após deletar
    clearRecordsCache();
  } catch (error) {
    console.error('Erro ao deletar do Firestore:', error);
    throw error;
  }
}

/**
 * Limpar cache de registros
 */
export function clearRecordsCache(): void {
  const wardId = getCurrentWardId();
  if (wardId) {
    const cacheKey = `records_cache_${wardId}`;
    const cacheTimeKey = `cache_time_${wardId}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(cacheTimeKey);
    console.log('[Firestore] Cache limpo');
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

/**
 * Salvar lista de membros da ala no Firestore
 */
export async function saveMembersListToCloud(members: string[]): Promise<void> {
  try {
    const membersDocRef = doc(db, 'wardMembers', 'currentMembers');
    await setDoc(membersDocRef, {
      members,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao salvar lista de membros:', error);
    throw error;
  }
}

/**
 * Carregar lista de membros da ala do Firestore
 */
export async function getMembersListFromCloud(): Promise<string[]> {
  try {
    const membersDocRef = doc(db, 'wardMembers', 'currentMembers');
    const docSnap = await getDoc(membersDocRef);
    
    if (docSnap.exists()) {
      return docSnap.data().members || [];
    }
    return [];
  } catch (error) {
    console.error('Erro ao carregar lista de membros:', error);
    throw error;
  }
}
