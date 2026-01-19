/**
 * Página de Visualização - Exibir Ata de Reunião de Bispado
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BishopricRecord } from '@/types';
import { ArrowLeft, Check, X, Save, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { getBishopricRecordFromCloud, saveBishopricRecordToCloud } from '@/lib/bishopricFirestore';
import { ErrorModal } from '@/components/ErrorModal';

export default function BishopricView() {
  const [record, setRecord] = useState<BishopricRecord | null>(null);
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
    localStorage.setItem('bishopricRecord', JSON.stringify(record));
    setLocation('/bishopric');
    toast.success('Ata carregada para edição', { duration: 2000 });
  };

  const handleSave = async () => {
    if (!record) return;

    // Validação básica com trim para verificar strings vazias
    const isDateValid = record.date && record.date.trim() !== '';
    const isPresidedByValid = record.presidedBy && record.presidedBy.trim() !== '';

    if (!isDateValid || !isPresidedByValid) {
      setShowErrorModal(true);
      return;
    }

    try {
      setSaving(true);
      await saveBishopricRecordToCloud(record);
      
      toast.success('✅ ATA SALVA COM SUCESSO!', {
        duration: 3000,
        className: 'toast-success-bishopric',
      });
    } catch (error) {
      console.error('[BishopricView] Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar ata. Tente novamente.', {
        duration: 4000,
        className: 'toast-error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActionCompleted = (actionId: string) => {
    if (!record) return;
    
    setRecord({
      ...record,
      actionItems: record.actionItems.map(action => 
        action.id === actionId ? { ...action, completed: !action.completed } : action
      )
    });
  };

  const loadRecord = async (recordId: string) => {
    try {
      setLoading(true);
      console.log('[BishopricView] Carregando ata:', recordId);
      const data = await getBishopricRecordFromCloud(recordId);
      
      if (data) {
        setRecord(data);
      } else {
        toast.error('Ata de bispado não encontrada');
        setLocation('/bishopric/history');
      }
    } catch (error) {
      console.error('[BishopricView] Erro ao carregar:', error);
      toast.error('Erro ao carregar ata de bispado');
      setLocation('/bishopric/history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#3498db] border-t-transparent"></div>
          <p className="mt-4 text-[#34495e] font-['Poppins']">Carregando ata...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c3e50] via-[#34495e] to-[#2c3e50] shadow-xl">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex gap-3 mb-6 flex-wrap">
            <Button
              onClick={() => setLocation('/bishopric/history')}
              className="flex-1 min-w-[200px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
            >
              <ArrowLeft size={18} />
              Voltar ao Histórico
            </Button>
            <Button
              onClick={handleEdit}
              className="flex-1 min-w-[200px] bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
            >
              <Edit size={18} />
              Editar Ata
            </Button>
          </div>
          
          <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white">
              <span className="text-5xl">📋</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 font-['Playfair_Display']">
              Reunião de Bispado
            </h1>
            <p className="text-lg text-white/80 mt-2 font-['Poppins']">
              {formatDate(record.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12">
          {/* Informações da Reunião */}
          <div className="space-y-6">
            <Section title="Abertura">
              <Field label="Presidida por" value={record.presidedBy} />
              <Field label="Oração de Abertura" value={record.openingPrayer} />
            </Section>

            <Section title="Assuntos Tratados">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-[#34495e] whitespace-pre-wrap font-['Poppins']">
                  {record.discussedMatters || '—'}
                </p>
              </div>
            </Section>

            {record.actionItems && record.actionItems.length > 0 && (
              <Section title="Ações para Próxima Reunião">
                <div className="space-y-3">
                  {record.actionItems.map((action, index) => (
                    <div 
                      key={action.id || index} 
                      className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-[#3498db]/30"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <button
                          onClick={() => toggleActionCompleted(action.id)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                            action.completed
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {action.completed ? <Check size={14} /> : <X size={14} />}
                          {action.completed ? 'Concluído' : 'Pendente'}
                        </button>
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
          <div className="mt-12 pt-8 border-t-2 border-[#3498db] text-center text-sm text-[#34495e]/70 font-['Poppins']">
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
              className="bg-gradient-to-r from-[#3498db] to-[#2980b9] hover:from-[#2980b9] hover:to-[#3498db] text-white px-12 py-3 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {saving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message="Por favor, preencha todos os campos obrigatórios antes de salvar: Data e Presidida por."
        theme="blue"
      />
    </div>
  );
}

// Componentes auxiliares
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-[#34495e] mb-4 flex items-center gap-2 font-['Poppins'] border-b border-[#3498db] pb-2">
        <span className="w-2 h-2 bg-[#3498db] rounded-full"></span>
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
      <p className="text-sm font-semibold text-[#34495e]/70 font-['Poppins']">{label}</p>
      <p className="text-[#34495e] font-['Poppins']">{value || '—'}</p>
    </div>
  );
}
