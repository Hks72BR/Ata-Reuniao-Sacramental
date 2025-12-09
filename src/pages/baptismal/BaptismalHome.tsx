/**
 * Página Principal - Formulário de Ata Batismal
 * Cores: Azul Água (#1e8b9f) + Verde Água (#16a085) + Branco
 * Representa as águas do batismo do Rio Jordão
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { BaptismalRecord, WelcomeOrganizationItem, BAPTISMAL_RECORD_INITIAL } from '@/types';
import { Download, Save, Plus, History, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { isAuthenticated, logout, AUTH_CONFIG } from '@/lib/auth';

export default function BaptismalHome() {
  const [record, setRecord] = useState<BaptismalRecord>(BAPTISMAL_RECORD_INITIAL as BaptismalRecord);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { isOnline, swReady } = useServiceWorker();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.BAPTISMAL_SESSION_KEY)) {
      setLocation('/');
      return;
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

  const handleWitnessChange = (index: number, value: string) => {
    const newWitnesses = [...record.witnesses];
    newWitnesses[index] = value;
    setRecord((prev) => ({ ...prev, witnesses: newWitnesses }));
  };

  const addWelcomeOrganization = () => {
    const newOrg: WelcomeOrganizationItem = {
      id: Date.now().toString(),
      organizationName: '',
      welcomeGivenBy: '',
      notes: '',
    };
    setRecord((prev) => ({
      ...prev,
      welcomeOrganizations: [...prev.welcomeOrganizations, newOrg],
    }));
  };

  const updateWelcomeOrganization = (id: string, field: keyof WelcomeOrganizationItem, value: string) => {
    setRecord((prev) => ({
      ...prev,
      welcomeOrganizations: prev.welcomeOrganizations.map((org) =>
        org.id === id ? { ...org, [field]: value } : org
      ),
    }));
  };

  const removeWelcomeOrganization = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      welcomeOrganizations: prev.welcomeOrganizations.filter((org) => org.id !== id),
    }));
  };

  const handleSave = () => {
    toast.info('Funcionalidade de salvar em desenvolvimento');
  };

  const handleDownload = () => {
    toast.info('Funcionalidade de download em desenvolvimento');
  };

  const getBaptismInstructionText = () => {
    const location = record.baptismLocation === 'baptism-room' 
      ? ', deveremos seguir para a sala do batismo' 
      : '';
    return `Agora passaremos para a parte Batismal onde será feito a ordenança do irmão(ã) ${record.personBeingBaptized || '[Nome]'}${location}.`;
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
            
            {/* Instrução gerada automaticamente */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-[#16a085]/30">
              <p className="text-sm font-semibold text-gray-600 mb-2">Instrução para o dirigente:</p>
              <p className="text-base text-[#1e8b9f] leading-relaxed italic">
                "{getBaptismInstructionText()}"
              </p>
            </div>

            <div className="mb-4">
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

            <InputField
              label="Nome da Pessoa Sendo Batizada"
              value={record.personBeingBaptized}
              onChange={(e) => handleInputChange('personBeingBaptized', e.target.value)}
              placeholder="Nome completo"
              required
            />

            <InputField
              label="Quem Realiza a Ordenança do Batismo"
              value={record.personPerformingBaptism}
              onChange={(e) => handleInputChange('personPerformingBaptism', e.target.value)}
              placeholder="Nome completo de quem batiza"
              required
            />

            {/* Chamado às águas */}
            <div className="my-6 p-4 bg-white rounded-lg border border-[#16a085]/30">
              <p className="text-sm font-semibold text-gray-600 mb-2">Chamado às águas:</p>
              <p className="text-base text-[#1e8b9f] leading-relaxed">
                "Chamamos às águas do batismo <span className="font-semibold">{record.personPerformingBaptism || '[nome de quem batiza]'}</span>. 
                Chamamos às águas do batismo <span className="font-semibold">{record.personBeingBaptized || '[nome da pessoa sendo batizada]'}</span>."
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Testemunhas do Batismo</label>
              {record.witnesses.map((witness, index) => (
                <InputField
                  key={index}
                  label={`Testemunha ${index + 1}`}
                  value={witness}
                  onChange={(e) => handleWitnessChange(index, e.target.value)}
                  placeholder="Nome completo da testemunha"
                />
              ))}
              <Button
                type="button"
                onClick={() => setRecord(prev => ({ ...prev, witnesses: [...prev.witnesses, ''] }))}
                className="w-full mt-2 bg-[#16a085] hover:bg-[#149174] text-white"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Testemunha
              </Button>
            </div>

            {/* Instrução pós-batismo */}
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold">Após a ordenança ser realizada:</span> Recomendamos que assistam vídeos da Bíblia para manter a reverência, cantem hinos ou compartilhem seus testemunhos. 
                <span className="italic"> (aguardamos até o irmão(ã) que foi batizado(a) voltar)</span>
              </p>
            </div>
          </div>

          {/* Boas Vindas das Organizações */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#16a085] shadow-md">
            <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 font-playfair">
              Boas Vindas das Organizações
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ex: Se for uma moça, a presidência das moças dá as boas vindas
            </p>

            <div className="space-y-4 mb-4">
              {record.welcomeOrganizations.map((org) => (
                <div key={org.id} className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border border-[#16a085]/30">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => removeWelcomeOrganization(org.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <InputField
                    label="Organização"
                    value={org.organizationName}
                    onChange={(e) => updateWelcomeOrganization(org.id, 'organizationName', e.target.value)}
                    placeholder="Ex: Presidência das Moças"
                  />
                  <InputField
                    label="Boas Vindas Dada Por"
                    value={org.welcomeGivenBy}
                    onChange={(e) => updateWelcomeOrganization(org.id, 'welcomeGivenBy', e.target.value)}
                    placeholder="Nome de quem deu as boas vindas"
                  />
                  <InputField
                    label="Observações (opcional)"
                    value={org.notes || ''}
                    onChange={(e) => updateWelcomeOrganization(org.id, 'notes', e.target.value)}
                    placeholder="Informações adicionais"
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={addWelcomeOrganization}
              className="w-full bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300"
            >
              <Plus size={18} className="mr-2" />
              Adicionar Boas Vindas
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
        </div>
      </div>
    </div>
  );
}
