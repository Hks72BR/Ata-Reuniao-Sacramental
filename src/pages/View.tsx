/**
 * Página de Visualização - Leitura de Ata
 * Design: Minimalismo Espiritual Contemporâneo
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SacramentalRecord } from '@/types';
import { ArrowLeft, Download, Edit2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { formatDate, generateRecordText, downloadTextFile } from '@/lib/utils';

export default function View() {
  const [record, setRecord] = useState<SacramentalRecord | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Recuperar registro de sessionStorage
    const viewingRecord = sessionStorage.getItem('viewingRecord');
    if (viewingRecord) {
      try {
        setRecord(JSON.parse(viewingRecord));
      } catch (error) {
        toast.error('Erro ao carregar ata');
        setLocation('/history');
      }
    } else {
      setLocation('/history');
    }
  }, [setLocation]);

  if (!record) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const handleDownload = () => {
    const content = generateRecordText(record);
    downloadTextFile(content, `ata-sacramental-${record.date}.txt`);
    toast.success('Ata baixada com sucesso');
  };

  const handleEdit = () => {
    // Salvar registro em localStorage para edição
    localStorage.setItem('sacramentalRecord', JSON.stringify(record));
    setLocation('/');
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-foreground mb-4 font-serif border-b-2 border-accent pb-2">
        {title}
      </h3>
      <div className="text-foreground space-y-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-foreground">{value || '—'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/history')}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-foreground font-serif">Visualizar Ata</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Baixar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12">
        <div className="bg-card border border-border rounded-lg p-8">
          {/* Título e Data */}
          <div className="text-center mb-12 pb-8 border-b border-border">
            <h2 className="text-4xl font-bold text-foreground font-serif mb-4">
              Ata Sacramental
            </h2>
            <p className="text-xl text-muted-foreground">{formatDate(record.date)}</p>
            <span
              className={`inline-block mt-4 text-xs px-3 py-1 rounded-full ${
                record.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : record.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {record.status === 'completed'
                ? 'Completa'
                : record.status === 'draft'
                ? 'Rascunho'
                : 'Arquivada'}
            </span>
          </div>

          {/* Presidência e Direção */}
          <Section title="Presidência e Direção">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Presidida por" value={record.presidedBy} />
              <Field label="Dirigida por" value={record.directedBy} />
              <Field label="Reconhecimentos" value={record.recognitions} />
              <Field label="Pianista" value={record.pianist} />
              <Field label="Regente" value={record.conductor} />
              <Field label="Recepcionista" value={record.receptionist} />
            </div>
          </Section>

          {/* Anúncios */}
          {record.announcements && (
            <Section title="Anúncios">
              <p className="whitespace-pre-wrap">{record.announcements}</p>
            </Section>
          )}

          {/* Abertura */}
          <Section title="Abertura">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Primeiro Hino" value={record.firstHymn} />
              <Field label="Primeira Oração" value={record.firstPrayer} />
            </div>
          </Section>

          {/* Apoio e Desobrigação */}
          {record.supportAndRelease.length > 0 && (
            <Section title="Apoio e Desobrigação">
              <div className="space-y-3">
                {record.supportAndRelease.map((item) => (
                  <div key={item.id} className="p-4 bg-secondary rounded-lg border border-border">
                    <p className="text-sm">
                      <span className="font-semibold text-accent">
                        {item.type === 'release' ? 'Desobrigação' : 'Apoio'}:
                      </span>{' '}
                      <span className="font-semibold">{item.fullName}</span>
                      {item.type === 'release' && item.position && (
                        <span> - Posição: {item.position}</span>
                      )}
                      {item.type === 'support' && item.callingName && (
                        <span> - Chamado: {item.callingName}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Hino Sacramental */}
          <Section title="Hino Sacramental">
            <Field label="Hino Sacramental" value={record.sacramentalHymn} />
          </Section>

          {/* Oradores */}
          <Section title="Oradores">
            <div className="space-y-4">
              <Field label="Primeiro Orador" value={record.firstSpeaker} />
              <Field label="Segundo Orador" value={record.secondSpeaker} />
              <Field label="Hino Intermediário" value={record.intermediateHymn} />
              <Field label="Último Orador" value={record.lastSpeaker} />
            </div>
          </Section>

          {/* Encerramento */}
          <Section title="Encerramento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Último Hino" value={record.lastHymn} />
              <Field label="Última Oração" value={record.lastPrayer} />
            </div>
          </Section>

          {/* Metadados */}
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>Criada em: {new Date(record.createdAt).toLocaleString('pt-BR')}</p>
            <p>Última atualização: {new Date(record.updatedAt).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 mt-8 justify-center">
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit2 size={18} />
            Editar Ata
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
            <Download size={18} />
            Baixar Ata
          </Button>
          <Button
            onClick={() => setLocation('/history')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar ao Histórico
          </Button>
        </div>
      </div>
    </div>
  );
}
