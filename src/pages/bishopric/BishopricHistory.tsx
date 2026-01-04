/**
 * Página de Histórico - Consulta de Atas de Reunião de Bispado Anteriores
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { BishopricRecord } from '@/types';
import { Eye, Trash2, Search, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { 
  getAllBishopricRecordsFromCloud, 
  deleteBishopricRecordFromCloud
} from '@/lib/bishopricFirestore';

export default function BishopricHistory() {
  const [records, setRecords] = useState<BishopricRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BishopricRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('[BishopricHistory] Carregando atas de bispado...');
      const allRecords = await getAllBishopricRecordsFromCloud();
      console.log('[BishopricHistory] Atas carregadas:', allRecords.length);
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      if (allRecords.length === 0) {
        toast.info('Nenhuma ata de bispado encontrada. Crie a primeira!');
      }
    } catch (error) {
      console.error('[BishopricHistory] Erro ao carregar:', error);
      toast.error('Erro ao carregar histórico de atas de bispado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) {
      setFilteredRecords(records);
      return;
    }

    const filtered = records.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.date?.toLowerCase().includes(searchLower) ||
        record.presidedBy?.toLowerCase().includes(searchLower) ||
        record.discussedMatters?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredRecords(filtered);
    if (filtered.length === 0) {
      toast.info('Nenhuma ata encontrada com este termo de busca');
    }
  };

  const handleViewRecord = (record: BishopricRecord) => {
    setLocation(`/bishopric/view/${record.id}`);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta ata de bispado? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteBishopricRecordFromCloud(id);
      toast.success('✅ Ata de bispado deletada com sucesso', {
        duration: 2000,
      });
      await loadRecords();
    } catch (error) {
      toast.error('❌ Erro ao deletar ata de bispado');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c3e50] via-[#34495e] to-[#2c3e50] shadow-xl">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setLocation('/bishopric')}
              className="bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Menu
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white flex items-center justify-center">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white font-['Playfair_Display']">
                Histórico de Reuniões
              </h1>
              <p className="text-white/90 mt-1 font-['Poppins']">
                Consulte e gerencie atas de bispado anteriores
              </p>
            </div>
          </div>
          
          <div className="h-1 w-32 bg-gradient-to-r from-white to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Busca */}
        <div className="mb-8 p-6 bg-white border-l-4 border-[#3498db] rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-[#34495e] mb-4 flex items-center gap-2 font-['Poppins']">
            <Search size={20} className="text-[#3498db]" />
            Buscar Atas
          </h3>
          <div className="flex gap-4 flex-wrap">
            <InputField
              type="text"
              label="Buscar por data ou presidente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para buscar..."
              className="flex-1 min-w-[200px]"
            />
            <div className="flex gap-2 items-end">
              <Button 
                onClick={handleSearch} 
                className="bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
              >
                <Search size={18} />
                Buscar
              </Button>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilteredRecords(records);
                }}
                className="bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3498db] border-t-transparent"></div>
            <p className="mt-4 text-[#34495e] font-['Poppins']">Carregando histórico...</p>
          </div>
        )}

        {/* Lista de Atas */}
        {!loading && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#34495e] mb-6 font-['Playfair_Display']">
              Total: {filteredRecords.length} {filteredRecords.length === 1 ? 'ata' : 'atas'}
            </h2>
            
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className="p-6 bg-white border-l-4 border-[#3498db] rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#34495e] mb-2 font-['Poppins']">
                      📋 Reunião de {formatDate(record.date)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Presidida por:</strong> {record.presidedBy}</p>
                      {record.actionItems.length > 0 && (
                        <p>
                          <strong>Ações:</strong> {record.actionItems.length} {record.actionItems.length === 1 ? 'item' : 'itens'}
                          {' '}({record.actionItems.filter(a => a.completed).length} concluído(s))
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleViewRecord(record)}
                      className="bg-white border-2 border-[#3498db] text-[#3498db] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 px-4 py-2"
                      title="Visualizar ata"
                    >
                      <Eye size={18} />
                      Ver
                    </Button>
                    <Button
                      onClick={() => handleDeleteRecord(record.id!)}
                      className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 px-4 py-2"
                      title="Deletar ata"
                    >
                      <Trash2 size={18} />
                      Deletar
                    </Button>
                  </div>
                </div>

                {record.discussedMatters && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      <strong>Assuntos:</strong> {record.discussedMatters}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {filteredRecords.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500 font-['Poppins']">
                  Nenhuma ata de bispado encontrada
                </p>
                <p className="text-gray-400 mt-2">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando sua primeira ata'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
