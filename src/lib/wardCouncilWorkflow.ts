import type { ActionItem, CouncilActionUpdate, CouncilAgendaItem, WardCouncilRecord } from '../types';

export const COUNCIL_AREAS = [
  'Viver o evangelho de Jesus Cristo',
  'Cuidar dos necessitados',
  'Convidar todos a receber o evangelho',
  'Unir as famílias por toda a eternidade',
];
export const COUNCIL_OUTCOMES = {
  open: 'Em discussão', decided: 'Decisão registrada', deferred: 'Adiado',
  information: 'Aguardando informações', referred: 'Encaminhado ao bispado',
};
export const ACTION_PROGRESS = {
  pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída',
};

export function localCouncilDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function actionProgress(action: ActionItem): NonNullable<ActionItem['progress']> {
  return action.completed ? 'completed' : action.progress === 'in_progress' ? 'in_progress' : 'pending';
}

export function newCouncilRecord(id: string): WardCouncilRecord {
  return {
    id, date: localCouncilDate(), presidedBy: '', directedBy: '', openingPrayer: '', closingPrayer: '',
    organizationMatters: { rapazes: '', mocas: '', socorro: '', elderes: '', missionaria: '', primaria: '', escolaDominical: '', temploHistoriaFamilia: '' },
    actionItems: [], agendaItems: [], actionReviews: {}, schemaVersion: 2,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'draft',
  };
}

export type CouncilMutation =
  | { type: 'metadata'; patch: Partial<Pick<WardCouncilRecord, 'date' | 'presidedBy' | 'directedBy' | 'openingPrayer' | 'closingPrayer'>>; expected?: Record<string, unknown> }
  | { type: 'agenda-add'; item: CouncilAgendaItem }
  | { type: 'agenda-edit'; id: string; patch: Partial<CouncilAgendaItem>; expected?: Record<string, unknown> }
  | { type: 'agenda-move'; id: string; direction: -1 | 1 }
  | { type: 'action-add'; item: ActionItem }
  | { type: 'action-edit'; id: string; patch: Partial<ActionItem>; expected?: Record<string, unknown> }
  | { type: 'finalize' }
  | { type: 'reopen' };

function assertUnchanged(current: object, expected?: Record<string, unknown>) {
  for (const [key, value] of Object.entries(expected || {})) {
    if (JSON.stringify((current as Record<string, unknown>)[key]) !== JSON.stringify(value)) {
      throw new Error('Este campo foi alterado por outra pessoa. Feche e abra a edição para revisar a versão atual.');
    }
  }
}

