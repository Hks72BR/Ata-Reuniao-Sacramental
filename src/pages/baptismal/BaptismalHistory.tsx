/**
 * Página de Histórico Batismal - Consulta de Atas Batismais Anteriores
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { BaptismalRecord } from '@/types';
import { Eye, Trash2, Search, Droplets, ArrowLeft } from 'lucide-react';
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

  const handleViewRecord = (record: BaptismalRecord) => {
    setLocation(`/baptismal/view/${record.id}`);
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
                      onClick={() => handleViewRecord(record)}
                      className="bg-white border-2 border-[#1e8b9f] text-[#1e8b9f] hover:bg-[#1e8b9f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Ver
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
