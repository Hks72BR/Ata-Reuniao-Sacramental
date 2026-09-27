import type { ReactNode } from 'react';
import type { ActionItem, WardCouncilRecord } from '@/types';
import { WARD_COUNCIL_ORGANIZATIONS } from '@/types';
import { ACTION_PROGRESS, COUNCIL_OUTCOMES, actionProgress, localCouncilDate, previousCouncilActions, type CouncilMutation } from '@/lib/wardCouncilWorkflow';
import { councilSecondary } from './WardCouncilForms';
import { formatDate } from '@/lib/utils';

export type CouncilEditor = { kind: 'metadata' } | { kind: 'agenda'; id?: string } | { kind: 'action'; id?: string; agendaItemId?: string } | { kind: 'progress'; sourceId: string; action: ActionItem };

export function CouncilSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-teal-950">{title}</h2>{action}</div>{children}
  </section>;
}

export function CouncilActionCard({ action, children }: { action: ActionItem; children?: ReactNode }) {
  const progress = actionProgress(action);
  const overdue = !action.completed && action.dueDate && action.dueDate < localCouncilDate();
  return <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold text-slate-900">{action.description || 'Designação sem descrição'}</h4>
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${action.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{ACTION_PROGRESS[progress]}</span></div>
    <p className="text-sm text-slate-700">Responsável: {action.responsible || 'A definir'} · Prazo: {action.dueDate ? formatDate(action.dueDate) : 'A definir'} {overdue && <strong className="text-red-700">· Prazo vencido</strong>}</p>
    {action.notes && <p className="whitespace-pre-wrap text-sm text-slate-600">{action.notes}</p>}
    {!!action.updates?.length && <details className="text-sm"><summary className="cursor-pointer text-teal-800">Histórico de retornos ({action.updates.length})</summary>
      <ul className="mt-2 space-y-2">{action.updates.map(update => <li className="border-l-2 border-teal-300 pl-3" key={update.id}>
        <p>{formatDate(update.meetingDate)} · {update.recordedBy} · {ACTION_PROGRESS[update.progress]}</p><p className="whitespace-pre-wrap">{update.note}</p>
      </li>)}</ul></details>}
    {children && <div className="flex flex-wrap gap-2 pt-2">{children}</div>}
  </div>;
}

export function WardCouncilContent({ record, records = [], onEdit, onMutation, canManage = false, busy = false, previousError = '', previousLoading = false }: {
  record: WardCouncilRecord; records?: WardCouncilRecord[]; onEdit?: (editor: CouncilEditor) => void;
  onMutation?: (mutation: CouncilMutation) => void; canManage?: boolean; busy?: boolean; previousError?: string; previousLoading?: boolean;
}) {
  const editable = !!onEdit && record.status === 'draft';
  const agenda = record.agendaItems || [];
  const selected = agenda.filter(item => item.selected);
  const suggestions = agenda.filter(item => !item.selected);
  const previous = previousCouncilActions(records, record);
  const reviews = Object.values(record.actionReviews || {});
  const plannedMinutes = selected.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const actionControls = (action: ActionItem) => editable && <>
    <button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'action', id: action.id })}>Editar designação</button>
    <button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'progress', sourceId: record.id!, action })}>Registrar retorno</button>
  </>;
  return <div className="space-y-6">
    <CouncilSection title="1. Abertura" action={editable && <button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'metadata' })}>Editar dados</button>}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">{[
        ['Data', formatDate(record.date)], ['Presidida por', record.presidedBy], ['Dirigida por', record.directedBy], ['Oração de abertura', record.openingPrayer],
      ].map(([label, value]) => <div key={label}><dt className="font-semibold text-slate-600">{label}</dt><dd className="text-slate-900">{value || 'A preencher'}</dd></div>)}</dl>
    </CouncilSection>

    <CouncilSection title="2. Acompanhamento anterior">
      {editable && <>
        <p className="text-sm text-slate-600">Registre o retorno na designação original. A ata desta reunião também guardará o relato apresentado.</p>
        {previousError ? <p role="alert" className="text-red-700">{previousError}</p> : previousLoading ? <p role="status">Carregando designações anteriores…</p> : previous.length === 0 ? <p className="text-sm text-slate-500">Nenhuma designação anterior pendente para esta data.</p> : previous.map(({ record: source, action }) => <div key={`${source.id}-${action.id}`}>
          <p className="mb-1 text-xs text-slate-500">Origem: reunião de {formatDate(source.date)}</p>
          <CouncilActionCard action={action}><button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'progress', sourceId: source.id!, action })}>Registrar retorno</button></CouncilActionCard>
        </div>)}
      </>}
      {reviews.length > 0 ? <details open={!editable} className="text-sm"><summary className="cursor-pointer font-semibold text-teal-900">Retornos registrados nesta reunião ({reviews.length})</summary>
        <ul className="mt-3 space-y-3">{reviews.map(review => <li key={review.update.id} className="rounded-lg bg-teal-50 p-3">
          <p className="font-semibold">{review.description}</p><p>{review.responsible} · {ACTION_PROGRESS[review.update.progress]}</p>
          <p className="whitespace-pre-wrap">{review.update.note}</p><p className="text-xs text-slate-500">Registrado por {review.update.recordedBy}</p>
        </li>)}</ul>
      </details> : !editable && <p className="text-sm text-slate-500">Nenhum retorno registrado nesta reunião.</p>}
    </CouncilSection>

    <CouncilSection title="3. Pauta, discussão e decisões" action={editable && <button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'agenda' })}>Sugerir assunto</button>}>
      <p className="text-sm text-slate-600">{selected.length} assunto(s) selecionado(s) · {plannedMinutes} minutos previstos para discussão.</p>
      {plannedMinutes > 50 && <p className="text-sm text-amber-800">Reserve também tempo para abertura, acompanhamento e encerramento.</p>}
      {selected.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">A pauta ainda não foi selecionada pelo bispado.</p>}
      {selected.map((item, index) => <article key={item.id} className="space-y-3 rounded-xl border border-teal-200 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-lg font-bold text-teal-950">{index + 1}. {item.title}</h3><span className="text-xs text-slate-500">{item.estimatedMinutes} min</span></div>
        <p className="text-xs font-medium text-teal-800">{item.area}</p>
        <p className="text-xs text-slate-500">{item.organizations.map(key => WARD_COUNCIL_ORGANIZATIONS.find(org => org.key === key)?.label || key).join(' · ')}</p>
        {item.objective && <p className="whitespace-pre-wrap text-sm"><strong>Objetivo: </strong>{item.objective}</p>}
        {item.context && <p className="whitespace-pre-wrap text-sm text-slate-600"><strong>Contexto: </strong>{item.context}</p>}
        <div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><h4 className="text-sm font-semibold">Discussão</h4><p className="whitespace-pre-wrap text-sm">{item.discussion || 'Resumo ainda não registrado.'}</p></div>
          <div className="rounded-lg bg-teal-50 p-3"><h4 className="text-sm font-semibold">{COUNCIL_OUTCOMES[item.outcome]}</h4><p className="whitespace-pre-wrap text-sm">{item.decision || 'Decisão ou encaminhamento a registrar.'}</p></div></div>
        {editable && <div className="flex flex-wrap gap-2">
          <button disabled={busy} className={councilSecondary} onClick={() => onEdit?.({ kind: 'agenda', id: item.id })}>Registrar discussão / decisão</button>
          <button disabled={busy} className={councilSecondary} onClick={() => onEdit?.({ kind: 'action', agendaItemId: item.id })}>Criar designação</button>
          {canManage && <>
            <button disabled={busy || index === 0} aria-label={`Subir ${item.title}`} className={councilSecondary} onClick={() => onMutation?.({ type: 'agenda-move', id: item.id, direction: -1 })}>↑</button>
            <button disabled={busy || index === selected.length - 1} aria-label={`Descer ${item.title}`} className={councilSecondary} onClick={() => onMutation?.({ type: 'agenda-move', id: item.id, direction: 1 })}>↓</button>
            <button disabled={busy} className={councilSecondary} onClick={() => onMutation?.({ type: 'agenda-edit', id: item.id, patch: { selected: false } })}>Reservar para outra reunião</button>
          </>}
        </div>}
        {record.actionItems.filter(action => action.agendaItemId === item.id).map(action => <CouncilActionCard key={action.id} action={action}>{actionControls(action)}</CouncilActionCard>)}
      </article>)}
      <details open={suggestions.length > 0} className="rounded-lg border border-dashed border-slate-300 p-4"><summary className="cursor-pointer font-semibold text-slate-700">Sugestões e assuntos reservados ({suggestions.length})</summary>
        <p className="my-2 text-xs text-slate-500">O bispado seleciona os assuntos que serão discutidos nesta reunião.</p>
        <div className="space-y-3">{suggestions.map(item => <div key={item.id} className="space-y-2 border-t border-slate-200 pt-3">
          <h3 className="font-semibold">{item.title}</h3><p className="whitespace-pre-wrap text-sm">{item.objective}</p><p className="text-xs text-slate-500">Sugerido por {item.createdBy}</p>
          {editable && <div className="flex flex-wrap gap-2"><button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'agenda', id: item.id })}>Editar sugestão</button>
            {canManage && <button className={councilSecondary} disabled={busy} onClick={() => onMutation?.({ type: 'agenda-edit', id: item.id, patch: { selected: true } })}>Incluir na pauta</button>}</div>}
          {record.actionItems.filter(action => action.agendaItemId === item.id).map(action => <CouncilActionCard key={action.id} action={action}>{actionControls(action)}</CouncilActionCard>)}
        </div>)}</div>
      </details>
    </CouncilSection>

    <CouncilSection title="4. Designações gerais" action={editable && <button className={councilSecondary} disabled={busy} onClick={() => onEdit?.({ kind: 'action' })}>Nova designação</button>}>
      <p className="text-sm text-slate-600">As designações ligadas a assuntos aparecem na pauta, acima.</p>
      {record.actionItems.filter(action => !action.agendaItemId).map(action => <CouncilActionCard key={action.id} action={action}>{actionControls(action)}</CouncilActionCard>)}
      {!record.actionItems.some(action => !action.agendaItemId) && <p className="text-sm text-slate-500">Nenhuma designação geral.</p>}
    </CouncilSection>

    {Object.values(record.organizationMatters || {}).some(Boolean) && <CouncilSection title="Registros anteriores por organização">
      <p className="text-sm text-slate-500">Conteúdo preservado da versão anterior da ata.</p>
      {Object.entries(record.organizationMatters).filter(([, value]) => value).map(([key, value]) => <div key={key}><h3 className="font-semibold">{WARD_COUNCIL_ORGANIZATIONS.find(org => org.key === key)?.label || key}</h3><p className="whitespace-pre-wrap text-sm">{value}</p></div>)}
    </CouncilSection>}

    <CouncilSection title="5. Revisão e encerramento">
      <p className="text-sm">{selected.filter(item => item.outcome === 'decided').length} decisão(ões) · {selected.filter(item => ['deferred', 'information', 'referred'].includes(item.outcome)).length} assunto(s) adiado(s) ou encaminhado(s) · {record.actionItems.filter(action => !action.completed).length} designação(ões) pendente(s).</p>
      <p className="text-sm"><strong>Oração de encerramento:</strong> {record.closingPrayer || 'A preencher'}</p>
      {record.finalizedAt && record.status !== 'draft' && <p className="text-xs text-slate-500">Finalizada por {record.finalizedBy} em {new Date(record.finalizedAt).toLocaleString('pt-BR')}.</p>}
    </CouncilSection>
  </div>;
}
