/**
 * Widget de Atas de Conselho de Ala - Dashboard
 * Mostra as atas disponíveis do dia para os membros editarem em tempo real
 */

import { useState, useEffect } from 'react';
import { WardCouncilRecord } from '@/types';
import { getAllWardCouncilRecordsFromCloud } from '@/lib/wardCouncilFirestore';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Calendar, FileText, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { WardCouncilUserModal } from './WardCouncilUserModal';

export default function WardCouncilDashboardWidget() {
  const [records, setRecords] = useState<WardCouncilRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<WardCouncilRecord | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadAtasDodia();
  }, []);

  const loadAtasDodia = async () => {
    try {
      setLoading(true);
      const allRecords = await getAllWardCouncilRecordsFromCloud();
      
      // Filtrar atas de hoje (considerando que as atas recentes são do dia)
      const today = new Date().toISOString().split('T')[0];
      const atasHoje = allRecords
        .filter(r => r.date && r.date.startsWith(today))
        .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
      
      // Se não houver atas de hoje, mostrar as 5 mais recentes
      const atasExibir = atasHoje.length > 0 
        ? atasHoje 
        : allRecords.slice(0, 5);
      
      setRecords(atasExibir);
    } catch (error) {
      console.error('Erro ao carregar atas:', error);
      toast.error('Erro ao carregar atas de conselho');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = (record: WardCouncilRecord) => {
    setSelectedRecord(record);
    setShowUserModal(true);
  };

  const handleUserModalSuccess = () => {
    if (selectedRecord?.id) {
      setShowUserModal(false);
      setSelectedRecord(null);
      setLocation(`/wardcouncil/edit/${selectedRecord.id}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200/50 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          <p className="text-teal-700 font-medium">Carregando atas do conselho...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 rounded-2xl p-8 backdrop-blur-sm">
        <div className="text-center">
          <FileText className="w-12 h-12 text-amber-600 mx-auto mb-3 opacity-50" />
          <p className="text-amber-700 font-medium">Nenhuma ata disponível no momento</p>
          <p className="text-amber-600 text-sm mt-1">Aguarde o Bispado criar as atas para a reunião</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-['Playfair_Display']">
              Conselhos Disponíveis
            </h3>
            <p className="text-gray-600 text-sm">Editar atas em tempo real durante a reunião</p>
          </div>
        </div>

        <div className="grid gap-4">
          {records.map((record) => {
            const totalActions = record.actionItems?.length || 0;
            const completedActions = record.actionItems?.filter(a => a.completed).length || 0;
            const hasOrganizationMatters = Object.values(record.organizationMatters || {})
              .some(m => m && m.trim().length > 0);

            return (
              <button
                key={record.id}
                onClick={() => handleSelectRecord(record)}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-teal-50 hover:to-emerald-50 border-2 border-teal-200/50 hover:border-teal-300 rounded-xl p-5 text-left transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/5 group-hover:to-emerald-500/5 rounded-xl transition-all duration-300" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Data da Reunião */}
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      <span className="font-bold text-lg text-gray-900">
                        {formatDate(record.date)}
                      </span>
                      <span className="ml-auto text-sm font-semibold text-teal-600 bg-teal-100 px-3 py-1 rounded-full">
                        {record.actionItems?.length || 0} ações
                      </span>
                    </div>

                    {/* Informações da Reunião */}
                    <div className="space-y-2 text-sm">
                      {record.presidedBy && (
                        <p className="text-gray-700">
                          <span className="font-semibold text-gray-900">Presidida por:</span> {record.presidedBy}
                        </p>
                      )}
                      {record.directedBy && (
                        <p className="text-gray-700">
                          <span className="font-semibold text-gray-900">Dirigida por:</span> {record.directedBy}
                        </p>
                      )}
                    </div>

                    {/* Assuntos Discutidos */}
                    {hasOrganizationMatters && (
                      <div className="mt-3 pt-3 border-t border-teal-100">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Organizações com assuntos:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(record.organizationMatters || {}).map(([key, value]) => {
                            if (!value || value.trim().length === 0) return null;
                            const emoji = getOrganizationEmoji(key);
                            return (
                              <span
                                key={key}
                                className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium"
                              >
                                {emoji}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de Ação */}
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-lg group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                      <Play className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso (se houver ações) */}
                {totalActions > 0 && (
                  <div className="mt-4 pt-3 border-t border-teal-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-600">
                        <strong>{completedActions}</strong> de <strong>{totalActions}</strong> ações concluídas
                      </span>
                      <span className="text-teal-600 font-semibold">
                        {Math.round((completedActions / totalActions) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-500"
                        style={{ width: `${(completedActions / totalActions) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Clique em qualquer ata para entrar na edição colaborativa em tempo real
        </p>
      </div>

      {/* Modal de Identificação do Usuário */}
      {selectedRecord && (
        <WardCouncilUserModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedRecord(null);
          }}
          onSuccess={handleUserModalSuccess}
        />
      )}
    </>
  );
}

// Função auxiliar para pegar emoji da organização
function getOrganizationEmoji(orgId: string): string {
  const emojis: Record<string, string> = {
    rapazes: '👔',
    mocas: '🌸',
    socorro: '💐',
    elderes: '📖',
    missionaria: '🌍',
    primaria: '🎨',
    escolaDominical: '📚',
    temploHistoriaFamilia: '⛪',
    bispado: '🏛️',
    secretario: '📋',
  };
  return emojis[orgId] || '👥';
}
