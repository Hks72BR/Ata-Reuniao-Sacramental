/**
 * Página de Histórico - Consulta de Atas Anteriores
 * Design: Minimalismo Espiritual Contemporâneo
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { getAllRecords, searchRecordsByDate, deleteRecord } from '@/lib/db';
import { SacramentalRecord } from '@/types';
import { Trash2, Download, Search, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';

export default function History() {
  const [records, setRecords] = useState<SacramentalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<SacramentalRecord[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('[History] Carregando atas...');
      const allRecords = await getAllRecords();
      console.log('[History] Atas carregadas:', allRecords.length, allRecords);
      
      // Debug: Ver estrutura completa das atas
      if (allRecords.length > 0) {
        console.log('[History] Primeira ata completa:', JSON.stringify(allRecords[0], null, 2));
      }
      
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      if (allRecords.length === 0) {
        toast.info('Nenhuma ata encontrada. Crie a primeira ata!');
      }
    } catch (error) {
      console.error('[History] Erro ao carregar:', error);
      toast.error('Erro ao carregar histórico de atas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchDate) {
      setFilteredRecords(records);
      return;
    }

    try {
      const results = await searchRecordsByDate(searchDate);
      setFilteredRecords(results);
      if (results.length === 0) {
        toast.info('Nenhuma ata encontrada para esta data');
      }
    } catch (error) {
      toast.error('Erro ao buscar ata');
      console.error(error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta ata? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteRecord(id);
      toast.success('✅ Ata deletada com sucesso', {
        duration: 2000,
      });
      await loadRecords();
    } catch (error) {
      toast.error('❌ Erro ao deletar ata');
      console.error(error);
    }
  };

  const handleDownloadRecord = async (record: SacramentalRecord) => {
    try {
      toast.info('📄 Gerando PDF...', { duration: 2000 });
      
      // Criar elemento temporário com o conteúdo da ata
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      
      tempDiv.innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; padding: 40px; background: white;">
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #1e3a5f;">
            <h1 style="font-family: 'Playfair Display', serif; color: #1e3a5f; font-size: 36px; margin-bottom: 10px;">Ata de Reunião Sacramental</h1>
            <p style="color: #d4a574; font-size: 20px; margin-bottom: 10px;">A Igreja de Jesus Cristo dos Santos dos Últimos Dias</p>
            <p style="color: #1e3a5f; font-size: 18px; opacity: 0.8;">${formatDate(record.date)}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e3a5f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">◦ Presidência e Direção</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Presidida por:</strong> ${record.presidedBy || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Dirigida por:</strong> ${record.directedBy || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Reconhecimentos:</strong> ${record.recognitions || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Pianista:</strong> ${record.pianist || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Regente:</strong> ${record.conductor || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Recepcionista:</strong> ${record.receptionist || '—'}</p>
            </div>
          </div>
          
          ${record.announcements ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e3a5f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">◦ Anúncios</h3>
            <div style="margin-left: 20px;">
              <p style="white-space: pre-wrap;">${record.announcements}</p>
            </div>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e3a5f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">◦ Hinos e Orações</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Hino de Abertura:</strong> ${record.firstHymn || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Oração de Abertura:</strong> ${record.firstPrayer || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Hino Sacramental:</strong> ${record.sacramentalHymn || '—'}</p>
              ${record.intermediateHymn ? `<p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Hino Intermediário:</strong> ${record.intermediateHymn}</p>` : ''}
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Último Hino:</strong> ${record.lastHymn || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Última Oração:</strong> ${record.lastPrayer || '—'}</p>
            </div>
          </div>
          
          ${record.firstSpeaker || record.secondSpeaker || record.lastSpeaker ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e3a5f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">◦ Oradores</h3>
            <div style="margin-left: 20px;">
              ${record.firstSpeaker ? `<p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Primeiro Orador:</strong> ${record.firstSpeaker}</p>` : ''}
              ${record.secondSpeaker ? `<p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Segundo Orador:</strong> ${record.secondSpeaker}</p>` : ''}
              ${record.lastSpeaker ? `<p style="margin-bottom: 10px;"><strong style="color: #1e3a5f;">Último Orador:</strong> ${record.lastSpeaker}</p>` : ''}
            </div>
          </div>
          ` : ''}
          
          <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #d4a574; text-align: center; font-size: 12px; color: #1e3a5f; opacity: 0.7;">
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            <p style="margin-top: 10px;">Sistema de Atas - Ala Casa Grande</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Gerar PDF
      const { generatePDF } = await import('@/lib/utils');
      const filename = `ata-sacramental-${record.date.replace(/\//g, '-')}.pdf`;
      await generatePDF(tempDiv, filename);
      
      // Remover elemento temporário
      document.body.removeChild(tempDiv);
      
      toast.success('✅ Download feito com sucesso', { duration: 2000 });
    } catch (error) {
      toast.error('❌ Erro ao gerar PDF');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#f8f5f0]">
      {/* Header com branding da igreja */}
      <div className="bg-gradient-to-r from-[#1a3a52] via-[#1e3a5f] to-[#24466e] shadow-xl">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setLocation('/')}
              className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Menu
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-[#d4a574] flex items-center justify-center">
              <Calendar size={32} className="text-[#d4a574]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white font-['Playfair_Display']">
                Histórico de Atas
              </h1>
              <p className="text-[#d4a574] mt-1 font-['Poppins']">
                Consulte e gerencie atas anteriores
              </p>
            </div>
          </div>
          
          <div className="h-1 w-32 bg-gradient-to-r from-[#d4a574] to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Busca */}
        <div className="mb-8 p-6 bg-white border-l-4 border-[#d4a574] rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-2 font-['Poppins']">
            <Search size={20} className="text-[#d4a574]" />
            Buscar por Data
          </h3>
          <div className="flex gap-4 flex-wrap">
            <InputField
              type="date"
              label="Data"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <div className="flex gap-2 items-end">
              <Button 
                onClick={handleSearch} 
                className="bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
              >
                <Search size={18} />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setSearchDate('');
                  setFilteredRecords(records);
                }}
                className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Atas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#1e3a5f] font-['Poppins']">Carregando atas...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white border-l-4 border-[#d4a574] rounded-lg shadow-md">
            <Calendar size={48} className="mx-auto text-[#d4a574] mb-4" />
            <p className="text-[#1e3a5f] text-lg font-semibold font-['Poppins']">Nenhuma ata encontrada</p>
            <p className="text-[#1e3a5f]/70 text-sm mt-2 font-['Poppins']">
              Crie sua primeira ata clicando no botão "Voltar"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-6 bg-white border-l-4 border-[#d4a574] rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <h3 className="text-xl font-bold text-[#1e3a5f] mb-2 font-['Playfair_Display']">
                      {formatDate(record.date)}
                    </h3>
                    <div className="text-sm text-[#1e3a5f]/80 space-y-1 font-['Poppins']">
                      <p>
                        <span className="font-semibold text-[#1e3a5f]">Presidida por:</span> {record.presidedBy}
                      </p>
                      {record.directedBy && (
                        <p>
                          <span className="font-semibold text-[#1e3a5f]">Dirigida por:</span> {record.directedBy}
                        </p>
                      )}
                      {record.firstSpeaker && (
                        <p>
                          <span className="font-semibold text-[#1e3a5f]">Oradores:</span> {record.firstSpeaker}
                          {record.secondSpeaker && `, ${record.secondSpeaker}`}
                          {record.lastSpeaker && `, ${record.lastSpeaker}`}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleDownloadRecord(record)}
                      className="bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                    >
                      <Download size={16} />
                      Baixar PDF
                    </Button>
                    <Button
                      onClick={() => handleDeleteRecord(record.id!)}
                      className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Deletar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas */}
        {!loading && records.length > 0 && (
          <div className="mt-8 p-6 bg-white border-l-4 border-[#d4a574] rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-4 font-['Poppins']">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a574]/5 rounded-lg">
                <p className="text-3xl font-bold text-[#1e3a5f] font-['Playfair_Display']">{records.length}</p>
                <p className="text-sm text-[#1e3a5f]/70 font-['Poppins']">Total de Atas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a574]/5 rounded-lg">
                <p className="text-3xl font-bold text-[#1e3a5f] font-['Playfair_Display']">
                  {records.filter((r) => r.status === 'completed').length}
                </p>
                <p className="text-sm text-[#1e3a5f]/70 font-['Poppins']">Completas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a574]/5 rounded-lg">
                <p className="text-3xl font-bold text-[#1e3a5f] font-['Playfair_Display']">
                  {records.filter((r) => r.status === 'draft').length}
                </p>
                <p className="text-sm text-[#1e3a5f]/70 font-['Poppins']">Rascunhos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
