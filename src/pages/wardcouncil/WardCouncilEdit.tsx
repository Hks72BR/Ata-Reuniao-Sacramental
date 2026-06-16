/**
 * Página de Edição Colaborativa - Ata de Conselho de Ala
 * Múltiplos usuários podem editar simultaneamente em tempo real
 * Mostra indicadores de presença (quem está digitando e onde)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { ErrorModal } from '@/components/ErrorModal';
import { WardCouncilUserModal } from '@/components/WardCouncilUserModal';
import {
  WardCouncilRecord,
  WardCouncilPresence,
  ActionItem,
  WARD_COUNCIL_ORGANIZATIONS,
} from '@/types';
import { Save, Plus, History, X, Users, ArrowLeft, Wifi, WifiOff, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import {
  subscribeToWardCouncilRecord,
  updateWardCouncilField,
  updateOrganizationField,
  updateEditorPresence,
  removeEditorPresence,
  saveWardCouncilRecordToCloud,
} from '@/lib/wardCouncilFirestore';

// Gerar um ID de sessão único para este navegador/aba
function generateSessionId(): string {
  const existing = sessionStorage.getItem('wardcouncil_session_id');
  if (existing) return existing;
  const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('wardcouncil_session_id', id);
  return id;
}

export default function WardCouncilEdit() {
  const [record, setRecord] = useState<WardCouncilRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userOrg, setUserOrg] = useState('');
  const [sessionId] = useState(generateSessionId);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const { isOnline } = useServiceWorker();
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  // Referências para debounce
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const recordRef = useRef<WardCouncilRecord | null>(null);
  // Track local pending changes to avoid overwriting with stale server data
  const pendingFields = useRef<Set<string>>(new Set());
  const pendingClearTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Extrair ID da URL
  const id = location.split('/wardcouncil/edit/')[1];

  // Cor do usuário baseada na organização
  const userColor = WARD_COUNCIL_ORGANIZATIONS.find(o => o.key === userOrg)?.color || '#6B7280';

  // Verificar se o usuário já se identificou
  useEffect(() => {
    const savedName = sessionStorage.getItem('wardcouncil_user_name');
    const savedOrg = sessionStorage.getItem('wardcouncil_user_org');

    if (savedName && savedOrg) {
      setUserName(savedName);
      setUserOrg(savedOrg);
    } else {
      setShowUserModal(true);
    }
  }, []);

  // Inscrever para atualizações em tempo real quando temos ID e usuário identificado
  useEffect(() => {
    if (!id || !userName) return;

    setLoading(true);
    const unsub = subscribeToWardCouncilRecord(id, (data) => {
      if (data) {
        setRecord(prev => {
          // Merge: keep local pending field values, update everything else
          if (prev && pendingFields.current.size > 0) {
            const merged = { ...data };
            for (const field of pendingFields.current) {
              if (field.startsWith('organizationMatters.')) {
                const orgKey = field.replace('organizationMatters.', '');
                if (prev.organizationMatters && (prev.organizationMatters as any)[orgKey] !== undefined) {
                  (merged.organizationMatters as any)[orgKey] = (prev.organizationMatters as any)[orgKey];
                }
              } else if (field === 'actionItems') {
                merged.actionItems = prev.actionItems;
              } else {
                (merged as any)[field] = (prev as any)[field];
              }
            }
            return merged;
          }
          return data;
        });
        recordRef.current = data;
      } else {
        toast.error('Ata não encontrada');
        setLocation('/wardcouncil/history');
      }
      setLoading(false);
    });

    unsubscribeRef.current = unsub;

    return () => {
      unsub();
      // Remover presença ao sair
      removeEditorPresence(id, sessionId);
    };
  }, [id, userName, sessionId, setLocation]);

  // Atualizar presença periodicamente
  useEffect(() => {
    if (!id || !userName || !userOrg) return;

    const updatePresenceData = () => {
      const presence: WardCouncilPresence = {
        sessionId,
        userName,
        organization: userOrg,
        currentField,
        color: userColor,
        lastUpdate: new Date().toISOString(),
      };
      updateEditorPresence(id, sessionId, presence);
    };

    updatePresenceData();
    const interval = setInterval(updatePresenceData, 15000); // Atualizar a cada 15s

    return () => clearInterval(interval);
  }, [id, userName, userOrg, currentField, sessionId, userColor]);

  // Cleanup ao sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (id) {
        removeEditorPresence(id, sessionId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, sessionId]);

  // Marcar campo como pending e agendar limpeza
  const markFieldPending = useCallback((fieldKey: string) => {
    pendingFields.current.add(fieldKey);
    // Clear pending status after debounce + buffer
    if (pendingClearTimers.current[fieldKey]) {
      clearTimeout(pendingClearTimers.current[fieldKey]);
    }
    pendingClearTimers.current[fieldKey] = setTimeout(() => {
      pendingFields.current.delete(fieldKey);
      delete pendingClearTimers.current[fieldKey];
    }, 2000);
  }, []);

  // Debounced write para Firestore
  const debouncedUpdate = useCallback(
    (fieldPath: string, value: any) => {
      if (!id) return;
      if (debounceTimers.current[fieldPath]) {
        clearTimeout(debounceTimers.current[fieldPath]);
      }
      debounceTimers.current[fieldPath] = setTimeout(() => {
        updateWardCouncilField(id, fieldPath, value, userName);
        delete debounceTimers.current[fieldPath];
      }, 500);
    },
    [id, userName]
  );

  // Debounced write para campo de organização
  const debouncedOrgUpdate = useCallback(
    (orgKey: string, value: string) => {
      if (!id) return;
      const fieldPath = `org_${orgKey}`;
      if (debounceTimers.current[fieldPath]) {
        clearTimeout(debounceTimers.current[fieldPath]);
      }
      debounceTimers.current[fieldPath] = setTimeout(() => {
        updateOrganizationField(id, orgKey, value, userName);
        delete debounceTimers.current[fieldPath];
      }, 500);
    },
    [id, userName]
  );

  const handleInputChange = (field: keyof WardCouncilRecord, value: any) => {
    setRecord((prev) => prev ? { ...prev, [field]: value } : prev);
    markFieldPending(field);
    debouncedUpdate(field, value);
  };

  const handleOrganizationChange = (orgKey: string, value: string) => {
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            organizationMatters: {
              ...prev.organizationMatters,
              [orgKey]: value,
            },
          }
        : prev
    );
    markFieldPending(`organizationMatters.${orgKey}`);
    debouncedOrgUpdate(orgKey, value);
  };

  const handleFieldFocus = (fieldName: string) => {
    setCurrentField(fieldName);
    if (id && userName) {
      const presence: WardCouncilPresence = {
        sessionId,
        userName,
        organization: userOrg,
        currentField: fieldName,
        color: userColor,
        lastUpdate: new Date().toISOString(),
      };
      updateEditorPresence(id, sessionId, presence);
    }
  };

  const handleFieldBlur = () => {
    setCurrentField(null);
  };

  // Action Items
  const addActionItem = () => {
    if (!record || !id) return;
    const newAction: ActionItem = {
      id: Date.now().toString(),
      description: '',
      responsible: '',
      completed: false,
      notes: '',
    };
    const newItems = [...record.actionItems, newAction];
    setRecord((prev) => prev ? { ...prev, actionItems: newItems } : prev);
    markFieldPending('actionItems');
    debouncedUpdate('actionItems', newItems);
  };

  const updateActionItem = (itemId: string, field: keyof ActionItem, value: any) => {
    if (!record || !id) return;
    const newItems = record.actionItems.map((item) =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setRecord((prev) => prev ? { ...prev, actionItems: newItems } : prev);
    markFieldPending('actionItems');
    debouncedUpdate('actionItems', newItems);
  };

  const removeActionItem = (itemId: string) => {
    if (!record || !id) return;
    const newItems = record.actionItems.filter((item) => item.id !== itemId);
    setRecord((prev) => prev ? { ...prev, actionItems: newItems } : prev);
    markFieldPending('actionItems');
    debouncedUpdate('actionItems', newItems);
  };

  const toggleActionCompleted = (itemId: string) => {
    if (!record || !id) return;
    const newItems = record.actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setRecord((prev) => prev ? { ...prev, actionItems: newItems } : prev);
    markFieldPending('actionItems');
    debouncedUpdate('actionItems', newItems);
  };

  // Salvar/Finalizar
  const handleSave = async () => {
    if (!record || !id) return;
    
    if (!record.date || !record.presidedBy || !record.directedBy) {
      setShowErrorModal(true);
      return;
    }

    try {
      const recordToSave: WardCouncilRecord = {
        ...record,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        lastEditedBy: userName,
        lastEditedAt: new Date().toISOString(),
      };
      // Remove activeEditors antes de salvar para não poluir o registro final
      const { activeEditors, ...cleanRecord } = recordToSave;
      await saveWardCouncilRecordToCloud(cleanRecord as WardCouncilRecord);
      
      alert('✅ ATA SALVA COM SUCESSO');
      toast.success('✅ ATA DE CONSELHO SALVA COM SUCESSO!', {
        duration: 4000,
        style: { background: '#10b981', color: 'white', fontSize: '16px', fontWeight: 'bold' },
      });
    } catch (error) {
      console.error('[WardCouncilEdit] Erro ao salvar:', error);
      alert('❌ Erro ao salvar ata');
    }
  };

  const handleUserConfirm = (name: string, org: string) => {
    setUserName(name);
    setUserOrg(org);
    setShowUserModal(false);
    toast.success(`Bem-vindo(a), ${name}!`, { duration: 2000 });
  };

  const handleBack = () => {
    if (id) {
      removeEditorPresence(id, sessionId);
    }
    setLocation('/wardcouncil/history');
  };

  // Helper: Obter editores ativos de outros usuários (excluindo o atual)
  const getOtherEditors = (): WardCouncilPresence[] => {
    if (!record?.activeEditors) return [];
    return Object.values(record.activeEditors).filter(
      (e) => e.sessionId !== sessionId && 
        // Considerar como ativo se atualizou nos últimos 30 segundos
        new Date().getTime() - new Date(e.lastUpdate).getTime() < 30000
    );
  };

  // Helper: Verificar quem está editando um campo específico
  const getFieldEditor = (fieldName: string): WardCouncilPresence | undefined => {
    const others = getOtherEditors();
    return others.find((e) => e.currentField === fieldName);
  };

  // Componente: indicador de presença num campo
  const FieldPresenceIndicator = ({ fieldName }: { fieldName: string }) => {
    const editor = getFieldEditor(fieldName);
    if (!editor) return null;
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white animate-pulse shadow-md"
        style={{ backgroundColor: editor.color }}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        <span>{editor.userName} digitando...</span>
      </div>
    );
  };

  // Componente: borda colorida quando alguém está editando o campo
  const getFieldBorderStyle = (fieldName: string): string => {
    const editor = getFieldEditor(fieldName);
    if (editor) return `ring-2 ring-offset-1`;
    return '';
  };

  const getFieldRingColor = (fieldName: string): React.CSSProperties => {
    const editor = getFieldEditor(fieldName);
    if (editor) return { '--tw-ring-color': editor.color } as React.CSSProperties;
    return {};
  };

  if (loading || !record) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent" />
            <p className="mt-4 text-teal-800 font-['Poppins'] font-semibold">Carregando ata...</p>
          </div>
        </div>
        <WardCouncilUserModal
          isOpen={showUserModal}
          onConfirm={handleUserConfirm}
          onClose={() => setLocation('/wardcouncil/history')}
        />
      </>
    );
  }

  const otherEditors = getOtherEditors();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative w-full bg-gradient-to-br from-[#0f5257] via-[#0d6270] to-[#0a7180] py-12 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)`,
          }} />
        </div>
        <div className="relative z-10 text-center px-4">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border-2 border-amber-400 flex items-center justify-center shadow-xl">
              <Users className="w-10 h-10 text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-playfair tracking-wide drop-shadow-lg">
            Edição Colaborativa
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3" />
          <p className="text-white/90 text-base font-light">Ata de Conselho de Ala</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-6 md:py-10 px-4">
        {/* Barra de Presença - Editores Ativos */}
        <div className="mb-6 p-4 bg-white/90 backdrop-blur-sm border-2 border-teal-600/30 rounded-xl shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {isOnline ? (
                  <span className="flex items-center gap-1"><Wifi size={14} className="text-green-600" /> Conectado</span>
                ) : (
                  <span className="flex items-center gap-1"><WifiOff size={14} className="text-red-600" /> Offline</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Eu */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
                style={{ backgroundColor: userColor }}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
                {userName} (Você)
              </div>
              {/* Outros editores */}
              {otherEditors.map((editor) => (
                <div
                  key={editor.sessionId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md animate-pulse"
                  style={{ backgroundColor: editor.color }}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  {editor.userName}
                  {editor.currentField && (
                    <span className="ml-1 opacity-80">
                      ({getFieldDisplayName(editor.currentField)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {otherEditors.length > 0 && (
            <div className="mt-2 text-xs text-teal-700 text-center font-medium">
              👥 {otherEditors.length + 1} pessoa{otherEditors.length > 0 ? 's' : ''} editando esta ata
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Button
            onClick={handleBack}
            className="flex-1 min-w-[140px] bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Voltar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-w-[140px] bg-white border-2 border-amber-500 text-teal-800 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={() => record?.id && setLocation(`/wardcouncil/view/${record.id}`)}
            className="flex-1 min-w-[140px] bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Eye size={18} />
            Visualizar
          </Button>
          <Button
            onClick={() => setLocation('/wardcouncil/history')}
            className="flex-1 min-w-[140px] bg-white border-2 border-teal-700 text-teal-800 hover:bg-teal-700 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Histórico
          </Button>
        </div>

        {/* Form Sections */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Informações Básicas */}
          <div
            className={`bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-shadow ${getFieldBorderStyle('info')}`}
            style={getFieldRingColor('info')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-teal-800 font-playfair flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Informações da Reunião
              </h3>
              <FieldPresenceIndicator fieldName="info" />
            </div>
            <div className="space-y-4">
              <div onFocus={() => handleFieldFocus('info')} onBlur={handleFieldBlur}>
                <InputField
                  type="date"
                  label="Data da Reunião"
                  value={record.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
              <div onFocus={() => handleFieldFocus('info')} onBlur={handleFieldBlur}>
                <InputField
                  label="Presidida por"
                  value={record.presidedBy}
                  onChange={(e) => handleInputChange('presidedBy', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div onFocus={() => handleFieldFocus('info')} onBlur={handleFieldBlur}>
                <InputField
                  label="Dirigida por"
                  value={record.directedBy}
                  onChange={(e) => handleInputChange('directedBy', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>
          </div>

          {/* Orações */}
          <div
            className={`bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-shadow ${getFieldBorderStyle('prayers')}`}
            style={getFieldRingColor('prayers')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-teal-800 font-playfair flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Orações
              </h3>
              <FieldPresenceIndicator fieldName="prayers" />
            </div>
            <div className="space-y-4">
              <div onFocus={() => handleFieldFocus('prayers')} onBlur={handleFieldBlur}>
                <InputField
                  label="Oração de Abertura"
                  value={record.openingPrayer}
                  onChange={(e) => handleInputChange('openingPrayer', e.target.value)}
                  placeholder="Nome de quem orou"
                />
              </div>
              <div onFocus={() => handleFieldFocus('prayers')} onBlur={handleFieldBlur}>
                <InputField
                  label="Oração de Encerramento"
                  value={record.closingPrayer}
                  onChange={(e) => handleInputChange('closingPrayer', e.target.value)}
                  placeholder="Nome de quem orou"
                />
              </div>
            </div>
          </div>

          {/* Assuntos das Organizações - Cada uma com indicador de presença */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-teal-600 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-teal-800 mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-600 rounded-full" />
              Assuntos das Organizações
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Cada organização pode editar seu próprio bloco simultaneamente.
            </p>
            <div className="space-y-4">
              {WARD_COUNCIL_ORGANIZATIONS.filter(o => 
                !['bispado', 'secretario'].includes(o.key)
              ).map((org) => {
                const orgKey = org.key as keyof typeof record.organizationMatters;
                const fieldName = `org_${org.key}`;
                const editor = getFieldEditor(fieldName);
                return (
                  <div
                    key={org.key}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      editor ? 'shadow-md' : 'border-gray-200'
                    }`}
                    style={editor ? {
                      borderColor: editor.color,
                      boxShadow: `0 0 0 1px ${editor.color}20, 0 4px 12px ${editor.color}15`,
                    } : {}}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: org.color }} />
                        <span className="font-semibold text-teal-800">{org.label}</span>
                      </div>
                      <FieldPresenceIndicator fieldName={fieldName} />
                    </div>
                    <div onFocus={() => handleFieldFocus(fieldName)} onBlur={handleFieldBlur}>
                      <TextAreaField
                        label=""
                        value={record.organizationMatters[orgKey] || ''}
                        onChange={(e) => handleOrganizationChange(org.key, e.target.value)}
                        placeholder={`Assuntos da organização ${org.label.replace(/^[^\s]+\s/, '')}...`}
                        rows={3}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itens de Ação */}
          <div
            className={`bg-white/90 backdrop-blur-sm p-6 rounded-xl border-l-4 border-teal-600 shadow-lg hover:shadow-xl transition-shadow ${getFieldBorderStyle('actions')}`}
            style={getFieldRingColor('actions')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-teal-800 font-playfair flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-600 rounded-full" />
                Itens de Ação ({record.actionItems.length})
              </h3>
              <div className="flex items-center gap-2">
                <FieldPresenceIndicator fieldName="actions" />
                <Button
                  onClick={addActionItem}
                  size="sm"
                  className="bg-white border-2 border-teal-600 text-teal-800 hover:bg-teal-600 hover:text-white transition-all"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
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
                      <div className="flex-1 space-y-3" onFocus={() => handleFieldFocus('actions')} onBlur={handleFieldBlur}>
                        <InputField
                          label="Descrição"
                          value={item.description}
                          onChange={(e) => updateActionItem(item.id, 'description', e.target.value)}
                          placeholder="O que precisa ser feito?"
                        />
                        <InputField
                          label="Responsável"
                          value={item.responsible || ''}
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

          {/* Botão Salvar */}
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

      {/* Modais */}
      {showErrorModal && (
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          message="Preencha os campos obrigatórios: Data, Presidida por e Dirigida por."
          theme="teal"
        />
      )}

      <WardCouncilUserModal
        isOpen={showUserModal}
        onConfirm={handleUserConfirm}
        onClose={() => setLocation('/wardcouncil/history')}
      />
    </div>
  );
}

/**
 * Helper: Nome legível de um campo para exibição na barra de presença
 */
function getFieldDisplayName(fieldName: string): string {
  const names: { [key: string]: string } = {
    info: 'Informações',
    prayers: 'Orações',
    actions: 'Itens de Ação',
    org_rapazes: 'Rapazes',
    org_mocas: 'Moças',
    org_socorro: 'Socorro',
    org_elderes: 'Élderes',
    org_missionaria: 'Missionária',
    org_primaria: 'Primária',
    org_escolaDominical: 'Escola Dom.',
    org_temploHistoriaFamilia: 'Templo/HF',
  };
  return names[fieldName] || fieldName;
}
