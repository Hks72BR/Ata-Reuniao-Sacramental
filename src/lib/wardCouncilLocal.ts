import type { WardCouncilRecord } from '@/types';

// Explicit development mode: council data stays in this browser, never in Firestore.
export const councilLocalMode = import.meta.env.DEV && import.meta.env.VITE_WARD_COUNCIL_LOCAL === 'true';
const KEY = 'wardcouncil-local-v2';
const EVENT = 'wardcouncil-local-change';

export function readLocalCouncilRecords(): WardCouncilRecord[] {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function writeLocalCouncilRecords(records: WardCouncilRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeLocalCouncil(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) callback(); };
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', onStorage);
  callback();
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

export async function mutateLocalCouncil<T>(operation: () => T): Promise<T> {
  // Serializes read-modify-write across tabs, matching Firestore transaction semantics.
  return navigator.locks.request(KEY, operation);
}
