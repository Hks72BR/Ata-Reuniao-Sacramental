/**
 * Página Principal - Formulário de Ata Batismal
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { ErrorModal } from '@/components/ErrorModal';
import { BaptismalRecord, OrdinanceItem, BaptismItem, BAPTISMAL_RECORD_INITIAL } from '@/types';
import { Download, Save, Plus, History, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { isAuthenticated, logout, AUTH_CONFIG } from '@/lib/auth';
import { saveBaptismalRecordToCloud } from '@/lib/baptismalFirestore';

export default function BaptismalHome() {
  const [record, setRecord] = useState<BaptismalRecord>(BAPTISMAL_RECORD_INITIAL as BaptismalRecord);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { isOnline, swReady } = useServiceWorker();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.BAPTISMAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }

    // Carregar ata salva em localStorage (se existir) para edição
    const savedRecord = localStorage.getItem('baptismalRecord');
    if (savedRecord) {
      try {
        const parsed = JSON.parse(savedRecord);
        
        // Migração automática de formato antigo para novo
        if (parsed.personBeingBaptized || parsed.personPerformingBaptism) {
          // Formato antigo detectado - converter para novo formato
          const migratedRecord = {
            ...parsed,
            baptisms: [{
              id: Date.now().toString(),
              personBeingBaptized: parsed.personBeingBaptized || '',
              personPerformingBaptism: parsed.personPerformingBaptism || '',
              witnesses: parsed.witnesses || ['', ''],
            }],
          };
          // Remover campos antigos
          delete migratedRecord.personBeingBaptized;
          delete migratedRecord.personPerformingBaptism;
          delete migratedRecord.witnesses;
          
          setRecord(migratedRecord);
          toast.success('Ata carregada e atualizada para o novo formato', { duration: 2000, className: 'toast-success-baptismal' });
        } else {
          setRecord(parsed);
          toast.success('Ata carregada para edição', { duration: 2000, className: 'toast-success-baptismal' });
        }
      } catch (error) {
        console.error('Erro ao carregar ata salva:', error);
      }
    }
  }, [setLocation]);

  const handleInputChange = (field: keyof BaptismalRecord, value: any) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBaptismsChange = (items: BaptismItem[]) => {
    setRecord((prev) => ({
      ...prev,
      baptisms: items,
    }));
  };

  const handleBaptismFieldChange = (baptismId: string, field: keyof BaptismItem, value: any) => {
    const updatedBaptisms = record.baptisms?.map((baptism) =>
      baptism.id === baptismId ? { ...baptism, [field]: value } : baptism
    );
    handleBaptismsChange(updatedBaptisms || []);
  };

  const handleWitnessChange = (baptismId: string, index: number, value: string) => {
    const updatedBaptisms = record.baptisms?.map((baptism) => {
      if (baptism.id === baptismId) {
        const newWitnesses = [...baptism.witnesses];
        newWitnesses[index] = value;
        return { ...baptism, witnesses: newWitnesses };
      }
      return baptism;
    });
    handleBaptismsChange(updatedBaptisms || []);
  };

  const handleOrdinancesChange = (items: OrdinanceItem[]) => {
    setRecord((prev) => ({
      ...prev,
      ordinances: items,
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
      if (!record.baptisms || record.baptisms.length === 0) {
        toast.error('Adicione pelo menos um batismo');
        return;
      }

      // Validar cada batismo
      for (const baptism of record.baptisms) {
        if (!baptism.personBeingBaptized) {
          toast.error('Nome da pessoa batizada é obrigatório em todos os batismos');
          return;
        }
        if (!baptism.personPerformingBaptism) {
          toast.error('Quem realiza o batismo é obrigatório em todos os batismos');
          return;
        }
      }

      // Preparar record com status e timestamps
      const recordToSave: BaptismalRecord = {
        ...record,
        status: 'completed',
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Salvar no Firebase
      const savedId = await saveBaptismalRecordToCloud(recordToSave);
      
      toast.success('✅ ATA BATISMAL SALVA COM SUCESSO!', {
        duration: 4000,
        className: 'toast-success-baptismal',
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
      localStorage.removeItem('baptismalRecord');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar ata batismal');
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
    if (confirm('Deseja criar uma nova ata batismal? Os dados atuais serão perdidos se não forem salvos.')) {
      setRecord(BAPTISMAL_RECORD_INITIAL as BaptismalRecord);
      setErrors({});
      localStorage.removeItem('baptismalRecord');
      toast.success('Nova ata batismal criada', { className: 'toast-success-baptismal' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50">
      {/* Hero Section com tema de águas batismais */}
      <div className="relative w-full bg-gradient-to-br from-[#1a7a8a] via-[#1e8b9f] to-[#16a085] py-16 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(22, 160, 133, 0.4) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-[#16a085] flex items-center justify-center shadow-xl">
              <span className="text-5xl">💧</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 font-['Playfair_Display']">
            Ata Batismal
          </h1>
          <p className="text-xl text-white/90 font-['Poppins']">
            Serviço de Batismo
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
              logout(AUTH_CONFIG.BAPTISMAL_SESSION_KEY);
              setLocation('/');
            }}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Voltar ao Menu
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Download size={18} />
            Baixar
          </Button>
          <Button
            onClick={() => setLocation('/baptismal/history')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Histórico
          </Button>
          <Button
            onClick={handleNewRecord}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Nova Ata
          </Button>
        </div>

        {/* Form Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Data */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#16a085] rounded-full"></span>
              Data
            </h3>
            <InputField
              type="date"
              label="Data do Serviço Batismal"
              value={record.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              error={errors.date}
            />
          </div>

          {/* Presidência e Direção */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair">
              Presidência e Direção
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Presidida por"
                value={record.presidedBy}
                onChange={(e) => handleInputChange('presidedBy', e.target.value)}
                placeholder="Nome completo"
                required
              />
              <InputField
                label="Dirigida por"
                value={record.directedBy}
                onChange={(e) => handleInputChange('directedBy', e.target.value)}
                placeholder="Nome completo"
                required
              />
              <InputField
                label="Pianista"
                value={record.pianist}
                onChange={(e) => handleInputChange('pianist', e.target.value)}
                placeholder="Nome do pianista"
              />
              <InputField
                label="Regente"
                value={record.conductor}
                onChange={(e) => handleInputChange('conductor', e.target.value)}
                placeholder="Nome do regente"
              />
            </div>
          </div>

          {/* Abertura */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair">
              Abertura
            </h3>
            <InputField
              label="Hino de Abertura"
              value={record.openingHymn}
              onChange={(e) => handleInputChange('openingHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
            <InputField
              label="Oração de Abertura"
              value={record.openingPrayer}
              onChange={(e) => handleInputChange('openingPrayer', e.target.value)}
              placeholder="Pessoa que fará a oração"
            />
          </div>

          {/* Programa */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair">
              Programa
            </h3>
            <TextAreaField
              label="Testemunho"
              value={record.testimony}
              onChange={(e) => handleInputChange('testimony', e.target.value)}
              placeholder="Registro do testemunho compartilhado..."
              rows={4}
            />
            <TextAreaField
              label="Mensagem"
              value={record.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Resumo da mensagem compartilhada..."
              rows={4}
            />
            <TextAreaField
              label="Apresentação Especial (opcional)"
              value={record.specialPresentation || ''}
              onChange={(e) => handleInputChange('specialPresentation', e.target.value)}
              placeholder="Descrição da apresentação especial, se houver..."
              rows={3}
            />
          </div>

          {/* Parte Batismal */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-6 rounded-xl border-2 border-[#1e8b9f] shadow-lg">
            <h3 className="text-2xl font-bold text-[#1e8b9f] mb-4 font-playfair flex items-center gap-2">
              <span className="text-3xl">💧</span>
              Parte Batismal
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local do Batismo
              </label>
              <select
                value={record.baptismLocation}
                onChange={(e) => handleInputChange('baptismLocation', e.target.value as 'same-room' | 'baptism-room')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e8b9f] focus:border-transparent"
              >
                <option value="same-room">Mesmo local (Sacramental)</option>
                <option value="baptism-room">Sala do Batismo</option>
              </select>
            </div>

            {/* Lista de Batismos */}
            <div className="space-y-6 mb-6">
              {record.baptisms?.map((baptism, baptismIndex) => (
                <div
                  key={baptism.id}
                  className="p-5 bg-white rounded-xl border-2 border-[#16a085]/40 shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#16a085] text-white text-sm font-semibold rounded-full">
                        Batismo {baptismIndex + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const updatedBaptisms = record.baptisms?.filter((b) => b.id !== baptism.id);
                        handleBaptismsChange(updatedBaptisms || []);
                      }}
                      className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      title="Remover batismo"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <InputField
                      label="Nome da Pessoa Sendo Batizada"
                      value={baptism.personBeingBaptized}
                      onChange={(e) => handleBaptismFieldChange(baptism.id, 'personBeingBaptized', e.target.value)}
                      placeholder="Nome completo"
                      required
                    />

                    <InputField
                      label="Quem Realiza a Ordenança do Batismo"
                      value={baptism.personPerformingBaptism}
                      onChange={(e) => handleBaptismFieldChange(baptism.id, 'personPerformingBaptism', e.target.value)}
                      placeholder="Nome completo de quem batiza"
                      required
                    />

                    {/* Chamado às águas específico deste batismo */}
                    <div className="my-4 p-4 bg-cyan-50 rounded-lg border border-[#16a085]/30">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Chamado às águas:</p>
                      <p className="text-base text-[#1e8b9f] leading-relaxed">
                        "Chamamos às águas do batismo <span className="font-semibold">{baptism.personPerformingBaptism || '[nome de quem batiza]'}</span>. 
                        Chamamos às águas do batismo <span className="font-semibold">{baptism.personBeingBaptized || '[nome da pessoa sendo batizada]'}</span>."
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Testemunhas do Batismo</label>
                      {baptism.witnesses.map((witness, witnessIndex) => (
                        <div key={witnessIndex} className="flex gap-2">
                          <InputField
                            label={`Testemunha ${witnessIndex + 1}`}
                            value={witness}
                            onChange={(e) => handleWitnessChange(baptism.id, witnessIndex, e.target.value)}
                            placeholder="Nome completo da testemunha"
                          />
                          {baptism.witnesses.length > 2 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const updatedBaptisms = record.baptisms?.map((b) => {
                                  if (b.id === baptism.id) {
                                    const newWitnesses = b.witnesses.filter((_, i) => i !== witnessIndex);
                                    return { ...b, witnesses: newWitnesses };
                                  }
                                  return b;
                                });
                                handleBaptismsChange(updatedBaptisms || []);
                              }}
                              className="mt-6 p-2 h-10 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                              title="Remover testemunha"
                            >
                              <X size={16} />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => {
                          const updatedBaptisms = record.baptisms?.map((b) =>
                            b.id === baptism.id ? { ...b, witnesses: [...b.witnesses, ''] } : b
                          );
                          handleBaptismsChange(updatedBaptisms || []);
                        }}
                        className="w-full mt-2 bg-[#16a085] hover:bg-[#149174] text-white"
                      >
                        <Plus size={16} className="mr-2" />
                        Adicionar Testemunha
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {(!record.baptisms || record.baptisms.length === 0) && (
                <div className="text-center py-6 text-gray-500 text-sm bg-white rounded-lg border-2 border-dashed border-gray-300">
                  Nenhum batismo adicionado ainda
                </div>
              )}
            </div>

            {/* Botão para adicionar novo batismo */}
            <Button
              type="button"
              onClick={() => {
                const newBaptism: BaptismItem = {
                  id: Date.now().toString(),
                  personBeingBaptized: '',
                  personPerformingBaptism: '',
                  witnesses: ['', ''],
                };
                handleBaptismsChange([...(record.baptisms || []), newBaptism]);
              }}
              className="w-full bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center py-4"
            >
              <Plus size={20} />
              Adicionar Batismo
            </Button>

            {/* Instrução pós-batismo */}
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold">Após a ordenança ser realizada:</span> Recomendamos que assistam vídeos da Bíblia para manter a reverência, cantem hinos ou compartilhem seus testemunhos. 
                <span className="italic"> (aguardamos até o(s) irmão(s/ãs) que foi(ram) batizado(a)(s) voltar(em))</span>
              </p>
            </div>
          </div>

          {/* Ordenanças - Confirmação de Batismo */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair">
              Confirmação de Batismo
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Registre as confirmações realizadas após o batismo
            </p>

            <div className="space-y-4 mb-6">
              {record.ordinances.map((ordinance) => (
                <div
                  key={ordinance.id}
                  className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border-2 border-[#16a085]/30"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#16a085] text-white text-xs font-semibold rounded-full">
                        Confirmação de Batismo
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const updatedOrdinances = record.ordinances.filter((o) => o.id !== ordinance.id);
                        handleOrdinancesChange(updatedOrdinances);
                      }}
                      className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      title="Remover confirmação"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <InputField
                      label="Nome do Confirmado"
                      value={ordinance.fullName}
                      onChange={(e) => {
                        const updatedOrdinances = record.ordinances.map((o) =>
                          o.id === ordinance.id ? { ...o, fullName: e.target.value } : o
                        );
                        handleOrdinancesChange(updatedOrdinances);
                      }}
                      placeholder="Nome completo"
                      error={errors?.[`ordinance-${ordinance.id}-fullName`]}
                    />
                    
                    <InputField
                      label="Quem Realizou a Confirmação"
                      value={ordinance.performedBy || ''}
                      onChange={(e) => {
                        const updatedOrdinances = record.ordinances.map((o) =>
                          o.id === ordinance.id ? { ...o, performedBy: e.target.value } : o
                        );
                        handleOrdinancesChange(updatedOrdinances);
                      }}
                      placeholder="Nome de quem realizou a confirmação"
                    />

                    <InputField
                      label="Observações (opcional)"
                      value={ordinance.notes || ''}
                      onChange={(e) => {
                        const updatedOrdinances = record.ordinances.map((o) =>
                          o.id === ordinance.id ? { ...o, notes: e.target.value } : o
                        );
                        handleOrdinancesChange(updatedOrdinances);
                      }}
                      placeholder="Informações adicionais"
                    />
                  </div>
                </div>
              ))}

              {record.ordinances.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Nenhuma confirmação registrada neste serviço
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => {
                const newOrdinance: OrdinanceItem = {
                  id: Date.now().toString(),
                  type: 'confirmation',
                  fullName: '',
                  performedBy: '',
                  notes: '',
                };
                handleOrdinancesChange([...record.ordinances, newOrdinance]);
              }}
              className="w-full bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
            >
              <Plus size={18} />
              Adicionar Confirmação
            </Button>
          </div>

          {/* Encerramento */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair">
              Encerramento
            </h3>
            <InputField
              label="Hino de Encerramento"
              value={record.closingHymn}
              onChange={(e) => handleInputChange('closingHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
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
              className="min-w-[280px] bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center py-6 text-lg"
            >
              <Save size={20} />
              Salvar Ata Batismal
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message="Por favor, corrija os erros na Ata Batismal antes de salvar ou baixar."
        theme="baptismal"
      />
    </div>
  );
}
