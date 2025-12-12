/**
 * Página de Histórico - Consulta de Atas Anteriores
 * Design: Minimalismo Espiritual Contemporâneo
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { getAllRecords, searchRecordsByDate, deleteRecord } from '@/lib/db';
import { SacramentalRecord } from '@/types';
import { Eye, Trash2, Download, Search, Calendar, ArrowLeft } from 'lucide-react';
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
      const allRecords = await getAllRecords();
      setRecords(allRecords);
      setFilteredRecords(allRecords);
    } catch (error) {
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

  const handleViewRecord = (record: SacramentalRecord) => {
    // Navegar para visualização usando ID na URL
    setLocation(`/sacramental/view/${record.id}`);
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

  const handleDownloadRecord = (record: SacramentalRecord) => {
    // Redirecionar para a página de visualização para gerar PDF
    sessionStorage.setItem('viewingRecord', JSON.stringify(record));
    setLocation('/view');
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
                      onClick={() => handleViewRecord(record)}
                      className="bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Ver
                    </Button>
                    <Button
                      onClick={() => handleDownloadRecord(record)}
                      className="bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                    >
                      <Download size={16} />
                      Baixar
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
