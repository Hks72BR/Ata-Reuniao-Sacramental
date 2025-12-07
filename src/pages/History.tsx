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
import { formatDate, generateRecordText, downloadTextFile } from '@/lib/utils';

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
    // Salvar o registro selecionado em sessionStorage para visualização
    sessionStorage.setItem('viewingRecord', JSON.stringify(record));
    setLocation('/view');
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta ata? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteRecord(id);
      toast.success('Ata deletada com sucesso');
      await loadRecords();
    } catch (error) {
      toast.error('Erro ao deletar ata');
      console.error(error);
    }
  };

  const handleDownloadRecord = (record: SacramentalRecord) => {
    const content = generateRecordText(record);
    downloadTextFile(content, `ata-sacramental-${record.date}.txt`);
    toast.success('Ata baixada com sucesso');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container max-w-4xl mx-auto py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-foreground font-serif">Histórico de Atas</h1>
          <p className="text-muted-foreground mt-2">Consulte e gerencie atas anteriores</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto py-12">
        {/* Busca */}
        <div className="mb-8 p-6 bg-card border border-border rounded-lg">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Search size={20} />
            Buscar por Data
          </h3>
          <div className="flex gap-4">
            <InputField
              type="date"
              label="Data"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 items-end">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search size={18} />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setSearchDate('');
                  setFilteredRecords(records);
                }}
                variant="outline"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Atas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando atas...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma ata encontrada</p>
            <p className="text-muted-foreground text-sm mt-2">
              Crie sua primeira ata clicando no botão "Voltar"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {formatDate(record.date)}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-semibold">Presidida por:</span> {record.presidedBy}
                      </p>
                      {record.directedBy && (
                        <p>
                          <span className="font-semibold">Dirigida por:</span> {record.directedBy}
                        </p>
                      )}
                      {record.firstSpeaker && (
                        <p>
                          <span className="font-semibold">Oradores:</span> {record.firstSpeaker}
                          {record.secondSpeaker && `, ${record.secondSpeaker}`}
                          {record.lastSpeaker && `, ${record.lastSpeaker}`}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          record.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
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
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Ver
                    </Button>
                    <Button
                      onClick={() => handleDownloadRecord(record)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Baixar
                    </Button>
                    <Button
                      onClick={() => handleDeleteRecord(record.id!)}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
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
          <div className="mt-8 p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-bold text-foreground mb-4">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">{records.length}</p>
                <p className="text-sm text-muted-foreground">Total de Atas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">
                  {records.filter((r) => r.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">
                  {records.filter((r) => r.status === 'draft').length}
                </p>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
