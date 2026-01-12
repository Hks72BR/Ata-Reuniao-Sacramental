/**
 * Página de Histórico - Consulta de Atas de Conselho de Ala Anteriores
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { DeletePinModal } from '@/components/DeletePinModal';
import { WardCouncilRecord } from '@/types';
import { Eye, Trash2, Search, FileText, ArrowLeft, Edit, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { 
  getAllWardCouncilRecordsFromCloud, 
  deleteWardCouncilRecordFromCloud
} from '@/lib/wardCouncilFirestore';

export default function WardCouncilHistory() {
  const [records, setRecords] = useState<WardCouncilRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<WardCouncilRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeletePinModal, setShowDeletePinModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [recordToDeleteDate, setRecordToDeleteDate] = useState<string>('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY)) {
      setLocation('/');
      return;
    }
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('[WardCouncilHistory] Carregando atas de conselho...');
      const allRecords = await getAllWardCouncilRecordsFromCloud();
      console.log('[WardCouncilHistory] Atas carregadas:', allRecords.length);
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      if (allRecords.length === 0) {
        toast.info('Nenhuma ata de conselho encontrada. Crie a primeira!');
      }
    } catch (error) {
      console.error('[WardCouncilHistory] Erro ao carregar:', error);
      toast.error('Erro ao carregar histórico de atas de conselho');
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
        record.directedBy?.toLowerCase().includes(searchLower) ||
        Object.values(record.organizationMatters).some(matter => 
          matter?.toLowerCase().includes(searchLower)
        )
      );
    });

    setFilteredRecords(filtered);
    if (filtered.length === 0) {
      toast.info('Nenhuma ata encontrada com este termo de busca');
    }
  };

  const handleViewRecord = (record: WardCouncilRecord) => {
    setLocation(`/wardcouncil/view/${record.id}`);
  };

  const handleEditRecord = (record: WardCouncilRecord) => {
    // Salvar ata no localStorage para edição
    localStorage.setItem('wardCouncilRecord', JSON.stringify(record));
    setLocation('/wardcouncil');
    toast.info('📝 Ata carregada para edição');
  };

  const handleDeleteRecord = (record: WardCouncilRecord) => {
    setRecordToDelete(record.id!);
    setRecordToDeleteDate(formatDate(record.date));
    setShowDeletePinModal(true);
  };

  const handleDeletePinSuccess = async () => {
    setShowDeletePinModal(false);
    
    if (!recordToDelete) return;

    try {
      await deleteWardCouncilRecordFromCloud(recordToDelete);
      toast.success('✅ Ata de conselho deletada com sucesso', {
        duration: 2000,
      });
      setRecordToDelete(null);
      setRecordToDeleteDate('');
      await loadRecords();
    } catch (error) {
      toast.error('❌ Erro ao deletar ata de conselho');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f5257] via-[#0d6270] to-[#0a7180] shadow-2xl border-b border-teal-600/30">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setLocation('/wardcouncil')}
              className="bg-white border-2 border-teal-600 text-teal-800 hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Menu
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-amber-400 flex items-center justify-center">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white font-['Playfair_Display']">
                Histórico de Conselhos
              </h1>
              <p className="text-white/90 mt-1 font-['Poppins']">
                Consulte e gerencie atas de conselho de ala anteriores
              </p>
            </div>
          </div>
          
          <div className="h-1 w-32 bg-gradient-to-r from-amber-400 to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Busca */}
        <div className="mb-8 p-6 bg-white/90 backdrop-blur-sm border-l-4 border-amber-500 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2 font-['Poppins']">
            <Search size={20} className="text-amber-500" />
            Buscar Atas
          </h3>
          <div className="flex gap-4 flex-wrap">
            <InputField
              type="text"
              label="Buscar por data, líder ou assunto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[250px]"
              placeholder="Digite para buscar..."
            />
            <div className="flex gap-2 items-end">
              <Button 
                onClick={handleSearch} 
                className="bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
              >
                <Search size={18} />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilteredRecords(records);
                }}
                className="bg-white border-2 border-amber-500 text-teal-800 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
            <p className="mt-4 text-teal-800 font-['Poppins']">Carregando histórico...</p>
          </div>
        )}

        {/* Lista de Atas */}
        {!loading && filteredRecords.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 font-['Playfair_Display']">
              Total: {filteredRecords.length} {filteredRecords.length === 1 ? 'ata' : 'atas'}
            </h2>
            
            {filteredRecords.map((record) => {
              const totalActions = record.actionItems.length;
              const completedActions = record.actionItems.filter(a => a.completed).length;
              
              return (
              <div 
                key={record.id} 
                className="p-6 bg-white/90 backdrop-blur-sm border-l-4 border-amber-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-teal-800 mb-2 font-['Playfair_Display'] flex items-center gap-2">
                      <FileText className="w-6 h-6 text-amber-500" />
                      Conselho de {formatDate(record.date)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700 font-['Poppins']">
                      <p><strong className="text-teal-700">Presidido por:</strong> {record.presidedBy}</p>
                      <p><strong className="text-teal-700">Dirigido por:</strong> {record.directedBy}</p>
                      
                      {/* Progresso de Ações */}
                      {totalActions > 0 && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-teal-800 flex items-center gap-1">
                              <CheckCircle2 size={14} />
                              Itens de Ação
                            </span>
                            <span className="text-xs font-bold text-teal-600">
                              {completedActions}/{totalActions} concluídos
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Preview das organizações com assuntos */}
                      <div className="mt-3 space-y-1">
                        {Object.entries(record.organizationMatters).map(([org, matters]) => {
                          if (!matters) return null;
                          const orgNames: { [key: string]: string } = {
                            rapazes: '👔 Rapazes',
                            mocas: '🌸 Moças',
                            socorro: '💐 Socorro',
                            elderes: '📖 Elderes',
                            missionaria: '🌍 Missionária',
                            primaria: '🎨 Primária'
                          };
                          return (
                            <p key={org} className="text-xs text-gray-600">
                              <strong className="text-teal-600">{orgNames[org]}:</strong> {matters.substring(0, 60)}
                              {matters.length > 60 ? '...' : ''}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => handleViewRecord(record)}
                    className="bg-white border-2 border-teal-600 text-teal-800 hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                  >
                    <Eye size={18} />
                    Visualizar
                  </Button>
                  <Button
                    onClick={() => handleEditRecord(record)}
                    className="bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDeleteRecord(record)}
                    className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Deletar
                  </Button>
                </div>
              </div>
            )})}
            
            {filteredRecords.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText size={64} className="mx-auto text-teal-300 mb-4" />
                <p className="text-teal-700 text-lg">Nenhuma ata de conselho encontrada</p>
                <Button
                  onClick={() => setLocation('/wardcouncil')}
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Criar primeira ata
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete PIN Modal */}
      <DeletePinModal
        isOpen={showDeletePinModal}
        onClose={() => {
          setShowDeletePinModal(false);
          setRecordToDelete(null);
          setRecordToDeleteDate('');
        }}
        onSuccess={handleDeletePinSuccess}
        recordDate={recordToDeleteDate}
      />
    </div>
  );
}
