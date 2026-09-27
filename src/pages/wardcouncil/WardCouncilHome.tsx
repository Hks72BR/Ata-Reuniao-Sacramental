import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { createBlankWardCouncilRecord } from '@/lib/wardCouncilFirestore';
import { AUTH_CONFIG, isAuthenticated, login } from '@/lib/auth';
import { councilLocalMode } from '@/lib/wardCouncilLocal';
import { councilButton, councilSecondary } from '@/components/WardCouncilForms';

export default function WardCouncilHome() {
  const [, navigate] = useLocation();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!councilLocalMode && !isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) navigate('/wardcouncil/history');
  }, [navigate]);
  return <main className="min-h-screen bg-teal-50 px-4 py-16"><section className="mx-auto max-w-xl space-y-5 rounded-xl bg-white p-8 shadow-sm">
    <h1 className="text-3xl font-bold text-teal-950">Nova reunião de conselho de ala</h1>
    <p className="text-slate-600">Prepare a pauta, registre decisões e acompanhe as designações anteriores em uma única ata.</p>
    {councilLocalMode && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Teste local: ao criar a reunião você entra como bispado de teste. Os dados do conselho ficam somente neste navegador.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-3"><button className={councilButton} disabled={creating} onClick={async () => {
      if (creating) return;
      if (councilLocalMode) login(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY, AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
      if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) return;
      setCreating(true); setError('');
      try { const id = await createBlankWardCouncilRecord(); navigate(`/wardcouncil/edit/${id}`); }
      catch { setError('Não foi possível criar a ata. Tente novamente.'); setCreating(false); }
    }}>{creating ? 'Criando…' : 'Criar reunião'}</button><button className={councilSecondary} disabled={creating} onClick={() => navigate('/wardcouncil/history')}>Ver histórico</button></div>
  </section></main>;
}
