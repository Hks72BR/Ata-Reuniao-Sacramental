/**
 * Página de Histórico Batismal - Consulta de Atas Batismais Anteriores
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { BaptismalRecord } from '@/types';
import { Trash2, Download, Search, Droplets, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { 
  getAllBaptismalRecordsFromCloud, 
  deleteBaptismalRecordFromCloud,
  searchBaptismalRecordsByDateInCloud 
} from '@/lib/baptismalFirestore';

export default function BaptismalHistory() {
  const [records, setRecords] = useState<BaptismalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BaptismalRecord[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.BAPTISMAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('[BaptismalHistory] Carregando atas batismais...');
      const allRecords = await getAllBaptismalRecordsFromCloud();
      console.log('[BaptismalHistory] Atas carregadas:', allRecords.length);
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      if (allRecords.length === 0) {
        toast.info('Nenhuma ata batismal encontrada. Crie a primeira!');
      }
    } catch (error) {
      console.error('[BaptismalHistory] Erro ao carregar:', error);
      toast.error('Erro ao carregar histórico de atas batismais');
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
      const results = await searchBaptismalRecordsByDateInCloud(searchDate);
      setFilteredRecords(results);
      if (results.length === 0) {
        toast.info('Nenhuma ata batismal encontrada para esta data');
      }
    } catch (error) {
      toast.error('Erro ao buscar ata');
      console.error(error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta ata batismal? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteBaptismalRecordFromCloud(id);
      toast.success('✅ Ata batismal deletada com sucesso', {
        duration: 2000,
      });
      await loadRecords();
    } catch (error) {
      toast.error('❌ Erro ao deletar ata batismal');
      console.error(error);
    }
  };

  const handleDownloadRecord = async (record: BaptismalRecord) => {
    try {
      toast.info('📄 Gerando PDF...', { duration: 2000 });
      
      // Criar elemento temporário com o conteúdo da ata
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      
      tempDiv.innerHTML = `
        <div style="font-family: 'Poppins', sans-serif; padding: 40px; background: white;">
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #1e8b9f;">
            <h1 style="font-family: 'Playfair Display', serif; color: #1e8b9f; font-size: 36px; margin-bottom: 10px;">Ata de Serviço Batismal</h1>
            <p style="color: #16a085; font-size: 20px; margin-bottom: 10px;">A Igreja de Jesus Cristo dos Santos dos Últimos Dias</p>
            <p style="color: #1e8b9f; font-size: 18px; opacity: 0.8;">${formatDate(record.date)}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e8b9f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #16a085; padding-bottom: 10px;">◦ Presidência e Direção</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Presidida por:</strong> ${record.presidedBy || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Dirigida por:</strong> ${record.directedBy || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Pianista:</strong> ${record.pianist || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Regente:</strong> ${record.conductor || '—'}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e8b9f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #16a085; padding-bottom: 10px;">◦ Abertura</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Hino de Abertura:</strong> ${record.openingHymn || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Oração de Abertura:</strong> ${record.openingPrayer || '—'}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e8b9f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #16a085; padding-bottom: 10px;">◦ Programa</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Testemunho:</strong> ${record.testimony || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Mensagem:</strong> ${record.message || '—'}</p>
              ${record.specialPresentation ? `<p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Apresentação Especial:</strong> ${record.specialPresentation}</p>` : ''}
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e8b9f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #16a085; padding-bottom: 10px;">◦ Ordenança Batismal</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Pessoa Batizada:</strong> ${record.personBeingBaptized || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Oficiante do Batismo:</strong> ${record.personPerformingBaptism || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Local do Batismo:</strong> ${record.baptismLocation === 'baptism-room' ? 'Sala de Batismo' : 'Mesma Sala da Reunião'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Primeira Testemunha:</strong> ${record.witnesses[0] || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Segunda Testemunha:</strong> ${record.witnesses[1] || '—'}</p>
            </div>
          </div>
          
          ${record.welcomeOrganizations && record.welcomeOrganizations.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e8b9f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #16a085; padding-bottom: 10px;">◦ Boas-vindas das Organizações</h3>
            <div style="margin-left: 20px;">
              ${record.welcomeOrganizations.map((org: any) => `
                <div style="margin-bottom: 15px; padding: 15px; background: #e0f2f7; border-radius: 8px;">
                  <p style="margin-bottom: 5px;"><strong style="color: #1e8b9f;">Organização:</strong> ${org.organizationName || '—'}</p>
                  <p><strong style="color: #1e8b9f;">Boas-vindas dada por:</strong> ${org.welcomeGivenBy || '—'}</p>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e8b9f; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #16a085; padding-bottom: 10px;">◦ Encerramento</h3>
            <div style="margin-left: 20px;">
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Hino de Encerramento:</strong> ${record.closingHymn || '—'}</p>
              <p style="margin-bottom: 10px;"><strong style="color: #1e8b9f;">Oração de Encerramento:</strong> ${record.closingPrayer || '—'}</p>
            </div>
          </div>
          
          <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #16a085; text-align: center; font-size: 12px; color: #1e8b9f; opacity: 0.7;">
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            <p style="margin-top: 10px;">Sistema de Atas - Ala Casa Grande</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Gerar PDF
      const { generatePDF } = await import('@/lib/utils');
      const filename = `ata-batismal-${record.date.replace(/\//g, '-')}.pdf`;
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
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2f7] to-[#b2ebf2]">
      {/* Header com tema batismal */}
      <div className="bg-gradient-to-r from-[#1e8b9f] via-[#16a085] to-[#1e8b9f] shadow-xl">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setLocation('/')}
              className="bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Menu
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white flex items-center justify-center">
              <Droplets size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white font-['Playfair_Display']">
                Histórico de Batismos
              </h1>
              <p className="text-white/90 mt-1 font-['Poppins']">
                Consulte e gerencie atas batismais anteriores
              </p>
            </div>
          </div>
          
          <div className="h-1 w-32 bg-gradient-to-r from-white to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Busca */}
        <div className="mb-8 p-6 bg-white border-l-4 border-[#16a085] rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-[#1e8b9f] mb-4 flex items-center gap-2 font-['Poppins']">
            <Search size={20} className="text-[#16a085]" />
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
                className="bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
              >
                <Search size={18} />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setSearchDate('');
                  setFilteredRecords(records);
                }}
                className="bg-white border-2 border-[#16a085] text-[#1e8b9f] hover:bg-[#16a085] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Atas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#1e8b9f] font-['Poppins']">Carregando atas batismais...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white border-l-4 border-[#16a085] rounded-lg shadow-md">
            <Droplets size={48} className="mx-auto text-[#16a085] mb-4" />
            <p className="text-[#1e8b9f] text-lg font-semibold font-['Poppins']">Nenhuma ata batismal encontrada</p>
            <p className="text-[#1e8b9f]/70 text-sm mt-2 font-['Poppins']">
              Crie sua primeira ata clicando no botão "Menu"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-6 bg-white border-l-4 border-[#16a085] rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <h3 className="text-xl font-bold text-[#1e8b9f] mb-2 font-['Playfair_Display']">
                      {formatDate(record.date)}
                    </h3>
                    <div className="text-sm text-[#1e8b9f]/80 space-y-1 font-['Poppins']">
                      <p>
                        <span className="font-semibold text-[#1e8b9f]">Presidida por:</span> {record.presidedBy}
                      </p>
                      {record.directedBy && (
                        <p>
                          <span className="font-semibold text-[#1e8b9f]">Dirigida por:</span> {record.directedBy}
                        </p>
                      )}
                      {record.personBeingBaptized && (
                        <p>
                          <span className="font-semibold text-[#1e8b9f]">Batizado(a):</span> {record.personBeingBaptized}
                        </p>
                      )}
                      {record.baptismLocation && (
                        <p>
                          <span className="font-semibold text-[#1e8b9f]">Local:</span>{' '}
                          {record.baptismLocation === 'same-room' ? 'Mesma Sala' : 'Sala Batismal'}
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
                      className="bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
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
          <div className="mt-8 p-6 bg-white border-l-4 border-[#16a085] rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-[#1e8b9f] mb-4 font-['Poppins']">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-[#1e8b9f]/10 to-[#16a085]/10 rounded-lg">
                <p className="text-3xl font-bold text-[#1e8b9f] font-['Playfair_Display']">{records.length}</p>
                <p className="text-sm text-[#1e8b9f]/70 font-['Poppins']">Total de Atas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-[#1e8b9f]/10 to-[#16a085]/10 rounded-lg">
                <p className="text-3xl font-bold text-[#1e8b9f] font-['Playfair_Display']">
                  {records.filter((r) => r.status === 'completed').length}
                </p>
                <p className="text-sm text-[#1e8b9f]/70 font-['Poppins']">Completas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-[#1e8b9f]/10 to-[#16a085]/10 rounded-lg">
                <p className="text-3xl font-bold text-[#1e8b9f] font-['Playfair_Display']">
                  {records.filter((r) => r.status === 'draft').length}
                </p>
                <p className="text-sm text-[#1e8b9f]/70 font-['Poppins']">Rascunhos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
