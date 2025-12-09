/**
 * Página de Visualização - Leitura de Ata
 * Design: Minimalismo Espiritual Contemporâneo
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SacramentalRecord } from '@/types';
import { ArrowLeft, Download, Edit2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { formatDate, generatePDF, isFirstSunday } from '@/lib/utils';

export default function View() {
  const [record, setRecord] = useState<SacramentalRecord | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#f8f5f0] flex items-center justify-center">
        <p className="text-[#1e3a5f] font-['Poppins']">Carregando...</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!contentRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const filename = `ata-sacramental-${record.date.replace(/\//g, '-')}.pdf`;
      await generatePDF(contentRef.current, filename);
      toast.success('✅ Download feito com sucesso', {
        duration: 2000,
      });
    } catch (error) {
      toast.error('❌ Erro ao gerar PDF');
      console.error(error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEdit = () => {
    // Salvar registro em localStorage para edição
    localStorage.setItem('sacramentalRecord', JSON.stringify(record));
    setLocation('/sacramental');
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 font-['Poppins'] border-b-2 border-[#d4a574] pb-2">
        {title}
      </h3>
      <div className="text-[#1e3a5f] space-y-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins']">{label}</p>
      <p className="text-[#1e3a5f] font-['Poppins']">{value || '—'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#f8f5f0]">
      {/* Header com branding da igreja */}
      <div className="bg-gradient-to-r from-[#1a3a52] via-[#1e3a5f] to-[#24466e] shadow-xl sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto py-4 px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/history')}
              className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-white font-['Playfair_Display']">Visualizar Ata</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isGeneratingPDF}
              className="bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div ref={contentRef} className="bg-white border-l-4 border-[#d4a574] rounded-lg p-8 shadow-md">
          {/* Título e Data */}
          <div className="text-center mb-12 pb-8 border-b-2 border-[#d4a574]">
            <h2 className="text-4xl font-bold text-[#1e3a5f] font-['Playfair_Display'] mb-4">
              Ata Sacramental
            </h2>
            <p className="text-xl text-[#1e3a5f]/80 font-['Poppins']">{formatDate(record.date)}</p>
            <span
              className={`inline-block mt-4 text-xs px-3 py-1 rounded-full font-semibold ${
                record.status === 'completed'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : record.status === 'draft'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
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
                  <div key={item.id} className="p-4 bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a574]/5 rounded-lg border border-[#d4a574]/20">
                    {item.type === 'release' ? (
                      <p className="text-sm font-['Poppins'] leading-relaxed">
                        <span className="font-semibold">{item.fullName}</span> estamos desobrigando o irmão ou irmã
                        do chamado <span className="font-semibold">{item.position}</span>, em louvor ao serviço
                        prestado por estes irmãos que possamos nos manifestar levantando a mão.
                      </p>
                    ) : (
                      <p className="text-sm font-['Poppins'] leading-relaxed">
                        <span className="font-semibold">{item.fullName}</span> está sendo chamado(a) para servir como{' '}
                        <span className="font-semibold">{item.callingName}</span>. Todos os que forem a favor manifestem-se 
                        levantando a mão. <span className="italic text-gray-500">(esperar membros se manifestarem)</span>{' '}
                        Ao contrário pelo mesmo sinal. Obrigado irmãos!
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Ordenanças */}
          {record.ordinances && record.ordinances.length > 0 && (
            <Section title="Ordenanças">
              <div className="space-y-3">
                {record.ordinances.map((item) => (
                  <div key={item.id} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-['Poppins'] mb-2">
                      <span className="font-semibold text-blue-600">
                        {item.type === 'confirmation' ? '✓ Confirmação de Batismo' : '✦ Apresentação de Criança'}:
                      </span>{' '}
                      <span className="font-semibold">{item.fullName}</span>
                    </p>
                    {item.performedBy && (
                      <p className="text-xs text-[#1e3a5f]/70">
                        <span className="font-semibold">Realizado por:</span> {item.performedBy}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-[#1e3a5f]/70 mt-1">
                        <span className="font-semibold">Obs:</span> {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Designações de Chamados */}
          {record.callingDesignations && record.callingDesignations.length > 0 && (
            <Section title="Designações de Chamados">
              <div className="space-y-3">
                {record.callingDesignations.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-lg border-2 ${
                      item.designatedBy && item.designationDate
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                        : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-['Poppins']">
                        <span className="font-bold text-[#1e3a5f]">{item.fullName}</span>
                        <br />
                        <span className="text-xs text-[#1e3a5f]/70">
                          <span className="font-semibold">Chamado:</span> {item.callingName}
                        </span>
                      </p>
                      {item.designatedBy && item.designationDate ? (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                          Designado
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-semibold rounded">
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#1e3a5f]/60 mb-2">
                      <span className="font-semibold">Apoiado em:</span> {new Date(item.supportedDate).toLocaleDateString('pt-BR')}
                    </p>
                    {item.designatedBy && (
                      <p className="text-xs text-[#1e3a5f]/70">
                        <span className="font-semibold">Designado por:</span> {item.designatedBy}
                      </p>
                    )}
                    {item.designationDate && (
                      <p className="text-xs text-[#1e3a5f]/70">
                        <span className="font-semibold">Data da designação:</span> {new Date(item.designationDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-[#1e3a5f]/70 mt-1">
                        <span className="font-semibold">Obs:</span> {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Hino Sacramental */}
          <Section title="Hino Sacramental">
            <Field label="Hino Sacramental" value={record.sacramentalHymn} />
          </Section>

          {/* Renderização condicional: Oradores OU Testemunhos */}
          {record.meetingType === 'testimony' || isFirstSunday(record.date) ? (
            <Section title="Reunião de Testemunhos">
              <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-[#d4a574]">
                <p className="text-sm text-[#1e3a5f]/70 font-semibold mb-3 flex items-center gap-2">
                  <span className="text-[#d4a574]">✦</span>
                  Primeiro Domingo do Mês
                </p>
                <div>
                  <p className="text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins'] mb-2">
                    Membros que Prestaram Testemunho:
                  </p>
                  <p className="whitespace-pre-wrap text-[#1e3a5f]">
                    {record.testimonies || 'Nenhum testemunho registrado'}
                  </p>
                </div>
              </div>
            </Section>
          ) : (
            <Section title="Oradores">
              <div className="space-y-4">
                <Field label="Primeiro Orador" value={record.firstSpeaker} />
                <Field label="Segundo Orador" value={record.secondSpeaker} />
                <Field label="Hino Intermediário" value={record.intermediateHymn} />
                <Field label="Último Orador" value={record.lastSpeaker} />
              </div>
            </Section>
          )}

          {/* Encerramento */}
          <Section title="Encerramento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Último Hino" value={record.lastHymn} />
              <Field label="Última Oração" value={record.lastPrayer} />
            </div>
          </Section>

          {/* Metadados */}
          <div className="mt-12 pt-8 border-t-2 border-[#d4a574] text-center text-sm text-[#1e3a5f]/70 font-['Poppins']">
            <p>Criada em: {new Date(record.createdAt).toLocaleString('pt-BR')}</p>
            <p>Última atualização: {new Date(record.updatedAt).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 mt-8 justify-center flex-wrap">
          <Button 
            onClick={handleEdit} 
            className="flex-1 min-w-[180px] bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Edit2 size={18} />
            Editar Ata
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isGeneratingPDF}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {isGeneratingPDF ? 'Gerando PDF...' : 'Baixar PDF'}
          </Button>
          <Button
            onClick={() => setLocation('/history')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Voltar ao Histórico
          </Button>
        </div>
      </div>
    </div>
  );
}
