/**
 * Página de Visualização - Ata Batismal
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BaptismalRecord } from '@/types';
import { ArrowLeft, Download, Edit2 } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { toast } from 'sonner';
import { formatDate, generatePDF } from '@/lib/utils';
import { getBaptismalRecordFromCloud } from '@/lib/baptismalFirestore';

export default function BaptismalView() {
  const [record, setRecord] = useState<BaptismalRecord | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRecord = async () => {
      const recordId = params.id;
      
      if (!recordId) {
        console.error('[BaptismalView] ID não encontrado');
        toast.error('ID da ata não encontrado');
        setLocation('/baptismal/history');
        return;
      }

      try {
        setIsLoading(true);
        console.log('[BaptismalView] Carregando ata com ID:', recordId);
        const data = await getBaptismalRecordFromCloud(recordId);
        console.log('[BaptismalView] Ata carregada:', data);
        
        if (!data) {
          console.error('[BaptismalView] Ata não encontrada');
          toast.error('Ata batismal não encontrada');
          setLocation('/404');
          return;
        }
        
        setRecord(data);
        console.log('[BaptismalView] Record setado com sucesso');
      } catch (error) {
        console.error('[BaptismalView] Erro ao carregar ata:', error);
        toast.error(`Erro ao carregar ata: ${error}`);
        setLocation('/baptismal/history');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecord();
  }, [params.id, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e8b9f] mx-auto mb-4"></div>
          <p className="text-[#1e8b9f] font-['Poppins']">Carregando ata batismal...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center">
        <p className="text-[#1e8b9f] font-['Poppins']">Carregando...</p>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!contentRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const filename = `ata-batismal-${record.date.replace(/\//g, '-')}.pdf`;
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
    localStorage.setItem('baptismalRecord', JSON.stringify(record));
    toast.success('Carregando para edição...', { duration: 1000 });
    setLocation('/baptismal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a7a8a] via-[#1e8b9f] to-[#16a085] shadow-xl sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto py-4 px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/baptismal/history')}
              className="bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-white font-['Playfair_Display']">Visualizar Ata Batismal</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              className="bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isGeneratingPDF}
              className="bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <Download size={16} />
              {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo para PDF */}
      <div ref={contentRef} className="container max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-[#16a085] p-8">
          {/* Cabeçalho */}
          <div className="text-center mb-8 pb-6 border-b-2 border-[#16a085]">
            <h2 className="text-4xl font-bold text-[#1e8b9f] mb-2 font-['Playfair_Display']">
              Ata de Serviço Batismal
            </h2>
            <p className="text-xl text-[#16a085] font-['Poppins']">
              A Igreja de Jesus Cristo dos Santos dos Últimos Dias
            </p>
            <p className="text-lg text-[#1e8b9f]/80 mt-2 font-['Poppins']">
              {formatDate(record.date)}
            </p>
          </div>

          {/* Informações do Batismo */}
          <div className="space-y-6">
            <Section title="Presidência e Direção">
              <Field label="Presidida por" value={record.presidedBy} />
              <Field label="Dirigida por" value={record.directedBy} />
              <Field label="Pianista" value={record.pianist} />
              <Field label="Regente" value={record.conductor} />
            </Section>

            <Section title="Abertura">
              <Field label="Hino de Abertura" value={record.openingHymn} />
              <Field label="Oração de Abertura" value={record.openingPrayer} />
            </Section>

            <Section title="Programa">
              <Field label="Testemunho" value={record.testimony} />
              <Field label="Mensagem" value={record.message} />
              {record.specialPresentation && (
                <Field label="Apresentação Especial" value={record.specialPresentation} />
              )}
            </Section>

            <Section title="Ordenança Batismal">
              <Field label="Pessoa Batizada" value={record.personBeingBaptized} />
              <Field label="Oficiante do Batismo" value={record.personPerformingBaptism} />
              <Field label="Local do Batismo" value={
                record.baptismLocation === 'baptism-room' ? 'Sala de Batismo' : 'Mesma Sala da Reunião'
              } />
              <Field label="Primeira Testemunha" value={record.witnesses[0]} />
              <Field label="Segunda Testemunha" value={record.witnesses[1]} />
            </Section>

            {record.ordinances && record.ordinances.length > 0 && (
              <Section title="Ordenanças">
                {record.ordinances.map((ordinance, index) => (
                  <div key={ordinance.id || index} className="mb-4 p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border border-[#16a085]/30">
                    <div className="mb-2">
                      <span className="px-3 py-1 bg-[#16a085] text-white text-xs font-semibold rounded-full">
                        {ordinance.type === 'confirmation' ? 'Confirmação de Batismo' : 'Apresentação de Criança'}
                      </span>
                    </div>
                    <Field 
                      label={ordinance.type === 'confirmation' ? 'Nome do Confirmado' : 'Nome da Criança'} 
                      value={ordinance.fullName} 
                    />
                    <Field 
                      label={ordinance.type === 'confirmation' ? 'Confirmação realizada por' : 'Bênção realizada por'} 
                      value={ordinance.performedBy} 
                    />
                    {ordinance.notes && (
                      <Field label="Observações" value={ordinance.notes} />
                    )}
                  </div>
                ))}
              </Section>
            )}

            <Section title="Encerramento">
              <Field label="Hino de Encerramento" value={record.closingHymn} />
              <Field label="Oração de Encerramento" value={record.closingPrayer} />
            </Section>
          </div>

          {/* Rodapé */}
          <div className="mt-12 pt-8 border-t-2 border-[#16a085] text-center text-sm text-[#1e8b9f]/70 font-['Poppins']">
            <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="mt-2">Sistema de Atas - Ala Casa Grande</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 flex items-center gap-2 font-['Poppins'] border-b border-[#16a085] pb-2">
        <span className="w-2 h-2 bg-[#16a085] rounded-full"></span>
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
      <p className="text-sm font-semibold text-[#1e8b9f]/70 font-['Poppins']">{label}</p>
      <p className="text-[#1e8b9f] font-['Poppins']">{value || '—'}</p>
    </div>
  );
}
