/**
 * Página de Convite para Discursante
 * Gera PDF interativo com tema escuro preservado e links clicáveis
 * Design: Minimalismo Espiritual Contemporâneo
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Plus, Trash2, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import { useWard } from '@/contexts/WardContext';
import { toast } from 'sonner';

interface SpeakerData {
  id: string;
  name: string;
  date: string;
  topic: string;
  topicUrl: string;
  duration: string;
}

const createEmptySpeaker = (): SpeakerData => ({
  id: crypto.randomUUID(),
  name: '',
  date: '',
  topic: '',
  topicUrl: '',
  duration: '5',
});

export default function SpeakerInvitation() {
  const [, setLocation] = useLocation();
  const { wardName } = useWard();
  const [speakers, setSpeakers] = useState<SpeakerData[]>([createEmptySpeaker()]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSpeaker, setPreviewSpeaker] = useState<SpeakerData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const displayWardName = wardName || 'Ala Casa Grande';

  const updateSpeaker = (id: string, field: keyof SpeakerData, value: string) => {
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSpeaker = () => {
    setSpeakers(prev => [...prev, createEmptySpeaker()]);
  };

  const removeSpeaker = (id: string) => {
    if (speakers.length <= 1) return;
    setSpeakers(prev => prev.filter(s => s.id !== id));
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '[Data não definida]';
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`;
  };

  const generatePDFForSpeaker = async (speaker: SpeakerData) => {
    if (!speaker.name.trim()) {
      toast.error('Preencha o nome do orador');
      return;
    }

    setIsGenerating(true);
    setPreviewSpeaker(speaker);

    // Aguardar renderização do preview
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = cardRef.current;
      if (!element) throw new Error('Elemento não encontrado');

      const opt = {
        margin: 0,
        filename: `convite-${speaker.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#0f172a',
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: [210, 297] as [number, number],
          orientation: 'portrait' as const,
        },
        enableLinks: true,
      };

      await html2pdf().set(opt).from(element).save();
      toast.success(`PDF gerado para ${speaker.name}`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllPDFs = async () => {
    const validSpeakers = speakers.filter(s => s.name.trim());
    if (validSpeakers.length === 0) {
      toast.error('Preencha pelo menos um nome de orador');
      return;
    }

    for (const speaker of validSpeakers) {
      await generatePDFForSpeaker(speaker);
      // Pequena pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#f8f5f0]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3a52] via-[#1e3a5f] to-[#24466e] shadow-xl sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto py-4 px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/sacramental')}
              className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-white font-['Playfair_Display']">
              Convite para Discursantes
            </h1>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Info da Ala */}
        <div className="bg-white rounded-xl border border-[#d4a574]/30 p-6 shadow-sm">
          <p className="text-[#1e3a5f] font-['Poppins'] font-semibold text-lg">
            Ala: <span className="text-[#d4a574]">{displayWardName}</span>
          </p>
          <p className="text-[#1e3a5f]/60 font-['Poppins'] text-sm mt-1">
            Preencha os dados abaixo para gerar convites personalizados em PDF para cada discursante.
          </p>
        </div>

        {/* Lista de Oradores */}
        {speakers.map((speaker, index) => (
          <div
            key={speaker.id}
            className="bg-white rounded-xl border border-[#d4a574]/30 p-6 shadow-sm space-y-4 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1e3a5f] font-['Playfair_Display']">
                Orador {index + 1}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setPreviewSpeaker(speaker);
                  }}
                  className="bg-[#1e3a5f]/10 text-[#1e3a5f] hover:bg-[#1e3a5f]/20 transition-all text-sm px-3 py-1 h-8"
                  title="Visualizar"
                >
                  <Eye size={14} className="mr-1" />
                  Preview
                </Button>
                {speakers.length > 1 && (
                  <Button
                    onClick={() => removeSpeaker(speaker.id)}
                    className="bg-red-50 text-red-500 hover:bg-red-100 transition-all text-sm px-3 py-1 h-8"
                    title="Remover orador"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins'] mb-1">
                  Nome do Orador(a) *
                </label>
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => updateSpeaker(speaker.id, 'name', e.target.value)}
                  placeholder="Ex: Irmão(ã) Silva"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[#1e3a5f] font-['Poppins'] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins'] mb-1">
                  Data da Reunião *
                </label>
                <input
                  type="date"
                  value={speaker.date}
                  onChange={(e) => updateSpeaker(speaker.id, 'date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[#1e3a5f] font-['Poppins'] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins'] mb-1">
                  Tema Sugerido
                </label>
                <input
                  type="text"
                  value={speaker.topic}
                  onChange={(e) => updateSpeaker(speaker.id, 'topic', e.target.value)}
                  placeholder="Ex: A Fé em Jesus Cristo"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[#1e3a5f] font-['Poppins'] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins'] mb-1">
                  Link do Tema (URL)
                </label>
                <input
                  type="url"
                  value={speaker.topicUrl}
                  onChange={(e) => updateSpeaker(speaker.id, 'topicUrl', e.target.value)}
                  placeholder="https://www.churchofjesuschrist.org/..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[#1e3a5f] font-['Poppins'] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e3a5f]/70 font-['Poppins'] mb-1">
                  Tempo de Discurso (minutos)
                </label>
                <input
                  type="number"
                  value={speaker.duration}
                  onChange={(e) => updateSpeaker(speaker.id, 'duration', e.target.value)}
                  min="1"
                  max="30"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[#1e3a5f] font-['Poppins'] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] outline-none transition-all"
                />
              </div>
            </div>

            {/* Botão individual de download */}
            <div className="pt-2">
              <Button
                onClick={() => generatePDFForSpeaker(speaker)}
                disabled={isGenerating || !speaker.name.trim()}
                className="bg-[#1e3a5f] text-white hover:bg-[#24466e] transition-all duration-300 shadow-md hover:shadow-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                {isGenerating ? 'Gerando...' : 'Gerar PDF deste Orador'}
              </Button>
            </div>
          </div>
        ))}

        {/* Ações */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={addSpeaker}
            className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md font-semibold flex items-center gap-2"
          >
            <Plus size={16} />
            Adicionar Orador
          </Button>
          <Button
            onClick={generateAllPDFs}
            disabled={isGenerating}
            className="bg-[#d4a574] text-[#1e3a5f] hover:bg-[#c49564] transition-all duration-300 shadow-md hover:shadow-xl font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} />
            {isGenerating ? 'Gerando PDFs...' : 'Gerar Todos os PDFs'}
          </Button>
        </div>
      </div>

      {/* Preview Card (visível para captura do PDF) */}
      {previewSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-w-[540px] w-full">
            {/* Botão fechar */}
            <button
              onClick={() => { if (!isGenerating) setPreviewSpeaker(null); }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1e3a5f] hover:bg-gray-100 transition-all font-bold text-sm"
            >
              ✕
            </button>

            {/* Card do Convite - capturado para PDF */}
            <div
              ref={cardRef}
              style={{
                fontFamily: "'Poppins', sans-serif",
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                color: '#ffffff',
                padding: '48px 40px',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              {/* Barra superior dourada */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #1e3a5f, #d4a574, #1e3a5f)',
                }}
              />

              {/* Decoração lateral */}
              <div
                style={{
                  position: 'absolute',
                  top: '30%',
                  left: '-50px',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'rgba(30, 58, 95, 0.3)',
                  filter: 'blur(60px)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '20%',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'rgba(212, 165, 116, 0.1)',
                  filter: 'blur(50px)',
                }}
              />

              {/* Logo */}
              <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(212, 165, 116, 0.3)',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <img
                    src="https://raw.githubusercontent.com/Hks72BR/Ata-Reuniao-Sacramental/main/public/church_logo.png"
                    alt="Logo"
                    style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '2.5rem',
                    marginBottom: '8px',
                    color: '#ffffff',
                    lineHeight: 1.2,
                  }}
                >
                  Convite
                </h1>
                <span
                  style={{
                    color: '#d4a574',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontSize: '0.8rem',
                    display: 'block',
                    marginBottom: '32px',
                  }}
                >
                  Reunião Sacramental • {displayWardName}
                </span>
              </div>

              {/* Conteúdo */}
              <div style={{ textAlign: 'left', lineHeight: 1.6, marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                <p
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: '#ffffff',
                  }}
                >
                  Olá, {previewSpeaker.name || '[Nome do Orador]'},
                </p>
                <p
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '24px',
                    fontSize: '0.95rem',
                  }}
                >
                  É com muita alegria que o(a) convidamos para compartilhar uma mensagem
                  inspiradora em nossa próxima Reunião Sacramental. Sua preparação e
                  testemunho serão uma bênção para todos nós.
                </p>

                {/* Info Box */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '12px',
                    padding: '20px',
                    borderLeft: '3px solid #d4a574',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#d4a574',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        marginBottom: '2px',
                        letterSpacing: '1px',
                      }}
                    >
                      Data da Reunião
                    </span>
                    <span style={{ fontSize: '1rem', color: '#ffffff' }}>
                      {formatDateDisplay(previewSpeaker.date)}
                    </span>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#d4a574',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        marginBottom: '2px',
                        letterSpacing: '1px',
                      }}
                    >
                      Tema Sugerido
                    </span>
                    {previewSpeaker.topicUrl ? (
                      <a
                        href={previewSpeaker.topicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '1rem',
                          color: '#7db8f0',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        {previewSpeaker.topic || 'Clique para acessar o tema'}
                      </a>
                    ) : (
                      <span style={{ fontSize: '1rem', color: '#ffffff' }}>
                        {previewSpeaker.topic || '[Tema não definido]'}
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: '#d4a574',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        marginBottom: '2px',
                        letterSpacing: '1px',
                      }}
                    >
                      Tempo de Discurso
                    </span>
                    <span style={{ fontSize: '1rem', color: '#ffffff' }}>
                      {previewSpeaker.duration || '5'} minutos
                    </span>
                  </div>
                </div>

                {/* Escritura */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    fontStyle: 'italic',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  "Pois onde estiverem dois ou três reunidos em meu nome,
                  <br />
                  ali estou eu no meio deles." (Mateus 18:20)
                </p>
              </div>

              {/* Rodapé */}
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '24px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Atenciosamente,
                <br />
                <strong style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  Bispado da {displayWardName}
                </strong>
              </div>

              {/* Barra inferior */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #1e3a5f, #d4a574, #1e3a5f)',
                }}
              />
            </div>

            {/* Botões do Preview */}
            {!isGenerating && (
              <div className="flex justify-center gap-3 mt-4">
                <Button
                  onClick={() => setPreviewSpeaker(null)}
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm font-semibold"
                >
                  Fechar Preview
                </Button>
                <Button
                  onClick={() => generatePDFForSpeaker(previewSpeaker)}
                  className="bg-[#d4a574] text-[#1e3a5f] hover:bg-[#c49564] font-semibold flex items-center gap-2"
                >
                  <Download size={16} />
                  Baixar PDF
                </Button>
              </div>
            )}
            {isGenerating && (
              <div className="flex justify-center mt-4">
                <div className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-['Poppins'] flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Gerando PDF...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
