import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import type { WardCouncilRecord } from '@/types';
import { WardCouncilUserModal } from '@/components/WardCouncilUserModal';
import { CouncilActionForm, CouncilAgendaForm, CouncilMetadataForm, CouncilProgressForm, CouncilField, councilButton, councilSecondary } from '@/components/WardCouncilForms';
import { WardCouncilContent, type CouncilEditor } from '@/components/WardCouncilContent';
import { AUTH_CONFIG, getRemainingAttempts, hasCouncilAccess, isAuthenticated, isLockedOut, login, recordLoginAttempt, matchesConfiguredPin } from '@/lib/auth';
import { mutateCouncilRecord, recordCouncilActionUpdate, removeEditorPresence, subscribeToCouncilRecords, subscribeToWardCouncilRecord, updateEditorPresence } from '@/lib/wardCouncilFirestore';
import { councilLocalMode } from '@/lib/wardCouncilLocal';
import type { CouncilMutation } from '@/lib/wardCouncilWorkflow';

export default function WardCouncilEdit() {
  const [location, navigate] = useLocation();
  const id = location.split('/wardcouncil/edit/')[1];
  const [record, setRecord] = useState<WardCouncilRecord | null>(null);
  const [records, setRecords] = useState<WardCouncilRecord[]>([]);
  const [error, setError] = useState('');
  const [previousError, setPreviousError] = useState('');
  const [previousLoading, setPreviousLoading] = useState(true);
  const [userName, setUserName] = useState(sessionStorage.getItem('wardcouncil_user_name') || '');
  const [userOrg, setUserOrg] = useState(sessionStorage.getItem('wardcouncil_user_org') || '');
  const [identify, setIdentify] = useState(!userName || !userOrg);
  const [editor, setEditor] = useState<CouncilEditor | null>(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [canManage, setCanManage] = useState(isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY));
  const [showAccess, setShowAccess] = useState(false);
  const [pin, setPin] = useState('');
  const [accessError, setAccessError] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID());
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasCouncilAccess()) { navigate('/'); return; }
    setError('');
    return subscribeToWardCouncilRecord(id, data => {
      if (!data) { setError('Ata não encontrada. Volte ao histórico.'); return; }
      setRecord(data);
    }, () => setError('Não foi possível carregar a ata. Verifique sua conexão e recarregue a página.'));
  }, [id, navigate]);

  useEffect(() => {
    if (!hasCouncilAccess()) return;
    return subscribeToCouncilRecords(data => { setRecords(data); setPreviousLoading(false); setPreviousError(''); }, () => {
      setPreviousLoading(false); setPreviousError('Não foi possível carregar as designações anteriores. Recarregue a página para tentar novamente.');
    });
  }, []);

  const loaded = !!record;
  useEffect(() => {
    if (!loaded || !userName || !userOrg) return;
    const update = () => updateEditorPresence(id, sessionId, { sessionId, userName, organization: userOrg, currentField: editor?.kind || null, color: '#0f766e', lastUpdate: new Date().toISOString() });
    void update();
    const timer = setInterval(update, 15000);
    return () => { clearInterval(timer); void removeEditorPresence(id, sessionId); };
  }, [id, loaded, userName, userOrg, sessionId, editor?.kind]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (editor || busy) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editor, busy]);

  const go = (path: string) => {
    if (!busy && (!editor || window.confirm('Sair sem salvar o formulário aberto?'))) navigate(path);
  };
  const openEditor = (next: CouncilEditor) => {
    if (editor && !window.confirm('Descartar as alterações do formulário aberto?')) return;
    setEditor(next);
    setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); formRef.current?.querySelector<HTMLInputElement>('input, textarea, select')?.focus({ preventScroll: true }); }, 50);
  };
  const cancelEditor = () => { if (window.confirm('Descartar as alterações deste formulário?')) setEditor(null); };
  const saveForm = async (mutation: CouncilMutation) => {
    setBusy(true);
    try { await mutateCouncilRecord(id, mutation, userName); setEditor(null); toast.success('Alterações salvas.'); }
    finally { setBusy(false); }
  };
  const runMutation = async (mutation: CouncilMutation) => {
    if (busy || editor) return;
    setBusy(true);
    try { await mutateCouncilRecord(id, mutation, userName); toast.success(mutation.type === 'finalize' ? 'Ata finalizada. As designações poderão ser acompanhadas na próxima reunião.' : 'Alteração salva.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  };

  const unlock = () => {
    const locked = isLockedOut();
    if (locked.locked) { setAccessError(`Aguarde ${locked.remainingTime} minuto(s) para tentar novamente.`); return; }
    if (!AUTH_CONFIG.SACRAMENTAL_PIN) { setAccessError('Acesso do bispado não configurado. Contate o administrador.'); return; }
    if (!matchesConfiguredPin(pin, AUTH_CONFIG.SACRAMENTAL_PIN)) { recordLoginAttempt(false); setAccessError(`PIN incorreto. Tentativas restantes: ${getRemainingAttempts()}.`); return; }
    recordLoginAttempt(true); login(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY, AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
    setCanManage(true); setShowAccess(false); setPin(''); setAccessError('');
  };
  const otherEditors = Object.values(record?.activeEditors || {}).filter(entry => entry.sessionId !== sessionId && Date.now() - new Date(entry.lastUpdate).getTime() < 30000);
  return <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 pb-12">
    <header className="bg-teal-900 px-4 py-8 text-white"><div className="mx-auto max-w-5xl"><p className="text-sm text-teal-200">Pauta → discussão → decisões → ações</p><h1 className="mt-2 text-3xl font-bold font-playfair">Conselho de ala</h1><p className="mt-2 text-sm">Prepare a reunião e acompanhe o serviço às pessoas e famílias.</p></div></header>
    <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
      {councilLocalMode && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Teste local: as atas do conselho ficam somente neste navegador. Nenhuma alteração do conselho é enviada ao Firebase.</p>}
      <nav className="flex flex-wrap gap-2" aria-label="Navegação da ata"><button className={councilSecondary} disabled={busy} onClick={() => go('/wardcouncil/history')}>Histórico</button><button className={councilSecondary} disabled={busy} onClick={() => go(`/wardcouncil/view/${id}`)}>Visualizar ata</button><button className={councilSecondary} disabled={busy || !!editor} onClick={() => setIdentify(true)}>Trocar identificação</button></nav>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {!record && !error && <p role="status">Carregando ata…</p>}
      {record && <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm"><div><strong>{record.status === 'draft' ? 'Em preparação' : 'Ata finalizada'}</strong><p className="text-slate-600">{userName || 'Identifique-se para editar'} · {online ? 'Conectado' : 'Sem conexão — aguarde para salvar'}</p>{otherEditors.length > 0 && <p className="text-teal-700">Também nesta ata: {otherEditors.map(entry => entry.userName).join(', ')}</p>}</div>
          <div role="status">{busy ? 'Salvando…' : editor ? 'Formulário aberto — salve ao terminar' : 'Nenhum formulário pendente'}</div>
        </div>
        {!canManage && <div className="rounded-lg bg-slate-100 p-4 text-sm"><p>O acesso do bispado permite selecionar e ordenar a pauta, finalizar e reabrir a ata.</p><button className={`${councilSecondary} mt-2`} onClick={() => setShowAccess(value => !value)}>Acesso do bispado</button>
          {showAccess && <form className="mt-3 flex max-w-sm flex-col gap-2" onSubmit={e => { e.preventDefault(); unlock(); }}><CouncilField label="PIN do bispado" type="password" value={pin} onChange={setPin} required /><button className={councilButton}>Liberar organização da pauta</button>{accessError && <p role="alert" className="text-red-700">{accessError}</p>}</form>}
        </div>}
        {record.status !== 'draft' && <p className="rounded-lg bg-teal-100 p-4 text-sm">O conteúdo desta reunião está finalizado. Os retornos das designações podem ser registrados em uma nova reunião.{canManage && <button className={`${councilSecondary} ml-2`} disabled={busy} onClick={() => void runMutation({ type: 'reopen' })}>Reabrir ata</button>}</p>}
        <div ref={formRef} className="scroll-mt-4">
          {editor?.kind === 'metadata' && <CouncilMetadataForm key="metadata" record={record} onSave={saveForm} onCancel={cancelEditor} />}
          {editor?.kind === 'agenda' && <CouncilAgendaForm key={`agenda-${editor.id || 'new'}`} item={record.agendaItems?.find(item => item.id === editor.id)} userName={userName} onSave={saveForm} onCancel={cancelEditor} />}
          {editor?.kind === 'action' && <CouncilActionForm key={`action-${editor.id || editor.agendaItemId || 'new'}`} item={record.actionItems.find(item => item.id === editor.id)} agenda={record.agendaItems || []} agendaItemId={editor.agendaItemId} onSave={saveForm} onCancel={cancelEditor} />}
          {editor?.kind === 'progress' && <CouncilProgressForm key={`progress-${editor.sourceId}-${editor.action.id}`} action={editor.action} onCancel={cancelEditor} onSave={async (progress, note) => {
            setBusy(true);
            try { await recordCouncilActionUpdate(editor.sourceId, editor.action.id, id, progress, note, userName); setEditor(null); toast.success('Retorno registrado na designação e nesta reunião.'); }
            finally { setBusy(false); }
          }} />}
        </div>
        <WardCouncilContent record={record} records={records} onEdit={openEditor} onMutation={mutation => void runMutation(mutation)} canManage={canManage} busy={busy || !!editor || !userName || (!online && !councilLocalMode)} previousError={previousError} previousLoading={previousLoading} />
        {canManage && record.status === 'draft' && <div className="rounded-xl border border-teal-300 bg-teal-50 p-5"><h2 className="mb-2 font-bold text-teal-950">Finalizar esta reunião</h2><p className="mb-4 text-sm text-slate-700">Confira as decisões e os responsáveis. Finalizar preserva o conteúdo da ata; os retornos continuam nas próximas reuniões.</p>
          <button className={councilButton} disabled={busy || !!editor || !userName || (!online && !councilLocalMode)} onClick={() => { if (window.confirm('Finalizar a ata após conferir as decisões e designações?')) void runMutation({ type: 'finalize' }); }}>Finalizar ata</button>
        </div>}
      </>}
    </div>
    <WardCouncilUserModal isOpen={identify} onConfirm={(name, org) => { setUserName(name); setUserOrg(org); setIdentify(false); }} onClose={() => { if (userName && userOrg) setIdentify(false); else navigate('/wardcouncil/history'); }} />
  </main>;
}
