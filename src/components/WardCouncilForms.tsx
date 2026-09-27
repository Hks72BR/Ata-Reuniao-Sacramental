import { useId, useState, type ReactNode } from 'react';
import type { ActionItem, CouncilAgendaItem, WardCouncilRecord } from '@/types';
import { WARD_COUNCIL_ORGANIZATIONS } from '@/types';
import { ACTION_PROGRESS, COUNCIL_AREAS, COUNCIL_OUTCOMES, actionProgress, changedFields, type CouncilMutation } from '@/lib/wardCouncilWorkflow';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:bg-slate-100';
export const councilButton = 'rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed';
export const councilSecondary = 'rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-900 bg-white hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed';

export function CouncilField({ label, value, onChange, multiline, type = 'text', required, options }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; required?: boolean;
  options?: { value: string; label: string }[];
}) {
  const id = useId();
  return <div className="space-y-1"><label className="block text-sm font-semibold text-slate-700" htmlFor={id}>{label}{required ? ' *' : ''}</label>
    {options ? <select id={id} className={inputClass} value={value} onChange={e => onChange(e.target.value)} required={required}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select> : multiline ? <textarea id={id} className={inputClass} rows={3} value={value} required={required} onChange={e => onChange(e.target.value)} />
      : <input id={id} className={inputClass} type={type} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 180 : undefined} value={value} required={required} onChange={e => onChange(e.target.value)} />}
  </div>;
}

