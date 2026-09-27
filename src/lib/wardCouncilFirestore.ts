import { collection, deleteField, doc, getDocs, onSnapshot, orderBy, query, runTransaction, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { WardCouncilRecord, WardCouncilPresence, CouncilActionUpdate } from '@/types';
import { applyCouncilMutation, applyCouncilActionUpdate, newCouncilRecord, type CouncilMutation } from './wardCouncilWorkflow';
import { councilLocalMode, readLocalCouncilRecords, writeLocalCouncilRecords, subscribeLocalCouncil, mutateLocalCouncil } from './wardCouncilLocal';
import { AUTH_CONFIG, hasCouncilAccess, isAuthenticated } from './auth';

const COLLECTION_NAME = 'atas-conselho-ala';

function assertAccess() {
  if (!hasCouncilAccess()) throw new Error('Sua sessão expirou. Entre novamente no conselho de ala.');
}

function normalizeRecord(id: string, data: Record<string, unknown>): WardCouncilRecord {
  const record = { ...newCouncilRecord(id), ...data, id } as WardCouncilRecord;
  for (const field of ['createdAt', 'updatedAt'] as const) {
    const value = data[field] as { toDate?: () => Date } | undefined;
    if (value?.toDate) record[field] = value.toDate().toISOString();
  }
  return record;
}

export async function getAllWardCouncilRecordsFromCloud(): Promise<WardCouncilRecord[]> {
  if (councilLocalMode) return readLocalCouncilRecords().sort((a, b) => b.date.localeCompare(a.date));
  const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), orderBy('date', 'desc')));
  return snapshot.docs.map(item => normalizeRecord(item.id, item.data()));
}

export function subscribeToWardCouncilRecord(id: string, callback: (record: WardCouncilRecord | null) => void, onError?: (error: Error) => void): Unsubscribe {
  if (councilLocalMode) return subscribeLocalCouncil(() => callback(readLocalCouncilRecords().find(record => record.id === id) || null));
  return onSnapshot(doc(db, COLLECTION_NAME, id), snapshot => callback(snapshot.exists() ? normalizeRecord(snapshot.id, snapshot.data()) : null), error => onError?.(error));
}

export function subscribeToCouncilRecords(callback: (records: WardCouncilRecord[]) => void, onError: (error: Error) => void): Unsubscribe {
  if (councilLocalMode) return subscribeLocalCouncil(() => callback(readLocalCouncilRecords()));
  return onSnapshot(query(collection(db, COLLECTION_NAME), orderBy('date', 'desc')), snapshot => {
    callback(snapshot.docs.map(item => normalizeRecord(item.id, item.data())));
  }, onError);
}

export async function createBlankWardCouncilRecord(): Promise<string> {
  assertAccess();
  const id = `ata-${crypto.randomUUID()}`;
  const record = newCouncilRecord(id);
  if (councilLocalMode) await mutateLocalCouncil(() => writeLocalCouncilRecords([...readLocalCouncilRecords(), record]));
  else await setDoc(doc(db, COLLECTION_NAME, id), record);
  return id;
}

function assertDeletable(record: WardCouncilRecord) {
  if (Object.keys(record.actionReviews || {}).length || record.actionItems.some(action => action.updates?.length)) {
    throw new Error('Esta ata possui acompanhamentos registrados e precisa ser preservada.');
  }
}

export async function deleteWardCouncilRecordFromCloud(id: string): Promise<void> {
  assertAccess();
  if (councilLocalMode) return mutateLocalCouncil(() => {
    const records = readLocalCouncilRecords();
    const record = records.find(item => item.id === id);
    if (record) assertDeletable(record);
    writeLocalCouncilRecords(records.filter(item => item.id !== id));
  });
  await runTransaction(db, async transaction => {
    const ref = doc(db, COLLECTION_NAME, id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) return;
    assertDeletable(normalizeRecord(id, snapshot.data()));
    transaction.delete(ref);
  });
}

export async function mutateCouncilRecord(id: string, mutation: CouncilMutation, editor: string): Promise<void> {
  assertAccess();
  const canManage = isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
  const apply = (record: WardCouncilRecord) => {
    const result = applyCouncilMutation(record, mutation, canManage);
    const now = new Date().toISOString();
    return { ...result, updatedAt: now, lastEditedBy: editor, lastEditedAt: now,
      ...(mutation.type === 'finalize' ? { finalizedAt: now, finalizedBy: editor } : {}) };
  };
  if (councilLocalMode) return mutateLocalCouncil(() => {
    const records = readLocalCouncilRecords();
    const record = records.find(item => item.id === id);
    if (!record) throw new Error('Ata não encontrada.');
    const updated = apply(record);
    writeLocalCouncilRecords(records.map(item => item.id === id ? updated : item));
  });
  await runTransaction(db, async transaction => {
    const ref = doc(db, COLLECTION_NAME, id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ata não encontrada.');
    transaction.set(ref, apply(normalizeRecord(id, snapshot.data())));
  });
}

/** Update the original action and retain this meeting's report in one transaction. */
export async function recordCouncilActionUpdate(sourceId: string, actionId: string, meetingId: string, progress: CouncilActionUpdate['progress'], note: string, editor: string): Promise<void> {
  assertAccess();
  const updateId = crypto.randomUUID();
  const apply = (source: WardCouncilRecord, meeting: WardCouncilRecord) => applyCouncilActionUpdate(source, meeting, actionId, {
    id: updateId, meetingId, meetingDate: meeting.date, recordedAt: new Date().toISOString(), recordedBy: editor, progress, note,
  });
  if (councilLocalMode) return mutateLocalCouncil(() => {
    const records = readLocalCouncilRecords();
    const source = records.find(item => item.id === sourceId);
    const meeting = records.find(item => item.id === meetingId);
    if (!source || !meeting) throw new Error('Ata não encontrada.');
    const { sourceUpdated, meetingUpdated } = apply(source, meeting);
    writeLocalCouncilRecords(records.map(item => item.id === meetingId ? meetingUpdated : item.id === sourceId ? sourceUpdated : item));
  });
  await runTransaction(db, async transaction => {
    const sourceRef = doc(db, COLLECTION_NAME, sourceId);
    const meetingRef = doc(db, COLLECTION_NAME, meetingId);
    const source = await transaction.get(sourceRef);
    const meeting = sourceId === meetingId ? source : await transaction.get(meetingRef);
    if (!source.exists() || !meeting.exists()) throw new Error('Ata não encontrada.');
    const { sourceUpdated, meetingUpdated } = apply(normalizeRecord(sourceId, source.data()), normalizeRecord(meetingId, meeting.data()));
    if (sourceId !== meetingId) transaction.set(sourceRef, sourceUpdated);
    transaction.set(meetingRef, meetingUpdated);
  });
}

export async function updateEditorPresence(ataId: string, sessionId: string, presence: WardCouncilPresence): Promise<void> {
  if (councilLocalMode) return;
  try { await updateDoc(doc(db, COLLECTION_NAME, ataId), { [`activeEditors.${sessionId}`]: { ...presence, lastUpdate: new Date().toISOString() } }); }
  catch (error) { console.error('Não foi possível atualizar a presença no conselho.', error); }
}

export async function removeEditorPresence(ataId: string, sessionId: string): Promise<void> {
  if (councilLocalMode) return;
  try { await updateDoc(doc(db, COLLECTION_NAME, ataId), { [`activeEditors.${sessionId}`]: deleteField() }); }
  catch (error) { console.error('Não foi possível remover a presença no conselho.', error); }
}
