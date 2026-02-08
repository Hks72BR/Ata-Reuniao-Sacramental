/**
 * Página de Entrevistas - Bispado
 * Sistema de agendamento de entrevistas para secretários
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { InterviewRecord, InterviewItem, INTERVIEW_RECORD_INITIAL } from '@/types';
import { ArrowLeft, Save, Plus, X, Check, Calendar, Users, History } from 'lucide-react';
import { toast } from 'sonner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useLocation } from 'wouter';
import { isAuthenticated, AUTH_CONFIG } from '@/lib/auth';
import { saveInterviewRecordToCloud } from '@/lib/interviewsFirestore';
import { MEMBERS_LIST_SORTED, BISHOPRIC_MEMBERS } from '@/data/members';

export default function BishopricInterviews() {
  const [record, setRecord] = useState<InterviewRecord>(INTERVIEW_RECORD_INITIAL as InterviewRecord);
  const [members] = useState<string[]>(MEMBERS_LIST_SORTED);
  const [, setLocation] = useLocation();
  const { isOnline } = useServiceWorker();
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY)) {
      setLocation('/');
      return;
    }
    // Carregar registro salvo
    const savedRecord = localStorage.getItem('interviewRecord');
    if (savedRecord) {
      try {
        const parsed = JSON.parse(savedRecord);
        setRecord(parsed);
        toast.success('Registro de entrevistas carregado', { 
          duration: 2000, 
          className: 'toast-success-bishopric' 
        });
      } catch (error) {
        console.error('Erro ao carregar registro:', error);
      }
    }
  }, [setLocation]);

  const handleInputChange = (field: keyof InterviewRecord, value: any) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
  };

  const addInterview = (personName?: string) => {
    const name = personName || selectedMember;
    if (!name) {
      toast.error('Selecione uma pessoa ou digite um nome');
      return;
    }

    const newInterview: InterviewItem = {
      id: Date.now().toString(),
      personName: name,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      responsibleMember: '',
      completed: false,
      notes: '',
    };

    setRecord((prev) => ({
      ...prev,
      interviews: [...prev.interviews, newInterview],
    }));

    setSelectedMember('');
    setSearchTerm('');
  };

  const updateInterview = (id: string, field: keyof InterviewItem, value: any) => {
    setRecord((prev) => ({
      ...prev,
      interviews: prev.interviews.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeInterview = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      interviews: prev.interviews.filter((item) => item.id !== id),
    }));
  };

  const toggleInterviewCompleted = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      interviews: prev.interviews.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleSave = async () => {
    try {
      if (!record.date) {
        toast.error('Data é obrigatória');
        return;
      }
      if (!record.scheduledBy) {
        toast.error('Informe quem está agendando');
        return;
      }

      const recordToSave: InterviewRecord = {
        ...record,
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedId = await saveInterviewRecordToCloud(recordToSave);
      
      toast.success('✅ ENTREVISTAS SALVAS COM SUCESSO!', {
        duration: 4000,
        className: 'toast-success-bishopric',
        style: {
          background: '#10b981',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });

      if (!record.id || !record.id.startsWith('interview-')) {
        setRecord({ ...recordToSave, id: savedId });
      }

      localStorage.removeItem('interviewRecord');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('❌ Erro ao salvar registro de entrevistas');
    }
  };

  const handleNewRecord = () => {
    if (confirm('Deseja criar um novo registro? Os dados atuais serão perdidos se não forem salvos.')) {
      setRecord(INTERVIEW_RECORD_INITIAL as InterviewRecord);
      localStorage.removeItem('interviewRecord');
      toast.success('Novo registro criado', { className: 'toast-success-bishopric' });
    }
  };

  // Agrupar entrevistas por data
  const groupedInterviews = record.interviews.reduce((acc, interview) => {
    const date = interview.scheduledDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(interview);
    return acc;
  }, {} as Record<string, InterviewItem[]>);

  const sortedDates = Object.keys(groupedInterviews).sort();

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
            Entrevistas do Bispado
          </h1>
          <p className="text-xl text-white/90 font-['Poppins']">
            Agendamento e Acompanhamento
          </p>
        </div>
      </div>

      {/* Container Principal */}
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Status Online */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            onClick={() => setLocation('/bishopric')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Voltar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Save size={18} />
            Salvar
          </Button>
          <Button
            onClick={() => setLocation('/bishopric/interviews/history')}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#34495e] text-[#34495e] hover:bg-[#34495e] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <History size={18} />
            Histórico
          </Button>
          <Button
            onClick={handleNewRecord}
            className="flex-1 min-w-[180px] bg-white border-2 border-[#3498db] text-[#34495e] hover:bg-[#3498db] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Novo Registro
          </Button>
        </div>

        {/* Form Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair flex items-center gap-2">
              <Calendar size={24} />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                type="date"
                label="Data do Registro"
                value={record.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
              <InputField
                label="Agendado por"
                value={record.scheduledBy}
                onChange={(e) => handleInputChange('scheduledBy', e.target.value)}
                placeholder="Secretário da Ala ou Secretário Executivo"
                required
              />
            </div>
          </div>

          {/* Adicionar Entrevista */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair flex items-center gap-2">
              <Users size={24} />
              Adicionar Entrevista
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecione uma pessoa da lista de membros ({members.length} membros)
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar membro..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                  />
                  {searchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {members
                        .filter((member) =>
                          member.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((member) => (
                          <button
                            key={member}
                            onClick={() => {
                              setSelectedMember(member);
                              setSearchTerm(member);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-[#3498db] hover:text-white transition-colors"
                          >
                            {member}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => addInterview()}
                  className="bg-[#3498db] text-white hover:bg-[#2980b9] transition-all"
                >
                  <Plus size={18} />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="h-px flex-1 bg-gray-300"></span>
                <span>ou</span>
                <span className="h-px flex-1 bg-gray-300"></span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite o nome da pessoa..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        addInterview(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Calendário de Entrevistas */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#3498db] shadow-md">
            <h3 className="text-xl font-bold text-[#34495e] mb-4 font-playfair flex items-center gap-2">
              <Calendar size={24} />
              Entrevistas Agendadas
            </h3>
            
            {record.interviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-2 opacity-30" />
                <p>Nenhuma entrevista agendada</p>
                <p className="text-sm">Adicione pessoas da lista acima</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date} className="border-b pb-4 last:border-b-0">
                    <h4 className="font-semibold text-[#34495e] mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-[#3498db]" />
                      {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h4>
                    
                    <div className="space-y-3 ml-6">
                      {groupedInterviews[date]
                        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                        .map((interview) => (
                          <div
                            key={interview.id}
                            className={`border rounded-lg p-4 transition-all ${
                              interview.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleInterviewCompleted(interview.id)}
                                className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                  interview.completed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'bg-white border-gray-300 hover:border-[#3498db]'
                                }`}
                              >
                                {interview.completed && <Check size={16} />}
                              </button>
                              
                              <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                                  <div>
                                    <label className="text-xs text-gray-600 block mb-1">Nome</label>
                                    <input
                                      type="text"
                                      value={interview.personName}
                                      onChange={(e) =>
                                        updateInterview(interview.id, 'personName', e.target.value)
                                      }
                                      className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 block mb-1">Responsável</label>
                                    <select
                                      value={interview.responsibleMember || ''}
                                      onChange={(e) =>
                                        updateInterview(interview.id, 'responsibleMember', e.target.value)
                                      }
                                      className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                                    >
                                      <option value="">Selecione...</option>
                                      {BISHOPRIC_MEMBERS.map((member) => (
                                        <option key={member} value={member}>
                                          {member}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 block mb-1">Data</label>
                                    <input
                                      type="date"
                                      value={interview.scheduledDate}
                                      onChange={(e) =>
                                        updateInterview(interview.id, 'scheduledDate', e.target.value)
                                      }
                                      className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 block mb-1">Horário</label>
                                    <input
                                      type="time"
                                      value={interview.scheduledTime}
                                      onChange={(e) =>
                                        updateInterview(interview.id, 'scheduledTime', e.target.value)
                                      }
                                      className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-600 block mb-1">Observações</label>
                                  <textarea
                                    value={interview.notes || ''}
                                    onChange={(e) =>
                                      updateInterview(interview.id, 'notes', e.target.value)
                                    }
                                    placeholder="Adicione observações sobre a entrevista..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3498db]"
                                    rows={2}
                                  />
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeInterview(interview.id)}
                                className="mt-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-all"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo */}
          {record.interviews.length > 0 && (
            <div className="bg-gradient-to-r from-[#3498db]/10 to-[#2c3e50]/10 p-6 rounded-xl border border-[#3498db]/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#34495e]">
                    {record.interviews.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {record.interviews.filter((i) => i.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Concluídas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {record.interviews.filter((i) => !i.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#3498db]">
                    {Math.round(
                      (record.interviews.filter((i) => i.completed).length /
                        record.interviews.length) *
                        100
                    )}%
                  </div>
                  <div className="text-sm text-gray-600">Progresso</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