export function applyCouncilMutation(record: WardCouncilRecord, mutation: CouncilMutation, canManage: boolean): WardCouncilRecord {
  if (mutation.type !== 'reopen' && record.status !== 'draft') throw new Error('Reabra a ata antes de alterar seu conteúdo.');
  const result = { ...record };
  switch (mutation.type) {
    case 'metadata':
      assertUnchanged(record, mutation.expected);
      Object.assign(result, mutation.patch);
      break;
    case 'agenda-add':
      if (!mutation.item.title.trim()) throw new Error('Informe o assunto da pauta.');
      result.agendaItems = [...(record.agendaItems || []), { ...mutation.item, selected: canManage && mutation.item.selected }];
      break;
    case 'agenda-edit': {
      const current = record.agendaItems?.find(item => item.id === mutation.id);
      if (!current) throw new Error('Assunto não encontrado.');
      if ('selected' in mutation.patch && !canManage) throw new Error('A seleção da pauta requer acesso do bispado.');
      assertUnchanged(current, mutation.expected);
      const item = { ...current, ...mutation.patch, id: current.id };
      if (!item.title.trim()) throw new Error('Informe o assunto da pauta.');
      result.agendaItems = record.agendaItems!.map(entry => entry.id === item.id ? item : entry);
      break;
    }
    case 'agenda-move': {
      if (!canManage) throw new Error('A ordenação requer acesso do bispado.');
      const items = [...(record.agendaItems || [])];
      const index = items.findIndex(item => item.id === mutation.id);
      const selectedIndexes = items.map((item, i) => item.selected ? i : -1).filter(i => i >= 0);
      const target = selectedIndexes[selectedIndexes.indexOf(index) + mutation.direction];
      if (index >= 0 && items[index].selected && target !== undefined) [items[index], items[target]] = [items[target], items[index]];
      result.agendaItems = items;
      break;
    }
    case 'action-add':
      validateAction(mutation.item, record);
      result.actionItems = [...record.actionItems, { ...mutation.item, completed: false, progress: 'pending' }];
      break;
    case 'action-edit': {
      const current = record.actionItems.find(item => item.id === mutation.id);
      if (!current) throw new Error('Designação não encontrada.');
      assertUnchanged(current, mutation.expected);
      const item = { ...current, ...mutation.patch, id: current.id };
      validateAction(item, record);
      result.actionItems = record.actionItems.map(entry => entry.id === item.id ? item : entry);
      break;
    }
    case 'finalize':
      if (!canManage) throw new Error('A finalização requer acesso do bispado.');
      if (!record.date || !record.presidedBy.trim() || !record.directedBy.trim()) throw new Error('Preencha data, quem preside e quem dirige antes de finalizar.');
      for (const item of record.actionItems) validateAction(item, record);
      if ((record.agendaItems || []).some(item => item.selected && (item.outcome === 'open' || !item.decision.trim()))) {
        throw new Error('Registre uma decisão ou um encaminhamento para cada assunto selecionado.');
      }
      result.status = 'completed';
      break;
    case 'reopen':
      if (!canManage) throw new Error('A reabertura requer acesso do bispado.');
      result.status = 'draft';
      break;
  }
  return result;
}

function validateAction(item: ActionItem, record: WardCouncilRecord) {
  if (!item.description.trim() || !item.responsible?.trim() || !item.dueDate) throw new Error('Informe descrição, responsável e prazo da designação.');
  if (item.agendaItemId && !record.agendaItems?.some(agenda => agenda.id === item.agendaItemId)) throw new Error('O assunto vinculado não existe nesta ata.');
}

/** Only changed fields are sent, so editing one field never replaces a colleague's other fields. */
export function changedFields<T extends object>(original: T, draft: T) {
  const patch: Record<string, unknown> = {};
  const expected: Record<string, unknown> = {};
  for (const key of Object.keys(draft) as (keyof T)[]) {
    if (JSON.stringify(original[key]) !== JSON.stringify(draft[key])) {
      patch[String(key)] = draft[key];
      expected[String(key)] = original[key];
    }
  }
  return { patch, expected };
}

export function previousCouncilActions(records: WardCouncilRecord[], current: WardCouncilRecord) {
  return records.filter(record => record.id !== current.id && record.date <= current.date && record.status !== 'archived')
    .flatMap(record => record.actionItems.filter(action => !action.completed || action.updates?.some(update => update.meetingId === current.id))
      .map(action => ({ record, action })));
}

export function applyCouncilActionUpdate(source: WardCouncilRecord, meeting: WardCouncilRecord, actionId: string, update: CouncilActionUpdate) {
  if (meeting.status !== 'draft') throw new Error('Registre o acompanhamento em uma ata em preparação.');
  if (source.date > meeting.date || source.status === 'archived') throw new Error('Esta designação não pode ser acompanhada nesta reunião.');
  if (!update.note.trim()) throw new Error('Descreva o retorno da designação.');
  const action = source.actionItems.find(item => item.id === actionId);
  if (!action) throw new Error('Designação não encontrada.');
  const sourceUpdated = { ...source, updatedAt: update.recordedAt, actionItems: source.actionItems.map(item => item.id === actionId ? {
    ...item, completed: update.progress === 'completed', progress: update.progress, updates: [...(item.updates || []), update],
  } : item) };
  const meetingUpdated = { ...(source.id === meeting.id ? sourceUpdated : meeting), updatedAt: update.recordedAt,
    actionReviews: { ...meeting.actionReviews, [update.id]: { sourceRecordId: source.id!, actionId, description: action.description, responsible: action.responsible || '', dueDate: action.dueDate || '', update } } };
  return { sourceUpdated, meetingUpdated };
}
