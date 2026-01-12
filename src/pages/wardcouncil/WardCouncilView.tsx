/**
 * Página de Visualização - Exibir Ata de Conselho de Ala
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WardCouncilRecord } from '@/types';
import { ArrowLeft, Check, X, Save, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { getWardCouncilRecordFromCloud, saveWardCouncilRecordToCloud } from '@/lib/wardCouncilFirestore';
import { ErrorModal } from '@/components/ErrorModal';

export default function WardCouncilView() {
  const [record, setRecord] = useState<WardCouncilRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  
  // Extrair ID da URL
  const id = location.split('/').pop();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }

    if (id) {
      loadRecord(id);
    }
  }, [id]);

  const handleEdit = () => {
    if (!record) return;
    localStorage.setItem('wardCouncilRecord', JSON.stringify(record));
    setLocation('/wardcouncil');
    toast.success('Ata carregada para edição', { duration: 2000 });
  };

  const handleSave = async () => {
    if (!record) return;

    // Validação básica
    if (!record.date || !record.presidedBy) {
      setShowErrorModal(true);
      return;
    }

    try {
      setSaving(true);
      await saveWardCouncilRecordToCloud(record);
      toast.success('ATA SALVA COM SUCESSO', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px'
        }
      });
    } catch (error) {
      console.error('[WardCouncilView] Erro ao salvar:', error);
      toast.error('Erro ao salvar ata');
    } finally {
      setSaving(false);
    }
  };

  const loadRecord = async (recordId: string) => {
    try {
      setLoading(true);
      console.log('[WardCouncilView] Carregando ata:', recordId);
      const data = await getWardCouncilRecordFromCloud(recordId);
      
      if (data) {
        setRecord(data);
      } else {
        toast.error('Ata de conselho não encontrada');
        setLocation('/wardcouncil/history');
      }
    } catch (error) {
      console.error('[WardCouncilView] Erro ao carregar:', error);
      toast.error('Erro ao carregar ata de conselho');
      setLocation('/wardcouncil/history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent"></div>
          <p className="mt-4 text-teal-800 font-['Poppins'] font-semibold">Carregando ata...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  const organizationNames: { [key: string]: string } = {
    rapazes: '👔 Rapazes',
    mocas: '🌸 Moças',
    socorro: '💐 Sociedade de Socorro',
    elderes: '📖 Quórum de Elderes',
    missionaria: '🌍 Obra Missionária',
    primaria: '🎨 Primária'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 shadow-2xl">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex gap-3 mb-6 flex-wrap">
            <Button
              onClick={() => setLocation('/wardcouncil/history')}
              className="flex-1 min-w-[200px] bg-white border-2 border-amber-500 text-teal-800 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
            >
              <ArrowLeft size={18} />
              Voltar ao Histórico
            </Button>
            <Button
              onClick={handleEdit}
              className="flex-1 min-w-[200px] bg-white border-2 border-teal-600 text-teal-800 hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
            >
              <Edit size={18} />
              Editar Ata
            </Button>
          </div>
          
          <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white">
              <span className="text-5xl">🤝</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 font-['Playfair_Display']">
              Conselho de Ala
            </h1>
            <p className="text-lg text-white/80 mt-2 font-['Poppins']">
              {formatDate(record.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-8 md:p-12 border-2 border-teal-600/30">
          {/* Informações da Reunião */}
          <div className="space-y-6">
            <Section title="Abertura">
              <Field label="Presidida por" value={record.presidedBy} />
              <Field label="Dirigida por" value={record.directedBy} />
              <Field label="Oração de Abertura" value={record.openingPrayer} />
            </Section>

            <Section title="Assuntos Tratados por Organização">
              {Object.entries(record.organizationMatters).map(([org, matters]) => (
                <div key={org} className="mb-4">
                  <h4 className="text-md font-semibold text-teal-800 mb-2 font-['Poppins']">
                    {organizationNames[org]}
                  </h4>
                  <div className="p-4 bg-teal-50/80 rounded-lg border-2 border-teal-600/20">
                    <p className="text-gray-700 whitespace-pre-wrap font-['Poppins']">
                      {matters || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </Section>

            {record.actionItems && record.actionItems.length > 0 && (
              <Section title="Itens de Ação">
                <div className="space-y-3">
                  {record.actionItems.map((action, index) => (
                    <div 
                      key={action.id || index} 
                      className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-500/40 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          action.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-200 text-amber-800'
                        }`}>
                          {action.completed ? <Check size={14} /> : <X size={14} />}
                          {action.completed ? 'Concluído' : 'Pendente'}
                        </div>
                      </div>
                      
                      <Field label="Descrição" value={action.description} />
                      {action.responsible && (
                        <Field label="Responsável" value={action.responsible} />
                      )}
                      {action.notes && (
                        <Field label="Observações" value={action.notes} />
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Encerramento">
              <Field label="Oração de Encerramento" value={record.closingPrayer} />
            </Section>
          </div>

          {/* Rodapé */}
          <div className="mt-12 pt-8 border-t-2 border-amber-500 text-center text-sm text-gray-600 font-['Poppins']">
            <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="mt-2">Sistema de Atas - Ala Casa Grande</p>
            {record.createdBy && (
              <p className="mt-2 text-xs">Criado por: {record.createdBy}</p>
            )}
            {record.lastEditedBy && record.lastEditedAt && (
              <p className="text-xs">
                Última edição: {record.lastEditedBy} em {new Date(record.lastEditedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          {/* Botão Salvar */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
            >
              <Save size={24} />
              {saving ? 'Salvando...' : 'Salvar Ata'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erros na Ata"
        message="OS ERROS DEVEM SER CORRIGIDOS"
        details="Certifique-se de que todos os campos obrigatórios foram preenchidos corretamente."
      />
    </div>
  );
}

// Componentes auxiliares
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2 font-['Poppins'] border-b-2 border-amber-500 pb-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
        {title}
      </h3>
      <div className="space-y-3 ml-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold text-teal-700 font-['Poppins']">{label}</p>
      <p className="text-gray-700 font-['Poppins']">{value || '—'}</p>
    </div>
  );
}
