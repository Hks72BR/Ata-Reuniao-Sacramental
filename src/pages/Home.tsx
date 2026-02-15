/**
 * Página Principal - Formulário de Ata Sacramental
 * Design: Minimalismo Espiritual Contemporâneo
 * Tipografia: Playfair Display (títulos) + Poppins (corpo)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { SupportAndReleaseSection } from '@/components/SupportAndReleaseSection';
import { OrdinancesSection } from '@/components/OrdinancesSection';
import { CallingDesignationsSection } from '@/components/CallingDesignationsSection';
import { ErrorModal } from '@/components/ErrorModal';
import { UserIdentificationModal } from '@/components/UserIdentificationModal';
import { SacramentalRecord, SupportAndReleaseItem, OrdinanceItem, CallingDesignationItem, SACRAMENTAL_RECORD_INITIAL } from '@/types';
import { Download, Save, Plus, History, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { saveRecord, initDB } from '@/lib/db';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { validateRecord, generateRecordText, downloadTextFile, isFirstSunday } from '@/lib/utils';
import { isAuthenticated, logout, AUTH_CONFIG } from '@/lib/auth';

export default function Home() {
  const [record, setRecord] = useState<SacramentalRecord>(SACRAMENTAL_RECORD_INITIAL as SacramentalRecord);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [announcementsLength, setAnnouncementsLength] = useState(0);
  const [stakeAnnouncementsLength, setStakeAnnouncementsLength] = useState(0);
  const [testimoniesLength, setTestimoniesLength] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const { isOnline, swReady } = useServiceWorker();
  const [, setLocation] = useLocation();
  
  // Detectar tipo de reunião baseado na data
  const isTestimonyMeeting = record.date ? isFirstSunday(record.date) : false;

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }

    // Inicializar banco de dados
    initDB().catch((error) => {
      console.error('Erro ao inicializar banco de dados:', error);
    });

    // Carregar ata salva em localStorage (se existir)
    const savedRecord = localStorage.getItem('sacramentalRecord');
    if (savedRecord) {
      try {
        const parsed = JSON.parse(savedRecord);
        setRecord(parsed);
        setAnnouncementsLength(parsed.announcements?.length || 0);
        setStakeAnnouncementsLength(parsed.stakeAnnouncements?.length || 0);
        setTestimoniesLength(parsed.testimonies?.length || 0);
        
        // Verificar quando foi o último auto-save
        const lastSave = localStorage.getItem('sacramentalRecord_lastSave');
        if (lastSave) {
          setLastAutoSave(new Date(lastSave));
        }
      } catch (error) {
        console.error('Erro ao carregar ata salva:', error);
      }
    }
  }, []);

  // Auto-save a cada 60 segundos (silencioso, apenas localStorage)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Verificar se há algum dado preenchido antes de salvar
      const hasData = record.presidedBy || record.directedBy || record.date || 
                      record.firstHymn || record.announcements || 
                      record.supportAndRelease.length > 0 || record.ordinances.length > 0;
      
      if (hasData) {
        try {
          localStorage.setItem('sacramentalRecord', JSON.stringify(record));
          const now = new Date();
          localStorage.setItem('sacramentalRecord_lastSave', now.toISOString());
          setLastAutoSave(now);
          console.log('💾 Auto-save realizado:', now.toLocaleTimeString('pt-BR'));
        } catch (error) {
          console.error('Erro no auto-save:', error);
        }
      }
    }, 60000); // 60 segundos

    return () => clearInterval(autoSaveInterval);
  }, [record]);

  const handleInputChange = (field: keyof SacramentalRecord, value: any) => {
    setRecord((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Atualizar meetingType automaticamente quando a data mudar
      if (field === 'date' && value) {
        updated.meetingType = isFirstSunday(value) ? 'testimony' : 'regular';
      }
      
      return updated;
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAnnouncementsChange = (value: string) => {
    setAnnouncementsLength(value.length);
    handleInputChange('announcements', value);
  };

  const handleStakeAnnouncementsChange = (value: string) => {
    setStakeAnnouncementsLength(value.length);
    handleInputChange('stakeAnnouncements', value);
  };
  
  const handleTestimoniesChange = (value: string) => {
    setTestimoniesLength(value.length);
    handleInputChange('testimonies', value);
  };

  const handleSupportAndReleaseChange = (items: SupportAndReleaseItem[]) => {
    setRecord((prev) => ({
      ...prev,
      supportAndRelease: items,
    }));
  };

  const handleOrdinancesChange = (items: OrdinanceItem[]) => {
    setRecord((prev) => ({
      ...prev,
      ordinances: items,
    }));
  };

  const handleCallingDesignationsChange = (items: CallingDesignationItem[]) => {
    setRecord((prev) => ({
      ...prev,
      callingDesignations: items,
    }));
  };

  const handleSave = async () => {
    // Verificar se há alguma informação preenchida
    const hasAnyData = record.presidedBy?.trim() || 
                       record.directedBy?.trim() || 
                       record.date?.trim() ||
                       record.firstHymn?.trim() ||
                       record.firstSpeaker?.trim();
    
    if (!hasAnyData) {
      toast.error('⚠️ Favor completar a ATA para depois salvar', {
        duration: 3000,
      });
      return;
    }

    const validationErrors = validateRecord(record);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowErrorModal(true);
      return;
    }

    // Mostrar modal de identificação
    setShowUserModal(true);
  };

  const handleUserConfirm = async (userName: string) => {
    setShowUserModal(false);

    const updatedRecord = {
      ...record,
      createdBy: record.id ? record.createdBy : userName, // Manter criador original se já existe
      lastEditedBy: userName,
      lastEditedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'completed' as const,
    };

    try {
      // Salvar em IndexedDB
      const id = await saveRecord(updatedRecord);
      
      // Manter cópia em localStorage para edição rápida
      localStorage.setItem('sacramentalRecord', JSON.stringify(updatedRecord));
      
      // Limpar timestamp de auto-save (já foi salvo oficialmente)
      localStorage.removeItem('sacramentalRecord_lastSave');
      setLastAutoSave(null);
      
      setRecord({ ...updatedRecord, id });
      toast.success(`✅ ATA SALVA COM SUCESSO!`, {
        duration: 4000,
        className: 'toast-success-sacramental',
        description: `Salva por ${userName}`,
        style: {
          background: '#10b981',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });
    } catch (error) {
      toast.error('❌ Erro ao salvar ata');
      console.error(error);
    }
  };

  const handleDownloadPDF = () => {
    // Verificar se há alguma informação preenchida
    const hasAnyData = record.presidedBy?.trim() || 
                       record.directedBy?.trim() || 
                       record.date?.trim() ||
                       record.firstHymn?.trim() ||
                       record.firstSpeaker?.trim();
    
    if (!hasAnyData) {
      toast.error('⚠️ Favor completar a ATA para depois baixar', {
        duration: 3000,
      });
      return;
    }

    const validationErrors = validateRecord(record);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowErrorModal(true);
      return;
    }

    const content = generateRecordText(record);
    downloadTextFile(content, `ata-sacramental-${record.date}.txt`);
    toast.success('✅ Download feito com sucesso', {
      duration: 2000,      className: 'toast-success-sacramental',    });
  };

  const handleNewRecord = () => {
    if (confirm('Deseja criar uma nova ata? Os dados atuais serão perdidos se não forem salvos.')) {
      setRecord(SACRAMENTAL_RECORD_INITIAL as SacramentalRecord);
      setErrors({});
      setAnnouncementsLength(0);
      localStorage.removeItem('sacramentalRecord');
      localStorage.removeItem('sacramentalRecord_lastSave');
      setLastAutoSave(null);
      toast.success('Nova ata criada', { className: 'toast-success-sacramental' });
    }
  };

  const handleViewHistory = () => {
    setLocation('/sacramental/history');
  };

  const handleViewStats = () => {
    setLocation('/sacramental/stats');
  };

  const handleBackToMenu = () => {
    logout(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
    setLocation('/');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section com Logo da Igreja */}
      <div className="relative w-full bg-gradient-to-br from-[#1a3a52] via-[#1e3a5f] to-[#24466e] py-16 shadow-2xl">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(212, 165, 116, 0.3) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4">
          {/* Church emblem/icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-[#d4a574] flex items-center justify-center shadow-xl">
              <img 
                src="/icon.svg" 
                alt="Igreja SUD" 
                className="w-16 h-16"
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-playfair tracking-wide drop-shadow-lg">
            Ata Sacramental
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#d4a574] to-transparent mx-auto mb-4"></div>
          
          {/* Indicador de Auto-save */}
          {lastAutoSave && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <svg className="w-3.5 h-3.5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-white/90 font-medium">
                  Rascunho salvo às {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}
          
          <p className="text-white/95 text-lg md:text-xl font-light tracking-wide">
            A Igreja de Jesus Cristo dos Santos dos Últimos Dias
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-8 md:py-12 px-4">
        {/* Status Bar */}
        <div className="mb-6 p-4 bg-white/95 backdrop-blur-sm border-2 border-[#1e3a5f]/20 rounded-xl shadow-lg flex items-center justify-between">
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
            onClick={handleBackToMenu}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Menu
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Download size={18} />
            Baixar
          </Button>
          <Button
            onClick={handleViewHistory}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Histórico
          </Button>
          <Button
            onClick={handleViewStats}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <TrendingUp size={18} />
            Estatísticas
          </Button>
          <Button
            onClick={handleNewRecord}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Nova Ata
          </Button>
        </div>

        {/* Form Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Data e Frequência */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Data e Frequência
            </h3>
            <InputField
              type="date"
              label="Data da Reunião"
              value={record.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              error={errors.date}
            />
            <InputField
              type="number"
              label="Frequência"
              value={record.attendance?.toString() || ''}
              onChange={(e) => handleInputChange('attendance', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ex: 200"
              helperText="Número de pessoas presentes na reunião"
            />
          </div>

          {/* Presidência e Direção */}
          <div className="reverent-card">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Presidência e Direção
            </h3>
            <InputField
              label="Presidida por"
              value={record.presidedBy}
              onChange={(e) => handleInputChange('presidedBy', e.target.value)}
              placeholder="Digite apenas letras"
              required
              error={errors.presidedBy}
              helperText="Apenas letras são permitidas"
            />
            <InputField
              label="Dirigida por"
              value={record.directedBy}
              onChange={(e) => handleInputChange('directedBy', e.target.value)}
              placeholder="Nome completo"
              error={errors.directedBy}
            />
            <InputField
              label="Reconhecimentos"
              value={record.recognitions}
              onChange={(e) => handleInputChange('recognitions', e.target.value)}
              placeholder="Pessoas a reconhecer"
              error={errors.recognitions}
            />
            <InputField
              label="Pianista"
              value={record.pianist}
              onChange={(e) => handleInputChange('pianist', e.target.value)}
              placeholder="Nome do pianista"
              error={errors.pianist}
            />
            <InputField
              label="Regente"
              value={record.conductor}
              onChange={(e) => handleInputChange('conductor', e.target.value)}
              placeholder="Nome do regente"
              error={errors.conductor}
            />
            <InputField
              label="Recepcionista"
              value={record.receptionist}
              onChange={(e) => handleInputChange('receptionist', e.target.value)}
              placeholder="Nome do recepcionista"
              error={errors.receptionist}
            />
          </div>

          {/* Anúncios */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Anúncios
            </h3>
            <TextAreaField
              label="Anúncios"
              value={record.announcements}
              onChange={(e) => handleAnnouncementsChange(e.target.value)}
              placeholder="Digite os anúncios aqui (máximo 1000 caracteres)"
              maxLength={1000}
              currentLength={announcementsLength}
              error={errors.announcements}
              helperText="Espaço para anúncios importantes da congregação"
            />
          </div>

          {/* Anúncios da Estaca */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Anúncios da Estaca
            </h3>
            <TextAreaField
              label="Anúncios da Estaca"
              value={record.stakeAnnouncements || ''}
              onChange={(e) => handleStakeAnnouncementsChange(e.target.value)}
              placeholder="Digite os anúncios da estaca aqui (máximo 500 caracteres)"
              maxLength={500}
              currentLength={stakeAnnouncementsLength}
              error={errors.stakeAnnouncements}
              helperText="Espaço para anúncios importantes da Estaca"
            />
          </div>

          {/* Primeiro Hino e Oração */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Abertura
            </h3>
            <InputField
              label="Primeiro Hino"
              value={record.firstHymn}
              onChange={(e) => handleInputChange('firstHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
            <InputField
              label="Primeira Oração"
              value={record.firstPrayer}
              onChange={(e) => handleInputChange('firstPrayer', e.target.value)}
              placeholder="Pessoa que fará a oração"
              error={errors.firstPrayer}
            />
          </div>

          {/* Apoio e Desobrigação */}
          <SupportAndReleaseSection
            items={record.supportAndRelease}
            onItemsChange={handleSupportAndReleaseChange}
            errors={errors}
          />

          {/* Ordenanças */}
          <OrdinancesSection
            items={record.ordinances || []}
            onItemsChange={handleOrdinancesChange}
            errors={errors}
          />

          {/* Designações de Chamados */}
          <CallingDesignationsSection
            items={record.callingDesignations || []}
            onItemsChange={handleCallingDesignationsChange}
            supportAndReleaseItems={record.supportAndRelease}
            meetingDate={record.date}
            errors={errors}
          />

          {/* Hino Sacramental */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Hino Sacramental
            </h3>
            <InputField
              label="Hino Sacramental"
              value={record.sacramentalHymn}
              onChange={(e) => handleInputChange('sacramentalHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
          </div>

          {/* Renderização condicional: Oradores OU Testemunhos */}
          {!isTestimonyMeeting ? (
            <>
              {/* Oradores - Reunião Regular */}
              <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
                  Oradores
                </h3>
                <InputField
                  label="Primeiro Orador"
                  value={record.firstSpeaker}
                  onChange={(e) => handleInputChange('firstSpeaker', e.target.value)}
                  placeholder="Nome do primeiro orador"
                  error={errors.firstSpeaker}
                />
                <InputField
                  label="Segundo Orador"
                  value={record.secondSpeaker}
                  onChange={(e) => handleInputChange('secondSpeaker', e.target.value)}
                  placeholder="Nome do segundo orador"
                  error={errors.secondSpeaker}
                />
              </div>

              {/* Hino Intermediário */}
              <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
                  Hino Intermediário <span className="text-sm text-gray-500 font-normal">(opcional)</span>
                </h3>
                <InputField
                  label="Hino Intermediário"
                  value={record.intermediateHymn}
                  onChange={(e) => handleInputChange('intermediateHymn', e.target.value)}
                  placeholder="Número ou nome do hino"
                />
              </div>
            </>
          ) : (
            <>
              {/* Testemunhos - Primeiro Domingo do Mês */}
              <div className="reverent-card bg-gradient-to-br from-white to-amber-50 border-2 border-[#d4a574]">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2 font-serif flex items-center gap-2">
                    <span className="text-[#d4a574]">✦</span>
                    Reunião de Testemunhos
                  </h3>
                  <p className="text-sm text-gray-600 italic">
                    Primeiro Domingo do Mês - Os membros prestam seus testemunhos
                  </p>
                </div>
                <TextAreaField
                  label="Membros que Prestaram Testemunho"
                  value={record.testimonies || ''}
                  onChange={(e) => handleTestimoniesChange(e.target.value)}
                  placeholder="Liste os nomes dos membros que prestaram seus testemunhos neste dia..."
                  rows={8}
                  maxLength={2000}
                />
                <div className="mt-2 text-right">
                  <span className={`text-sm ${testimoniesLength > 1900 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {testimoniesLength} / 2000 caracteres
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Encerramento */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#d4a574] shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-playfair flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d4a574] rounded-full"></span>
              Encerramento
            </h3>
            {(!isTestimonyMeeting) && (
              <InputField
                label="Último Orador"
                value={record.lastSpeaker}
                onChange={(e) => handleInputChange('lastSpeaker', e.target.value)}
                placeholder="Nome do último orador"
                error={errors.lastSpeaker}
              />
            )}
            <InputField
              label="Último Hino"
              value={record.lastHymn}
              onChange={(e) => handleInputChange('lastHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
            <InputField
              label="Última Oração"
              value={record.lastPrayer}
              onChange={(e) => handleInputChange('lastPrayer', e.target.value)}
              placeholder="Pessoa que fará a oração"
              error={errors.lastPrayer}
            />
          </div>

          {/* Final Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={handleSave}
              className="flex-1 min-w-[180px] bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar Ata
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Baixar Ata
            </Button>
            <Button
              onClick={handleViewHistory}
              className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center justify-center gap-2"
            >
              <History size={18} />
              Ver Histórico
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 bg-card">
        <div className="container text-center text-muted-foreground text-sm">
          <p>© 2025 Ata Sacramental - Igreja de Jesus Cristo dos Santos dos Últimos Dias</p>
          <p className="mt-2">Desenvolvido com reverência e dedicação</p>
        </div>
      </footer>

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message="Por favor, corrija os erros na Ata antes de salvar ou baixar."
        theme="sacramental"
      />

      {/* Modal de Identificação */}
      <UserIdentificationModal
        isOpen={showUserModal}
        onConfirm={handleUserConfirm}
        onCancel={() => setShowUserModal(false)}
        action={record.id ? 'editar' : 'criar'}
      />
    </div>
  );
}