function Form({ title, children, onSave, onCancel }: { title: string; children: ReactNode; onSave: () => Promise<void>; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  return <form className="space-y-4 rounded-xl border-2 border-teal-600 bg-teal-50 p-4 md:p-6" onSubmit={async e => {
    e.preventDefault(); setSaving(true); setError('');
    try { await onSave(); } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.'); }
    finally { setSaving(false); }
  }}>
    <h3 className="text-xl font-bold text-teal-950">{title}</h3>
    <p className="text-xs text-slate-600">As alterações deste formulário são enviadas ao clicar em Salvar.</p>
    <fieldset disabled={saving} className="space-y-4">{children}</fieldset>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    <div className="flex gap-2"><button className={councilButton} disabled={saving} type="submit">{saving ? 'Salvando…' : 'Salvar'}</button>
      <button className={councilSecondary} disabled={saving} type="button" onClick={onCancel}>Cancelar</button></div>
  </form>;
}

type MutationFormProps = { onSave: (mutation: CouncilMutation) => Promise<void>; onCancel: () => void };

export function CouncilMetadataForm({ record, onSave, onCancel }: MutationFormProps & { record: WardCouncilRecord }) {
  const [original] = useState(() => ({ date: record.date, presidedBy: record.presidedBy, directedBy: record.directedBy, openingPrayer: record.openingPrayer, closingPrayer: record.closingPrayer }));
  const [draft, setDraft] = useState(original);
  return <Form title="Dados da reunião" onCancel={onCancel} onSave={() => onSave({ type: 'metadata', ...changedFields(original, draft) })}>
    {([['date', 'Data da reunião'], ['presidedBy', 'Presidida por'], ['directedBy', 'Dirigida por'], ['openingPrayer', 'Oração de abertura'], ['closingPrayer', 'Oração de encerramento']] as const).map(([key, label]) =>
      <CouncilField key={key} label={label} type={key === 'date' ? 'date' : 'text'} value={draft[key]} required={key === 'date'} onChange={value => setDraft({ ...draft, [key]: value })} />)}
  </Form>;
}

export function CouncilAgendaForm({ item, userName, onSave, onCancel }: MutationFormProps & { item?: CouncilAgendaItem; userName: string }) {
  const [original] = useState<CouncilAgendaItem>(() => item || { id: crypto.randomUUID(), title: '', objective: '', context: '', area: COUNCIL_AREAS[0], organizations: [], estimatedMinutes: 10, selected: false, discussion: '', decision: '', outcome: 'open', createdBy: userName });
  const [draft, setDraft] = useState(original);
  const set = <K extends keyof CouncilAgendaItem>(key: K, value: CouncilAgendaItem[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  return <Form title={item ? 'Editar assunto e deliberação' : 'Sugerir assunto'} onCancel={onCancel} onSave={() => onSave(item ? { type: 'agenda-edit', id: item.id, ...changedFields(original, draft) } : { type: 'agenda-add', item: draft })}>
    <CouncilField label="Assunto" value={draft.title} onChange={value => set('title', value)} required />
    <CouncilField label="O que precisamos resolver juntos?" value={draft.objective} onChange={value => set('objective', value)} multiline />
    <CouncilField label="Contexto essencial" value={draft.context} onChange={value => set('context', value)} multiline />
    <CouncilField label="Área" value={draft.area} onChange={value => set('area', value)} options={COUNCIL_AREAS.map(area => ({ value: area, label: area }))} />
    <fieldset><legend className="mb-2 text-sm font-semibold">Organizações envolvidas</legend><div className="grid gap-2 sm:grid-cols-2">{WARD_COUNCIL_ORGANIZATIONS.map(org => <label className="flex gap-2 text-sm" key={org.key}>
      <input type="checkbox" checked={draft.organizations.includes(org.key)} onChange={e => set('organizations', e.target.checked ? [...draft.organizations, org.key] : draft.organizations.filter(key => key !== org.key))} />{org.label}
    </label>)}</div></fieldset>
    <CouncilField label="Tempo previsto (minutos)" value={String(draft.estimatedMinutes)} type="number" onChange={value => set('estimatedMinutes', Number(value))} />
    {item?.selected && <div className="space-y-4 border-t border-teal-200 pt-4">
      <CouncilField label="Discussão — resumo das contribuições" value={draft.discussion} onChange={value => set('discussion', value)} multiline />
      <CouncilField label="Resultado da discussão" value={draft.outcome} onChange={value => set('outcome', value as CouncilAgendaItem['outcome'])} options={Object.entries(COUNCIL_OUTCOMES).map(([value, label]) => ({ value, label }))} />
      <CouncilField label="Decisão ou encaminhamento" value={draft.decision} onChange={value => set('decision', value)} multiline />
    </div>}
  </Form>;
}

export function CouncilActionForm({ item, agenda, agendaItemId = '', onSave, onCancel }: MutationFormProps & { item?: ActionItem; agenda: CouncilAgendaItem[]; agendaItemId?: string }) {
  const [original] = useState<ActionItem>(() => item || { id: crypto.randomUUID(), description: '', responsible: '', dueDate: '', notes: '', completed: false, progress: 'pending', agendaItemId });
  const [draft, setDraft] = useState(original);
  return <Form title={item ? 'Editar designação' : 'Nova designação'} onCancel={onCancel} onSave={() => onSave(item ? { type: 'action-edit', id: item.id, ...changedFields(original, draft) } : { type: 'action-add', item: draft })}>
    <CouncilField label="Assunto vinculado" value={draft.agendaItemId || ''} onChange={value => setDraft({ ...draft, agendaItemId: value })} options={[{ value: '', label: 'Designação geral da reunião' }, ...agenda.map(entry => ({ value: entry.id, label: entry.title }))]} />
    <CouncilField label="O que será feito?" value={draft.description} onChange={value => setDraft({ ...draft, description: value })} required />
    <CouncilField label="Responsável" value={draft.responsible || ''} onChange={value => setDraft({ ...draft, responsible: value })} required />
    <CouncilField label="Prazo" type="date" value={draft.dueDate || ''} onChange={value => setDraft({ ...draft, dueDate: value })} required />
    <CouncilField label="Observações" multiline value={draft.notes || ''} onChange={value => setDraft({ ...draft, notes: value })} />
  </Form>;
}

export function CouncilProgressForm({ action, onSave, onCancel }: { action: ActionItem; onSave: (progress: NonNullable<ActionItem['progress']>, note: string) => Promise<void>; onCancel: () => void }) {
  const [progress, setProgress] = useState(actionProgress(action));
  const [note, setNote] = useState('');
  return <Form title={`Registrar retorno: ${action.description}`} onCancel={onCancel} onSave={() => onSave(progress, note)}>
    <CouncilField label="Situação" value={progress} onChange={value => setProgress(value as typeof progress)} options={Object.entries(ACTION_PROGRESS).map(([value, label]) => ({ value, label }))} />
    <CouncilField label="Retorno e próximos passos" value={note} onChange={setNote} multiline required />
  </Form>;
}
