/**
 * Seção de Ordenanças - Confirmações e Apresentações de Crianças
 */

import { Button } from '@/components/ui/button';
import { InputField } from '@/components/FormField';
import { OrdinanceItem } from '@/types';
import { Plus, X } from 'lucide-react';

interface OrdinancesSectionProps {
  items: OrdinanceItem[];
  onItemsChange: (items: OrdinanceItem[]) => void;
  errors?: { [key: string]: string };
  showChildBlessing?: boolean; // Se true, mostra opção de apresentação de criança
}

export function OrdinancesSection({ items, onItemsChange, errors, showChildBlessing = true }: OrdinancesSectionProps) {
  const addOrdinance = (type: 'confirmation' | 'child-blessing') => {
    const newOrdinance: OrdinanceItem = {
      id: Date.now().toString(),
      type,
      fullName: '',
      performedBy: '',
      notes: '',
    };
    onItemsChange([...items, newOrdinance]);
  };

  const updateOrdinance = (id: string, field: keyof OrdinanceItem, value: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  const removeOrdinance = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const getOrdinanceTypeLabel = (type: 'confirmation' | 'child-blessing') => {
    return type === 'confirmation' ? 'Confirmação de Batismo' : 'Apresentação de Criança';
  };

  return (
    <div className="reverent-card">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2 font-serif">
          Ordenanças
        </h3>
        <p className="text-sm text-gray-600">
          {showChildBlessing 
            ? 'Registre confirmações de batismo e apresentações de crianças realizadas durante a reunião'
            : 'Registre confirmações de batismo realizadas durante o serviço'}
        </p>
      </div>

      {/* Lista de Ordenanças */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-gradient-to-br from-[#1e3a5f]/5 to-[#d4a574]/5 rounded-lg border-2 border-[#d4a574]/30"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#d4a574] text-white text-xs font-semibold rounded-full">
                  {getOrdinanceTypeLabel(item.type)}
                </span>
              </div>
              <Button
                type="button"
                onClick={() => removeOrdinance(item.id)}
                className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                title="Remover ordenança"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              <InputField
                label={item.type === 'confirmation' ? 'Nome do Confirmado' : 'Nome da Criança'}
                value={item.fullName}
                onChange={(e) => updateOrdinance(item.id, 'fullName', e.target.value)}
                placeholder="Nome completo"
                error={errors?.[`ordinance-${item.id}-fullName`]}
              />
              
              <InputField
                label={item.type === 'confirmation' ? 'Quem Realizou a Confirmação' : 'Quem Abençoou a Criança'}
                value={item.performedBy || ''}
                onChange={(e) => updateOrdinance(item.id, 'performedBy', e.target.value)}
                placeholder="Nome de quem realizou a ordenança"
              />

              <InputField
                label="Observações (opcional)"
                value={item.notes || ''}
                onChange={(e) => updateOrdinance(item.id, 'notes', e.target.value)}
                placeholder="Informações adicionais"
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            Nenhuma ordenança registrada nesta reunião
          </div>
        )}
      </div>

      {/* Botões para Adicionar */}
      <div className="flex gap-3 flex-wrap">
        <Button
          type="button"
          onClick={() => addOrdinance('confirmation')}
          className="flex-1 min-w-[200px] bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
        >
          <Plus size={18} />
          Adicionar Confirmação
        </Button>
        
        {showChildBlessing && (
          <Button
            type="button"
            onClick={() => addOrdinance('child-blessing')}
            className="flex-1 min-w-[200px] bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2 justify-center"
          >
            <Plus size={18} />
            Adicionar Apresentação
          </Button>
        )}
      </div>
    </div>
  );
}
