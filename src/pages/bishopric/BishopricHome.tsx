/**
 * Página Principal - Formulário de Ata de Reunião de Bispado
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { ErrorModal } from '@/components/ErrorModal';
import { BishopricRecord, ActionItem, BISHOPRIC_RECORD_INITIAL } from '@/types';
import { Download, Save, Plus, History, ArrowLeft, X, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { isAuthenticated, logout, AUTH_CONFIG } from '@/lib/auth';
import { saveBishopricRecordToCloud } from '@/lib/bishopricFirestore';

export default function BishopricHome() {
  const [record, setRecord] = useState<BishopricRecord>(BISHOPRIC_RECORD_INITIAL as BishopricRecord);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { isOnline, swReady } = useServiceWorker();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }

    // Carregar ata salva em localStorage (se existir) para edição
    const savedRecord = localStorage.getItem('bishopricRecord');
    if (savedRecord) {
      try {
        const parsed = JSON.parse(savedRecord);
        setRecord(parsed);
        toast.success('Ata carregada para edição', { duration: 2000, className: 'toast-success-bishopric' });
      } catch (error) {
        console.error('Erro ao carregar ata salva:', error);
      }
    }
  }, [setLocation]);

  const handleInputChange = (field: keyof BishopricRecord, value: any) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addActionItem = () => {
    const newAction: ActionItem = {
      id: Date.now().toString(),
      description: '',
      responsible: '',
      completed: false,
      notes: '',
    };
    setRecord((prev) => ({
      ...prev,
      actionItems: [...prev.actionItems, newAction],
    }));
  };

  const updateActionItem = (id: string, field: keyof ActionItem, value: any) => {
    setRecord((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeActionItem = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      actionItems: prev.actionItems.filter((item) => item.id !== id),
    }));
  };

  const toggleActionCompleted = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleSave = async () => {
    try {
      // Verificar se há erros de validação pendentes
      if (Object.keys(errors).length > 0) {
        setShowErrorModal(true);
        return;
      }
      
      // Validações básicas
      if (!record.date) {
        toast.error('Data é obrigatória');
        return;
      }
      if (!record.presidedBy) {
        toast.error('Presidida por é obrigatório');
        return;
      }

      // Preparar record com status e timestamps
      const recordToSave: BishopricRecord = {
        ...record,
        status: 'completed',
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Salvar no Firebase
      const savedId = await saveBishopricRecordToCloud(recordToSave);
      
      toast.success('✅ ATA DE BISPADO SALVA COM SUCESSO!', {
        duration: 4000,
        className: 'toast-success-bishopric',
        style: {
          background: '#10b981',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });

      // Atualizar ID se for novo registro
      if (!record.id || !record.id.startsWith('ata-')) {
        setRecord({ ...recordToSave, id: savedId });
      }

      // Limpar localStorage após salvar com sucesso
      localStorage.removeItem('bishopricRecord');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar ata de bispado');
    }
  };

  const handleDownload = () => {
    // Verificar se há erros de validação pendentes
    if (Object.keys(errors).length > 0) {
      setShowErrorModal(true);
      return;
    }
    
    toast.info('Funcionalidade de download em desenvolvimento');
  };

  const handleNewRecord = () => {
    if (confirm('Deseja criar uma nova ata de bispado? Os dados atuais serão perdidos se não forem salvos.')) {
      setRecord(BISHOPRIC_RECORD_INITIAL as BishopricRecord);
      setErrors({});
      localStorage.removeItem('bishopricRecord');
      toast.success('Nova ata de bispado criada', { className: 'toast-success-bishopric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section com tema de liderança */}
      <div className="relative w-full bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#2c3e50] py-16 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(52, 73, 94, 0.4) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-[#3498db] flex items-center justify-center shadow-xl">
              <span className="text-5xl">📋</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 font-['Playfair_Display']">
            Reunião de Bispado
          </h1>
          <p className="text-xl text-white/90 font-['Poppins']">
            Registro de Decisões e Ações
          </p>
        </div>
      </div>

      {/* Container Principal */}
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Status Online */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {swReady && (
              <span className="text-xs text-muted-foreground">✓ Pronto para offline</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            onClick={() => {
              logout(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
              setLocation('/');
            }}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Voltar ao Menu
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Download size={18} />
            Baixar
          </Button>
          <Button
            onClick={() => setLocation('/bishopric/history')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Histórico
          </Button>
          <Button
            onClick={() => setLocation('/bishopric/interviews')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Calendar size={18} />
            Entrevistas
          </Button>
          <Button
            onClick={handleNewRecord}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Nova Ata
          </Button>
        </div>

        {/* Form Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Data */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#3498db] rounded-full"></span>
              Data
            </h3>
            <InputField
              type="date"
              label="Data da Reunião"
              value={record.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              error={errors.date}
            />
          </div>

          {/* Informações Básicas */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair">
              Abertura
            </h3>
            <InputField
              label="Presidida por"
              value={record.presidedBy}
              onChange={(e) => handleInputChange('presidedBy', e.target.value)}
              placeholder="Nome completo"
              required
              error={errors.presidedBy}
            />
            <InputField
              label="Oração de Abertura"
              value={record.openingPrayer}
              onChange={(e) => handleInputChange('openingPrayer', e.target.value)}
              placeholder="Pessoa que fará a oração"
            />
          </div>

          {/* Assuntos Tratados */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair">
              Assuntos Tratados
            </h3>
            <TextAreaField
              label="Registro dos Assuntos Discutidos"
              value={record.discussedMatters}
              onChange={(e) => handleInputChange('discussedMatters', e.target.value)}
              placeholder="Registre aqui os principais assuntos discutidos na reunião..."
              rows={8}
            />
          </div>

          {/* Ações para Próxima Reunião */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair">
              Ações para Próxima Reunião
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Registre as ações que devem ser tomadas antes da próxima reunião
            </p>

            <div className="space-y-4 mb-4">
              {record.actionItems.map((action) => (
                <div key={action.id} className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-[#3498db]/30">
                  <div className="flex justify-between items-start mb-3">
                    <button
                      onClick={() => toggleActionCompleted(action.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        action.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      <Check size={14} />
                      {action.completed ? 'Concluído' : 'Pendente'}
                    </button>
                    <button
                      onClick={() => removeActionItem(action.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <InputField
                    label="Descrição da Ação"
                    value={action.description}
                    onChange={(e) => updateActionItem(action.id, 'description', e.target.value)}
                    placeholder="Descreva a ação a ser realizada"
                  />
                  <InputField
                    label="Responsável"
                    value={action.responsible || ''}
                    onChange={(e) => updateActionItem(action.id, 'responsible', e.target.value)}
                    placeholder="Nome do responsável"
                  />
                  <InputField
                    label="Observações (opcional)"
                    value={action.notes || ''}
                    onChange={(e) => updateActionItem(action.id, 'notes', e.target.value)}
                    placeholder="Informações adicionais"
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={addActionItem}
              className="w-full bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300"
            >
              <Plus size={18} className="mr-2" />
              Adicionar Ação
            </Button>
          </div>

          {/* Encerramento */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair">
              Encerramento
            </h3>
            <InputField
              label="Oração de Encerramento"
              value={record.closingPrayer}
              onChange={(e) => handleInputChange('closingPrayer', e.target.value)}
              placeholder="Pessoa que fará a oração"
            />
          </div>

          {/* Botão Salvar Final */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSave}
              className="min-w-[280px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center py-6 text-lg"
            >
              <Save size={20} />
              Salvar Ata de Bispado
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message="Por favor, corrija os erros na Ata de Bispado antes de salvar ou baixar."
        theme="blue"
      />
    </div>
  );
}
