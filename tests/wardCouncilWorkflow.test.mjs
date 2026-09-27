import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const { outputFiles } = await build({ entryPoints: ['src/lib/wardCouncilWorkflow.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { newCouncilRecord, applyCouncilMutation, applyCouncilActionUpdate, previousCouncilActions, changedFields } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const agenda = (id, selected = true) => ({ id, title: `Assunto ${id}`, objective: '', context: '', area: 'Cuidar dos necessitados', organizations: [], estimatedMinutes: 10, selected, discussion: '', decision: 'Preparar proposta.', outcome: 'decided', createdBy: 'Secretário' });
const action = id => ({ id, description: `Designação ${id}`, responsible: 'João', dueDate: '2026-10-10', completed: false });
const meeting = id => ({ ...newCouncilRecord(id), date: '2026-09-27', presidedBy: 'Bispo', directedBy: 'Bispo', agendaItems: [agenda('a'), agenda('b')], actionItems: [action('a'), action('b')] });
const update = (id, progress = 'completed') => ({ id, meetingId: 'next', meetingDate: '2026-10-04', recordedAt: '2026-10-04T12:00:00Z', recordedBy: 'João', note: 'Atividade realizada.', progress });

test('uma sugestão de participante não entra automaticamente na pauta', () => {
  const result = applyCouncilMutation(meeting('first'), { type: 'agenda-add', item: agenda('c') }, false);
  assert.equal(result.agendaItems.at(-1).selected, false);
});
test('somente acesso do bispado seleciona, ordena, finaliza e reabre', () => {
  for (const mutation of [{ type: 'agenda-edit', id: 'a', patch: { selected: false } }, { type: 'agenda-move', id: 'a', direction: 1 }, { type: 'finalize' }, { type: 'reopen' }]) {
    assert.throws(() => applyCouncilMutation(meeting('first'), mutation, false), /bispado/);
  }
});
test('ordenação movimenta assuntos selecionados sem descartar sugestões', () => {
  const record = meeting('first'); record.agendaItems.splice(1, 0, agenda('suggestion', false));
  const result = applyCouncilMutation(record, { type: 'agenda-move', id: 'a', direction: 1 }, true);
  assert.deepEqual(result.agendaItems.map(item => item.id), ['b', 'suggestion', 'a']);
  assert.deepEqual(record.agendaItems.map(item => item.id), ['a', 'suggestion', 'b']);
});
test('edições concorrentes em assuntos diferentes são preservadas', () => {
  let record = meeting('first');
  record = applyCouncilMutation(record, { type: 'agenda-edit', id: 'a', patch: { discussion: 'Primeiro relato' } }, false);
  record = applyCouncilMutation(record, { type: 'agenda-edit', id: 'b', patch: { discussion: 'Segundo relato' } }, false);
  assert.deepEqual(record.agendaItems.map(item => item.discussion), ['Primeiro relato', 'Segundo relato']);
});
test('conflito no mesmo campo é informado sem sobrescrever o trabalho anterior', () => {
  const record = meeting('first');
  const change = changedFields(record.agendaItems[0], { ...record.agendaItems[0], discussion: 'Meu relato' });
  const current = applyCouncilMutation(record, { type: 'agenda-edit', id: 'a', patch: { discussion: 'Relato de outra pessoa' } }, false);
  assert.throws(() => applyCouncilMutation(current, { type: 'agenda-edit', id: 'a', ...change }, false), /outra pessoa/);
});
test('adiamento exige encaminhamento e permite finalizar sem criar ação artificial', () => {
  const record = meeting('first'); record.actionItems = []; record.agendaItems[0].outcome = 'deferred';
  assert.equal(applyCouncilMutation(record, { type: 'finalize' }, true).status, 'completed');
  record.agendaItems[0].decision = '';
  assert.throws(() => applyCouncilMutation(record, { type: 'finalize' }, true), /encaminhamento/);
});
test('finalização valida dados básicos e assuntos ainda em discussão', () => {
  const record = meeting('first'); record.presidedBy = '';
  assert.throws(() => applyCouncilMutation(record, { type: 'finalize' }, true), /Preencha/);
  record.presidedBy = 'Bispo'; record.agendaItems[0].outcome = 'open';
  assert.throws(() => applyCouncilMutation(record, { type: 'finalize' }, true), /encaminhamento/);
});
test('novas designações exigem responsável, prazo e vínculo válido', () => {
  const record = meeting('first');
  for (const item of [{ ...action('x'), responsible: '' }, { ...action('x'), dueDate: '' }, { ...action('x'), agendaItemId: 'inexistente' }]) {
    assert.throws(() => applyCouncilMutation(record, { type: 'action-add', item }, false));
  }
});
test('edições concorrentes em designações não substituem a lista inteira', () => {
  let record = meeting('first');
  record = applyCouncilMutation(record, { type: 'action-edit', id: 'a', patch: { responsible: 'Maria' } }, false);
  record = applyCouncilMutation(record, { type: 'action-edit', id: 'b', patch: { dueDate: '2026-10-12' } }, false);
  assert.equal(record.actionItems[0].responsible, 'Maria'); assert.equal(record.actionItems[1].dueDate, '2026-10-12');
});
test('ata finalizada bloqueia edição até ser reaberta', () => {
  const record = applyCouncilMutation(meeting('first'), { type: 'finalize' }, true);
  assert.throws(() => applyCouncilMutation(record, { type: 'metadata', patch: { presidedBy: 'Outro' } }, true), /Reabra/);
  assert.equal(applyCouncilMutation(record, { type: 'reopen' }, true).status, 'draft');
});
test('retorno atualiza a ação original e guarda relato na reunião seguinte sem duplicar ação', () => {
  const source = { ...meeting('first'), status: 'completed' };
  const next = { ...newCouncilRecord('next'), date: '2026-10-04' };
  const { sourceUpdated, meetingUpdated } = applyCouncilActionUpdate(source, next, 'a', update('report'));
  assert.equal(sourceUpdated.actionItems[0].completed, true);
  assert.equal(sourceUpdated.actionItems[0].updates[0].meetingId, 'next');
  assert.equal(meetingUpdated.actionItems.length, 0);
  assert.equal(meetingUpdated.actionReviews.report.sourceRecordId, 'first');
  assert.equal(source.actionItems[0].completed, false);
});
test('retorno na própria reunião preserva ação e relato juntos', () => {
  const record = meeting('next');
  const { meetingUpdated } = applyCouncilActionUpdate(record, record, 'a', update('report', 'in_progress'));
  assert.equal(meetingUpdated.actionItems[0].progress, 'in_progress');
  assert.equal(meetingUpdated.actionItems[0].completed, false);
  assert.equal(meetingUpdated.actionReviews.report.actionId, 'a');
});
test('não registra retorno em reunião finalizada ou anterior à origem', () => {
  const source = meeting('first'); const next = meeting('next');
  assert.throws(() => applyCouncilActionUpdate(source, { ...next, status: 'completed' }, 'a', update('report')), /preparação/);
  assert.throws(() => applyCouncilActionUpdate(source, { ...next, date: '2026-01-01' }, 'a', update('report')), /nesta reunião/);
});
test('acompanhamento exclui reuniões futuras, arquivadas e a reunião atual', () => {
  const current = meeting('current');
  const records = [current, meeting('past'), { ...meeting('future'), date: '2027-01-01' }, { ...meeting('archive'), status: 'archived' }];
  assert.deepEqual(previousCouncilActions(records, current).map(item => item.record.id), ['past', 'past']);
});
test('atas antigas sem pauta continuam legíveis e podem ser complementadas', () => {
  const record = meeting('old'); delete record.agendaItems; delete record.schemaVersion;
  record.organizationMatters.primaria = 'Anotação antiga';
  const result = applyCouncilMutation(record, { type: 'agenda-add', item: agenda('new') }, true);
  assert.equal(result.organizationMatters.primaria, 'Anotação antiga'); assert.equal(result.actionItems.length, 2);
});
