/**
 * Página Principal - Formulário de Ata Sacramental
 * Design: Minimalismo Espiritual Contemporâneo
 * Cores: Navy (#1e3a5f) + Dourado (#d4a574) + Branco
 * Tipografia: Playfair Display (títulos) + Poppins (corpo)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField, TextAreaField } from '@/components/FormField';
import { SupportAndReleaseSection } from '@/components/SupportAndReleaseSection';
import { SacramentalRecord, SupportAndReleaseItem, SACRAMENTAL_RECORD_INITIAL } from '@/types';
import { Download, Save, Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { saveRecord, initDB } from '@/lib/db';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { validateRecord, generateRecordText, downloadTextFile } from '@/lib/utils';

export default function Home() {
  const [record, setRecord] = useState<SacramentalRecord>(SACRAMENTAL_RECORD_INITIAL as SacramentalRecord);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [announcementsLength, setAnnouncementsLength] = useState(0);
  const { isOnline, swReady } = useServiceWorker();
  const [, setLocation] = useLocation();

  useEffect(() => {
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
      } catch (error) {
        console.error('Erro ao carregar ata salva:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof SacramentalRecord, value: any) => {
    setRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleSupportAndReleaseChange = (items: SupportAndReleaseItem[]) => {
    setRecord((prev) => ({
      ...prev,
      supportAndRelease: items,
    }));
  };

  const handleSave = async () => {
    const validationErrors = validateRecord(record);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const updatedRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
      status: 'completed' as const,
    };

    try {
      // Salvar em IndexedDB
      const id = await saveRecord(updatedRecord);
      
      // Manter cópia em localStorage para edição rápida
      localStorage.setItem('sacramentalRecord', JSON.stringify(updatedRecord));
      
      setRecord({ ...updatedRecord, id });
      toast.success('Ata sacramental salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar ata');
      console.error(error);
    }
  };

  const handleDownloadPDF = () => {
    const validationErrors = validateRecord(record);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const content = generateRecordText(record);
    downloadTextFile(content, `ata-sacramental-${record.date}.txt`);
    toast.success('Ata sacramental baixada com sucesso!');
  };

  const handleNewRecord = () => {
    if (confirm('Deseja criar uma nova ata? Os dados atuais serão perdidos se não forem salvos.')) {
      setRecord(SACRAMENTAL_RECORD_INITIAL as SacramentalRecord);
      setErrors({});
      setAnnouncementsLength(0);
      localStorage.removeItem('sacramentalRecord');
      toast.success('Nova ata criada');
    }
  };

  const handleViewHistory = () => {
    setLocation('/history');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section com Background */}
      <div
        className="relative w-full h-64 bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url(/images/hero-background.png)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold text-white mb-2 font-serif">Ata Sacramental</h1>
          <p className="text-white/90 text-lg">
            Igreja de Jesus Cristo dos Santos dos Últimos Dias
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12">
        {/* Status Bar */}
        <div className="mb-8 p-4 bg-card border border-border rounded-lg flex items-center justify-between">
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
            onClick={handleSave}
            className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download size={18} />
            Baixar
          </Button>
          <Button
            onClick={handleViewHistory}
            variant="outline"
            className="flex items-center gap-2"
          >
            <History size={18} />
            Histórico
          </Button>
          <Button
            onClick={handleNewRecord}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Ata
          </Button>
        </div>

        {/* Form Sections */}
        <div className="reverent-spacing">
          {/* Data */}
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">Data</h3>
            <InputField
              type="date"
              label="Data da Reunião"
              value={record.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              error={errors.date}
            />
          </div>

          {/* Presidência e Direção */}
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">
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
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">Anúncios</h3>
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

          {/* Primeiro Hino e Oração */}
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">
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

          {/* Hino Sacramental */}
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">
              Hino Sacramental
            </h3>
            <InputField
              label="Hino Sacramental"
              value={record.sacramentalHymn}
              onChange={(e) => handleInputChange('sacramentalHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
          </div>

          {/* Oradores */}
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">
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
            <InputField
              label="Hino Intermediário"
              value={record.intermediateHymn}
              onChange={(e) => handleInputChange('intermediateHymn', e.target.value)}
              placeholder="Número ou nome do hino"
            />
            <InputField
              label="Último Orador"
              value={record.lastSpeaker}
              onChange={(e) => handleInputChange('lastSpeaker', e.target.value)}
              placeholder="Nome do último orador"
              error={errors.lastSpeaker}
            />
          </div>

          {/* Encerramento */}
          <div className="reverent-card">
            <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">
              Encerramento
            </h3>
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
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar Ata
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Baixar Ata
            </Button>
            <Button
              onClick={handleViewHistory}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
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
    </div>
  );
}
