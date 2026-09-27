import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import type { WardCouncilRecord } from '@/types';
import { subscribeToWardCouncilRecord } from '@/lib/wardCouncilFirestore';
import { WardCouncilContent } from '@/components/WardCouncilContent';
import { councilSecondary } from '@/components/WardCouncilForms';
import { hasCouncilAccess } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { councilLocalMode } from '@/lib/wardCouncilLocal';

export default function WardCouncilView() {
  const [location, navigate] = useLocation();
  const id = location.split('/').pop()!;
  const [record, setRecord] = useState<WardCouncilRecord | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!hasCouncilAccess()) { navigate('/'); return; }
    return subscribeToWardCouncilRecord(id, data => { setRecord(data); if (!data) setError('Ata não encontrada.'); }, () => setError('Não foi possível carregar a ata. Recarregue para tentar novamente.'));
  }, [id, navigate]);
  return <main className="min-h-screen bg-teal-50 px-4 py-8"><div className="mx-auto max-w-5xl space-y-6">
    <nav className="flex flex-wrap gap-2"><button className={councilSecondary} onClick={() => navigate('/wardcouncil/history')}>Histórico</button><button className={councilSecondary} onClick={() => navigate(`/wardcouncil/edit/${id}`)}>Abrir edição</button></nav>
    <header><h1 className="text-3xl font-bold text-teal-950">Ata do conselho de ala</h1>{record && <p className="mt-2 text-slate-600">{formatDate(record.date)} · {record.status === 'draft' ? 'Em preparação' : 'Finalizada'}</p>}</header>
    {councilLocalMode && <p className="text-sm text-amber-800">Teste local — dados somente neste navegador.</p>}
    {error ? <p role="alert" className="text-red-700">{error}</p> : !record ? <p>Carregando ata…</p> : <WardCouncilContent record={record} />}
  </div></main>;
}
