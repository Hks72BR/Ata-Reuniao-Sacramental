/**
 * Banner de Notificação de Itens Pendentes
 * Exibe alertas proeminentes no Dashboard sobre itens de ação não resolvidos
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, BellRing, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';
import {
  checkAllPendingItems,
  sendPendingNotification,
  requestNotificationPermission,
  type PendingItemsReport,
  type PendingItemSummary,
} from '@/lib/pendingItemsService';
import { formatDate } from '@/lib/utils';

export function PendingItemsBanner() {
  const [report, setReport] = useState<PendingItemsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadPendingItems();
    // Verificar status de notificações
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const loadPendingItems = async () => {
    try {
      setLoading(true);
      const result = await checkAllPendingItems();
      setReport(result);

      // Enviar notificação push se houver itens pendentes
      if (result.totalPending > 0) {
        // Só notificar uma vez por sessão
        const lastNotified = sessionStorage.getItem('pending_items_notified');
        if (!lastNotified) {
          await sendPendingNotification(result);
          sessionStorage.setItem('pending_items_notified', 'true');
        }
      }
    } catch (error) {
      console.error('[PendingItemsBanner] Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted && report && report.totalPending > 0) {
      await sendPendingNotification(report);
      sessionStorage.setItem('pending_items_notified', 'true');
    }
  };

  if (loading) return null;
  if (!report || report.totalPending === 0) return null;
  if (dismissed) return null;

  const sourceIcons: Record<string, string> = {
    wardcouncil: '👥',
    bishopric: '🏛️',
    interviews: '📋',
  };

  const sourceColors: Record<string, string> = {
    wardcouncil: 'from-purple-600 to-indigo-600',
    bishopric: 'from-blue-600 to-indigo-600',
    interviews: 'from-teal-600 to-cyan-600',
  };

  // Agrupar por fonte
  const grouped: Record<string, PendingItemSummary[]> = {};
  for (const s of report.summaries) {
    if (!grouped[s.source]) grouped[s.source] = [];
    grouped[s.source].push(s);
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 mb-6">
      {/* Banner Principal */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-2xl shadow-2xl border border-red-400/30 animate-pulse-slow">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
          }} />
        </div>

        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center animate-bounce">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg md:text-xl font-['Poppins'] flex items-center gap-2">
                  <BellRing className="w-5 h-5 animate-wiggle" />
                  ITENS DE AÇÃO NÃO RESOLVIDOS!
                </h3>
                <p className="text-white/90 text-sm font-medium">
                  ⚠️ {report.totalPending} item(ns) pendente(s) — FAVOR VERIFICAR!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white"
                title={expanded ? 'Recolher' : 'Ver detalhes'}
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(grouped).map(([source, items]) => {
              const total = items.reduce((s, i) => s + i.pendingItems, 0);
              return (
                <div
                  key={source}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                  <span className="text-lg">{sourceIcons[source]}</span>
                  <span className="text-white font-semibold text-sm">
                    {items[0].sourceLabel}: {total}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Botão de notificações */}
          {!notificationsEnabled && 'Notification' in window && (
            <button
              onClick={handleEnableNotifications}
              className="mt-3 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-white text-sm font-medium transition-all"
            >
              <Bell size={16} />
              Ativar notificações no celular
            </button>
          )}

          {/* Detalhes expandidos */}
          {expanded && (
            <div className="mt-4 space-y-3">
              {Object.entries(grouped).map(([source, items]) => (
                <div key={source} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="text-lg">{sourceIcons[source]}</span>
                    {items[0].sourceLabel}
                  </h4>
                  <div className="space-y-2">
                    {items.map((summary) => (
                      <div
                        key={summary.recordId}
                        className="bg-white/10 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/90 text-xs font-semibold">
                            📅 {formatDate(summary.recordDate)} — {summary.pendingItems}/{summary.totalItems} pendentes
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {summary.items.slice(0, 5).map((item, idx) => (
                            <li key={idx} className="text-white/80 text-xs flex items-start gap-2">
                              <span className="text-red-300 mt-0.5">●</span>
                              <span>
                                {item.description}
                                {item.responsible && (
                                  <span className="text-amber-300 ml-1">→ {item.responsible}</span>
                                )}
                              </span>
                            </li>
                          ))}
                          {summary.items.length > 5 && (
                            <li className="text-white/60 text-xs ml-4">
                              ... e mais {summary.items.length - 5} item(ns)
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
