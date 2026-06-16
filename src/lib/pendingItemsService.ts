/**
 * Serviço de Verificação de Itens Pendentes
 * Verifica itens de ação não concluídos em:
 * - Atas de Conselho de Ala
 * - Atas de Reunião de Bispado
 * - Entrevistas do Bispado
 */

import { getAllWardCouncilRecordsFromCloud } from './wardCouncilFirestore';
import { getAllBishopricRecordsFromCloud } from './bishopricFirestore';
import { getAllInterviewRecordsFromCloud } from './interviewsFirestore';

export interface PendingItemSummary {
  source: 'wardcouncil' | 'bishopric' | 'interviews';
  sourceLabel: string;
  recordDate: string;
  recordId: string;
  totalItems: number;
  pendingItems: number;
  items: { description: string; responsible?: string }[];
}

export interface PendingItemsReport {
  totalPending: number;
  summaries: PendingItemSummary[];
  lastChecked: string;
}

/**
 * Buscar todos os itens pendentes de todas as fontes
 */
export async function checkAllPendingItems(): Promise<PendingItemsReport> {
  const summaries: PendingItemSummary[] = [];

  // 1. Conselho de Ala - Action Items
  try {
    const wardCouncilRecords = await getAllWardCouncilRecordsFromCloud();
    for (const record of wardCouncilRecords) {
      if (!record.actionItems || record.actionItems.length === 0) continue;
      const pending = record.actionItems.filter((a) => !a.completed);
      if (pending.length > 0) {
        summaries.push({
          source: 'wardcouncil',
          sourceLabel: 'Conselho de Ala',
          recordDate: record.date,
          recordId: record.id || '',
          totalItems: record.actionItems.length,
          pendingItems: pending.length,
          items: pending.map((a) => ({
            description: a.description || '(sem descrição)',
            responsible: a.responsible,
          })),
        });
      }
    }
  } catch (error) {
    console.error('[PendingItems] Erro ao verificar Conselho de Ala:', error);
  }

  // 2. Reunião de Bispado - Action Items
  try {
    const bishopricRecords = await getAllBishopricRecordsFromCloud();
    for (const record of bishopricRecords) {
      if (!record.actionItems || record.actionItems.length === 0) continue;
      const pending = record.actionItems.filter((a) => !a.completed);
      if (pending.length > 0) {
        summaries.push({
          source: 'bishopric',
          sourceLabel: 'Reunião de Bispado',
          recordDate: record.date,
          recordId: record.id || '',
          totalItems: record.actionItems.length,
          pendingItems: pending.length,
          items: pending.map((a) => ({
            description: a.description || '(sem descrição)',
            responsible: a.responsible,
          })),
        });
      }
    }
  } catch (error) {
    console.error('[PendingItems] Erro ao verificar Bispado:', error);
  }

  // 3. Entrevistas - Interviews não realizadas
  try {
    const interviewRecords = await getAllInterviewRecordsFromCloud();
    for (const record of interviewRecords) {
      if (!record.interviews || record.interviews.length === 0) continue;
      const pending = record.interviews.filter((i) => !i.completed);
      if (pending.length > 0) {
        summaries.push({
          source: 'interviews',
          sourceLabel: 'Entrevistas do Bispado',
          recordDate: record.date,
          recordId: record.id || '',
          totalItems: record.interviews.length,
          pendingItems: pending.length,
          items: pending.map((i) => ({
            description: `Entrevista: ${i.personName}`,
            responsible: i.responsibleMember,
          })),
        });
      }
    }
  } catch (error) {
    console.error('[PendingItems] Erro ao verificar Entrevistas:', error);
  }

  const totalPending = summaries.reduce((sum, s) => sum + s.pendingItems, 0);

  return {
    totalPending,
    summaries,
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Solicitar permissão para notificações do navegador
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[PendingItems] Navegador não suporta notificações');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Enviar notificação do navegador sobre itens pendentes
 */
export async function sendPendingNotification(report: PendingItemsReport): Promise<void> {
  if (report.totalPending === 0) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Agrupar por fonte
  const wardCouncilPending = report.summaries
    .filter((s) => s.source === 'wardcouncil')
    .reduce((sum, s) => sum + s.pendingItems, 0);
  const bishopricPending = report.summaries
    .filter((s) => s.source === 'bishopric')
    .reduce((sum, s) => sum + s.pendingItems, 0);
  const interviewPending = report.summaries
    .filter((s) => s.source === 'interviews')
    .reduce((sum, s) => sum + s.pendingItems, 0);

  const parts: string[] = [];
  if (wardCouncilPending > 0) parts.push(`${wardCouncilPending} do Conselho de Ala`);
  if (bishopricPending > 0) parts.push(`${bishopricPending} do Bispado`);
  if (interviewPending > 0) parts.push(`${interviewPending} Entrevista(s)`);

  const body = `⚠️ ${report.totalPending} item(ns) pendente(s):\n${parts.join(', ')}`;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Usar Service Worker para notificação persistente
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('📋 Itens de Ação Pendentes!', {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'pending-items',
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: '/' },
      });
    } else {
      // Fallback: notificação simples
      new Notification('📋 Itens de Ação Pendentes!', {
        body,
        icon: '/icon-192.png',
        tag: 'pending-items',
      });
    }
  } catch (error) {
    console.error('[PendingItems] Erro ao enviar notificação:', error);
  }
}
