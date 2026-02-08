/**
 * Página de Histórico - Entrevistas do Bispado
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { DeletePinModal } from '@/components/DeletePinModal';
import { InterviewRecord } from '@/types';
import { Eye, Trash2, Search, Calendar, ArrowLeft, Edit, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { formatDate } from '@/lib/utils';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { 
  getAllInterviewRecordsFromCloud, 
  deleteInterviewRecordFromCloud
} from '@/lib/interviewsFirestore';

export default function BishopricInterviewsHistory() {
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InterviewRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeletePinModal, setShowDeletePinModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [recordToDeleteDate, setRecordToDeleteDate] = useState<string>('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }
    loadRecords();
  }, [setLocation]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('[InterviewsHistory] Carregando registros de entrevistas...');
      const allRecords = await getAllInterviewRecordsFromCloud();
      console.log('[InterviewsHistory] Registros carregados:', allRecords.length);
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      if (allRecords.length === 0) {
        toast.info('Nenhum registro de entrevistas encontrado. Crie o primeiro!');
      }
    } catch (error) {
      console.error('[InterviewsHistory] Erro ao carregar:', error);
      toast.error('Erro ao carregar histórico de entrevistas');
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
        record.scheduledBy?.toLowerCase().includes(searchLower) ||
        record.interviews?.some(interview => 
          interview.personName?.toLowerCase().includes(searchLower) ||
          interview.responsibleMember?.toLowerCase().includes(searchLower)
        )
      );
    });

    setFilteredRecords(filtered);
    if (filtered.length === 0) {
      toast.info('Nenhum registro encontrado com este termo de busca');
    }
  };

  const handleEditRecord = (record: InterviewRecord) => {
    localStorage.setItem('interviewRecord', JSON.stringify(record));
    setLocation('/bishopric/interviews');
    toast.info('📝 Registro carregado para edição');
  };

  const handleDeleteRecord = (record: InterviewRecord) => {
    setRecordToDelete(record.id!);
    setRecordToDeleteDate(formatDate(record.date));
    setShowDeletePinModal(true);
  };

  const handleDeletePinSuccess = async () => {
    setShowDeletePinModal(false);
    
    if (!recordToDelete) return;

    try {
      await deleteInterviewRecordFromCloud(recordToDelete);
      toast.success('🗑️ Registro de entrevistas excluído com sucesso!');
      
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete));
      setFilteredRecords((prev) => prev.filter((r) => r.id !== recordToDelete));
      setRecordToDelete(null);
      setRecordToDeleteDate('');
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro de entrevistas');
    }
  };

  const handleDeletePinCancel = () => {
    setShowDeletePinModal(false);
    setRecordToDelete(null);
    setRecordToDeleteDate('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative w-full bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#2c3e50] py-16 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(52, 73, 94, 0.4) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border-2 border-[#3498db] flex items-center justify-center shadow-xl">
              <span className="text-5xl">📅</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 font-['Playfair_Display']">
            Histórico de Entrevistas
          </h1>
          <p className="text-xl text-white/90 font-['Poppins']">
            Consulte registros anteriores
          </p>
        </div>
      </div>

      {/* Container Principal */}
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Botões de Ação */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            onClick={() => setLocation('/bishopric/interviews')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Voltar
          </Button>
        </div>

        {/* Busca */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-l-4 border-[#3498db]">
          <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair flex items-center gap-2">
            <Search size={24} />
            Buscar Registros
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <InputField
                type="text"
                label=""
                placeholder="Buscar por data, pessoa, responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-[#3498db] text-white hover:bg-[#2980b9] transition-all h-10 px-6"
            >
              <Search size={18} className="mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Lista de Registros */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498db]"></div>
            <p className="mt-4 text-gray-600">Carregando registros...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum registro encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Tente outro termo de busca' : 'Crie seu primeiro registro de entrevistas'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const totalInterviews = record.interviews?.length || 0;
              const completedInterviews = record.interviews?.filter(i => i.completed).length || 0;
              const progressPercent = totalInterviews > 0 
                ? Math.round((completedInterviews / totalInterviews) * 100) 
                : 0;

              return (
                <div
                  key={record.id}
                  className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#3498db] hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar size={20} className="text-[#3498db]" />
                        <h3 className="text-xl font-bold text-[#34495e]">
                          {formatDate(record.date)}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Agendado por:</strong> {record.scheduledBy}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditRecord(record)}
                        className="bg-[#3498db] text-white hover:bg-[#2980b9] transition-all"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRecord(record)}
                        className="bg-red-500 text-white hover:bg-red-600 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-[#3498db]">{totalInterviews}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{completedInterviews}</div>
                      <div className="text-xs text-gray-600">Concluídas</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{totalInterviews - completedInterviews}</div>
                      <div className="text-xs text-gray-600">Pendentes</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{progressPercent}%</div>
                      <div className="text-xs text-gray-600">Progresso</div>
                    </div>
                  </div>

                  {/* Lista de Entrevistas */}
                  {record.interviews && record.interviews.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Users size={16} />
                        Entrevistas Agendadas ({record.interviews.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {record.interviews.slice(0, 5).map((interview) => (
                          <div 
                            key={interview.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              interview.completed ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {interview.completed ? (
                                <CheckCircle2 size={16} className="text-green-600" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                              )}
                              <span className="font-medium text-sm">{interview.personName}</span>
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                              {interview.responsibleMember && (
                                <span className="bg-[#3498db]/10 px-2 py-1 rounded">
                                  {interview.responsibleMember}
                                </span>
                              )}
                              <span>{formatDate(interview.scheduledDate)}</span>
                              <span>{interview.scheduledTime}</span>
                            </div>
                          </div>
                        ))}
                        {record.interviews.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{record.interviews.length - 5} mais entrevistas
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Exclusão com PIN */}
      {showDeletePinModal && (
        <DeletePinModal
          onSuccess={handleDeletePinSuccess}
          onCancel={handleDeletePinCancel}
          recordDate={recordToDeleteDate}
        />
      )}
    </div>
  );
}
