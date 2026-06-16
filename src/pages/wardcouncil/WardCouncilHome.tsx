/**
 * Página Principal - Formulário de Ata de Conselho de Ala
 * Design: Minimalismo Espiritual Contemporâneo
 * Tipografia: Playfair Display (títulos) + Poppins (corpo)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { ErrorModal } from '@/components/ErrorModal';
import { WardCouncilWelcomeModal } from '@/components/WardCouncilWelcomeModal';
import { WardCouncilAdminPinModal } from '@/components/WardCouncilAdminPinModal';
import { WardCouncilRecord, ActionItem, WARD_COUNCIL_RECORD_INITIAL } from '@/types';
import { Download, Save, Plus, History, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { isAuthenticated, logout, AUTH_CONFIG } from '@/lib/auth';
import { saveWardCouncilRecordToCloud, createBlankWardCouncilRecord } from '@/lib/wardCouncilFirestore';

export default function WardCouncilHome() {
  const [record, setRecord] = useState<WardCouncilRecord>(WARD_COUNCIL_RECORD_INITIAL as WardCouncilRecord);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const { isOnline, swReady } = useServiceWorker();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY)) {
      setLocation('/');
      return;
    }
// Verificar se é a primeira vez que o usuário acessa
    const hasSeenWelcome = localStorage.getItem('wardcouncil_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }

    
    const savedRecord = localStorage.getItem('wardCouncilRecord');
    if (savedRecord) {
      try {
        const parsed = JSON.parse(savedRecord);
        setRecord(parsed);
        toast.success('Ata carregada para edição', { duration: 2000, className: 'toast-success-wardcouncil' });
      } catch (error) {
        console.error('Erro ao carregar ata salva:', error);
      }
    }
  }, [setLocation]);

  const handleInputChange = (field: keyof WardCouncilRecord, value: any) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleOrganizationChange = (org: keyof typeof record.organizationMatters, value: string) => {
    setRecord((prev) => ({
      ...prev,
      organizationMatters: {
        ...prev.organizationMatters,
        [org]: value,
      },
    }));
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
    console.log('[WardCouncilHome] handleSave iniciado');
    console.log('[WardCouncilHome] Erros:', errors);
    console.log('[WardCouncilHome] Record:', record);
    
    try {
      if (Object.keys(errors).length > 0) {
        console.log('[WardCouncilHome] Mostrando modal de erro - há erros');
        setShowErrorModal(true);
        return;
      }
      
      if (!record.date || !record.presidedBy || !record.directedBy) {
        console.log('[WardCouncilHome] Mostrando modal de erro - campos obrigatórios vazios');
        setShowErrorModal(true);
        return;
      }

      console.log('[WardCouncilHome] Validação passou, salvando...');

      const recordToSave: WardCouncilRecord = {
        ...record,
        status: 'completed',
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[WardCouncilHome] Chamando saveWardCouncilRecordToCloud...');
      const savedId = await saveWardCouncilRecordToCloud(recordToSave);
      console.log('[WardCouncilHome] Salvo com sucesso! ID:', savedId);
      
      // Mostrar mensagem de sucesso
      alert('✅ ATA SALVA COM SUCESSO');
      
      toast.success('✅ ATA DE CONSELHO SALVA COM SUCESSO!', {
        duration: 4000,
        className: 'toast-success-wardcouncil',
        style: {
          background: '#10b981',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });

      if (!record.id || !record.id.startsWith('ata-')) {
        setRecord({ ...recordToSave, id: savedId });
      }

      localStorage.removeItem('wardCouncilRecord');
    } catch (error) {
      console.error('[WardCouncilHome] Erro ao salvar:', error);
      alert('❌ Erro ao salvar ata');
      toast.error('❌ Erro ao salvar ata');
    }
  };

  const handleDownload = () => {
    toast.info('Funcionalidade de download em desenvolvimento');
  };

  const handleNewRecord = () => {
    setShowAdminPinModal(true);
  };

  const handleAdminPinSuccess = async () => {
    setShowAdminPinModal(false);
    try {
      toast.info('Criando nova ata...');
      const newId = await createBlankWardCouncilRecord();
      toast.success('✅ Nova ata criada!');
      setLocation(`/wardcouncil/edit/${newId}`);
    } catch (error) {
      toast.error('❌ Erro ao criar ata');
      console.error(error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      logout(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative w-full bg-gradient-to-br from-[#0f5257] via-[#0d6270] to-[#0a7180] py-16 shadow-2xl">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4">
          {/* Church emblem/icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-amber-400 flex items-center justify-center shadow-xl">
              <Users className="w-12 h-12 text-amber-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-playfair tracking-wide drop-shadow-lg">
            Ata de Conselho de Ala
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4"></div>
          <p className="text-white/95 text-lg md:text-xl font-light tracking-wide">
            A Igreja de Jesus Cristo dos Santos dos Últimos Dias
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-8 md:py-12 px-4">
        {/* Status Bar */}
        <div className="mb-6 p-4 bg-white/80 backdrop-blur-sm border-2 border-teal-600/30 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {swReady && (
              <span className="text-xs text-muted-foreground">✓ Pronto para offline</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            onClick={handleLogout}
            className="flex-1 min-w-[180px] bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Menu
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-w-[180px] bg-white border-2 border-amber-500 text-teal-800 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 min-w-[180px] bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Download size={18} />
            Baixar
          </Button>
          <Button
            onClick={() => setLocation('/wardcouncil/history')}
            className="flex-1 min-w-[180px] bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Histórico
          </Button>
          <Button
            onClick={handleNewRecord}
            className="flex-1 min-w-[180px] bg-white border-2 border-amber-500 text-teal-800 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Nova Ata
          </Button>
        </div>

        {/* Form Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-teal-800 mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Informações da Reunião
            </h3>
            <div className="space-y-4">
              <InputField
                type="date"
                label="Data da Reunião"
                value={record.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                error={errors.date}
              />
              <InputField
                label="Presidida por"
                value={record.presidedBy}
                onChange={(e) => handleInputChange('presidedBy', e.target.value)}
                placeholder="Nome completo"
                required
                error={errors.presidedBy}
              />
              <InputField
                label="Dirigida por"
                value={record.directedBy}
                onChange={(e) => handleInputChange('directedBy', e.target.value)}
                placeholder="Nome completo"
                required
                error={errors.directedBy}
              />
            </div>
          </div>

          {/* Orações */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-teal-800 mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Orações
            </h3>
            <div className="space-y-4">
              <InputField
                label="Oração de Abertura"
                value={record.openingPrayer}
                onChange={(e) => handleInputChange('openingPrayer', e.target.value)}
                placeholder="Nome de quem orou"
              />
              <InputField
                label="Oração de Encerramento"
                value={record.closingPrayer}
                onChange={(e) => handleInputChange('closingPrayer', e.target.value)}
                placeholder="Nome de quem orou"
              />
            </div>
          </div>

          {/* Assuntos das Organizações */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-teal-600 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-teal-800 mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
              Assuntos das Organizações
            </h3>
            <div className="space-y-4">
              <TextAreaField
                label="👔 Rapazes"
                value={record.organizationMatters.rapazes}
                onChange={(e) => handleOrganizationChange('rapazes', e.target.value)}
                placeholder="Assuntos tratados pela organização dos Rapazes..."
                rows={3}
              />
              <TextAreaField
                label="🌸 Moças"
                value={record.organizationMatters.mocas}
                onChange={(e) => handleOrganizationChange('mocas', e.target.value)}
                placeholder="Assuntos tratados pela organização das Moças..."
                rows={3}
              />
              <TextAreaField
                label="💐 Sociedade de Socorro"
                value={record.organizationMatters.socorro}
                onChange={(e) => handleOrganizationChange('socorro', e.target.value)}
                placeholder="Assuntos tratados pela Sociedade de Socorro..."
                rows={3}
              />
              <TextAreaField
                label="📖 Quórum de Élderes"
                value={record.organizationMatters.elderes}
                onChange={(e) => handleOrganizationChange('elderes', e.target.value)}
                placeholder="Assuntos tratados pelo Quórum de Élderes..."
                rows={3}
              />
              <TextAreaField
                label="🌍 Obra Missionária"
                value={record.organizationMatters.missionaria}
                onChange={(e) => handleOrganizationChange('missionaria', e.target.value)}
                placeholder="Assuntos relacionados à Obra Missionária..."
                rows={3}
              />
              <TextAreaField
                label="🎨 Primária"
                value={record.organizationMatters.primaria}
                onChange={(e) => handleOrganizationChange('primaria', e.target.value)}
                placeholder="Assuntos tratados pela Primária..."
                rows={3}
              />
              <TextAreaField
                label="📚 Escola Dominical"
                value={record.organizationMatters.escolaDominical}
                onChange={(e) => handleOrganizationChange('escolaDominical', e.target.value)}
                placeholder="Assuntos tratados pela Escola Dominical..."
                rows={3}
              />
              <TextAreaField
                label="⛪ Templo e História da Família"
                value={record.organizationMatters.temploHistoriaFamilia}
                onChange={(e) => handleOrganizationChange('temploHistoriaFamilia', e.target.value)}
                placeholder="Assuntos relacionados ao Templo e História da Família..."
                rows={3}
              />
            </div>
          </div>

          {/* Itens de Ação */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-teal-600 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-teal-800 font-playfair flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                Itens de Ação ({record.actionItems.length})
              </h3>
              <Button
                onClick={addActionItem}
                size="sm"
                className="bg-white border-2 border-teal-600 text-teal-800 hover:bg-teal-600 hover:text-white transition-all"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-4">
              {record.actionItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhum item de ação adicionado.</p>
                  <p className="text-xs mt-1">Clique em "Adicionar" para criar um item.</p>
                </div>
              ) : (
                record.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      item.completed 
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-md' 
                        : 'bg-white/60 border-teal-200 hover:border-teal-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <InputField
                          label="Descrição"
                          value={item.description}
                          onChange={(e) => updateActionItem(item.id, 'description', e.target.value)}
                          placeholder="O que precisa ser feito?"
                        />
                        
                        <InputField
                          label="Responsável"
                          value={item.responsible}
                          onChange={(e) => updateActionItem(item.id, 'responsible', e.target.value)}
                          placeholder="Quem vai fazer?"
                        />
                        
                        <TextAreaField
                          label="Observações"
                          value={item.notes || ''}
                          onChange={(e) => updateActionItem(item.id, 'notes', e.target.value)}
                          placeholder="Notas adicionais..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => toggleActionCompleted(item.id)}
                          className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all font-bold text-sm ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-md'
                              : 'bg-white border-teal-400 text-teal-600 hover:border-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={item.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
                        >
                          {item.completed ? '✓' : '○'}
                        </button>
                        
                        <button
                          onClick={() => removeActionItem(item.id)}
                          className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botão Salvar no Final */}
          <div className="mt-12 flex justify-center">
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 rounded-xl"
            >
              <Save size={28} />
              Salvar Ata
            </Button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message="OS ERROS DEVEM SER CORRIGIDOS"
          theme="teal"
        />
      )}

      {/* Welcome Modal */}
      <WardCouncilWelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />

      {/* Admin PIN Modal - Nova Ata */}
      <WardCouncilAdminPinModal
        isOpen={showAdminPinModal}
        onClose={() => setShowAdminPinModal(false)}
        onSuccess={handleAdminPinSuccess}
        action="create"
      />
    </div>
  );
}
