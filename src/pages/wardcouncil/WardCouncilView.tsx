import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import type { WardCouncilRecord } from '@/types';
import { subscribeToWardCouncilRecord } from '@/lib/wardCouncilFirestore';
import { WardCouncilContent } from '@/components/WardCouncilContent';
import { councilSecondary } from '@/components/WardCouncilForms';
import { PinAuthModal } from '@/components/PinAuthModal';
import { AUTH_CONFIG, hasWardCouncilAccess } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { councilLocalMode } from '@/lib/wardCouncilLocal';

export default function WardCouncilView() {
  const [location, navigate] = useLocation();
  const id = location.split('/').pop()!;
  const shared = location.startsWith('/wardcouncil/shared/');
  const [authorized, setAuthorized] = useState(() => hasWardCouncilAccess());
  const [record, setRecord] = useState<WardCouncilRecord | null>(null);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  useEffect(() => {
    if (!authorized || !hasWardCouncilAccess()) {
      setAuthorized(false);
      setRecord(null);
      return;
    }
    setRecord(null);
    setError('');
    return subscribeToWardCouncilRecord(id, data => { setRecord(data); if (!data) setError('Ata não encontrada.'); }, () => setError('Não foi possível carregar a ata. Recarregue para tentar novamente.'));
  }, [id, location, authorized]);

  const share = async () => {
    const link = new URL(`/wardcouncil/shared/${encodeURIComponent(id)}`, window.location.origin).href;
    setShareLink(link);
    try {
      await navigator.clipboard.writeText(link);
      setShareMessage('Link copiado. Envie aos líderes; o acesso exige o PIN do Conselho.');
    } catch {
      setShareMessage('Copie o link abaixo e envie aos líderes. O acesso exige o PIN do Conselho.');
    }
  };

  if (!authorized) return <main className="min-h-screen bg-teal-50 px-4 py-8">
    <h1 className="text-3xl font-bold text-teal-950">Ata do conselho de ala</h1>
    <p className="mt-2 text-slate-600">Digite o PIN do Conselho para visualizar esta ata.</p>
    <PinAuthModal isOpen onClose={() => navigate('/')} onSuccess={() => setAuthorized(true)}
      title="Visualizar ata do Conselho" description="Use a senha padrão do Conselho de Ala para acessar esta ata."
      correctPin={AUTH_CONFIG.WARD_COUNCIL_PIN} storageKey={AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY} timestampKey={AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY} />
  </main>;

  return <main className="min-h-screen bg-teal-50 px-4 py-8"><div className="mx-auto max-w-5xl space-y-6">
    {!shared && <nav className="flex flex-wrap gap-2"><button className={councilSecondary} onClick={() => navigate('/wardcouncil/history')}>Histórico</button><button className={councilSecondary} onClick={() => navigate(`/wardcouncil/edit/${id}`)}>Abrir edição</button>
      {!councilLocalMode && <button className={councilSecondary} disabled={!record} onClick={() => void share()}>Compartilhar ata</button>}
    </nav>}
    <header><h1 className="text-3xl font-bold text-teal-950">Ata do conselho de ala</h1>{record && <p className="mt-2 text-slate-600">{formatDate(record.date)} · {record.status === 'draft' ? 'Em preparação' : 'Finalizada'}</p>}</header>
    {shared && <p className="text-sm text-slate-600">Ata compartilhada — somente leitura.</p>}
    {shareLink && <div className="space-y-2"><p role="status" className="text-sm text-teal-800">{shareMessage}</p><label className="block text-sm text-slate-600" htmlFor="council-share-link">Link da ata</label><input id="council-share-link" className="w-full rounded-lg border p-3" readOnly value={shareLink} onFocus={event => event.currentTarget.select()} /></div>}
    {councilLocalMode && <p className="text-sm text-amber-800">Teste local — dados somente neste navegador.</p>}
    {error ? <p role="alert" className="text-red-700">{error}</p> : !record ? <p>Carregando ata…</p> : <WardCouncilContent record={record} />}
  </div></main>;
}
