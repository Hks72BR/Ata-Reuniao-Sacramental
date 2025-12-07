import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputField } from './FormField';
import { SupportAndReleaseItem } from '@/types';
import { Trash2, Plus } from 'lucide-react';

interface SupportAndReleaseSectionProps {
  items: SupportAndReleaseItem[];
  onItemsChange: (items: SupportAndReleaseItem[]) => void;
  errors?: { [key: string]: string };
}

export function SupportAndReleaseSection({
  items,
  onItemsChange,
  errors = {},
}: SupportAndReleaseSectionProps) {
  const [newItem, setNewItem] = useState<Partial<SupportAndReleaseItem>>({
    type: 'release',
  });

  const addItem = () => {
    if (!newItem.fullName) {
      return;
    }

    const item: SupportAndReleaseItem = {
      id: Date.now().toString(),
      type: (newItem.type as 'release' | 'support') || 'release',
      fullName: newItem.fullName,
      position: newItem.position,
      callingName: newItem.callingName,
      notes: newItem.notes,
    };

    onItemsChange([...items, item]);
    setNewItem({ type: 'release' });
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const renderItemText = (item: SupportAndReleaseItem) => {
    if (item.type === 'release') {
      return (
        <p className="text-sm text-foreground">
          <span className="font-semibold">{item.fullName}</span> estamos desobrigando o irmão ou irmã
          do chamado <span className="font-semibold">{item.position}</span>, em louvor ao serviço
          prestado por estes irmãos que possamos nos manifestar levantando a mão.
        </p>
      );
    } else {
      return (
        <p className="text-sm text-foreground">
          É proposto que apoiamos o irmão ou irmã{' '}
          <span className="font-semibold">{item.fullName}</span> +{' '}
          <span className="font-semibold">{item.callingName}</span>
        </p>
      );
    }
  };

  return (
    <div className="reverent-card">
      <h3 className="text-2xl font-bold text-foreground mb-6 font-serif">
        Apoio e Desobrigação
      </h3>

      {/* Lista de itens */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-secondary rounded-lg border border-border flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              {renderItemText(item)}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-destructive hover:text-destructive/80 transition-colors"
              title="Remover"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Formulário para adicionar novo item */}
      <div className="border-t border-border pt-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Adicionar Novo Item</h4>

        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Tipo de Item
          </label>
          <select
            value={newItem.type}
            onChange={(e) =>
              setNewItem({ ...newItem, type: e.target.value as 'release' | 'support' })
            }
            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="release">Desobrigação</option>
            <option value="support">Apoio</option>
          </select>
        </div>

        <InputField
          label="Nome Completo"
          required
          value={newItem.fullName || ''}
          onChange={(e) => setNewItem({ ...newItem, fullName: e.target.value })}
          placeholder="Digite o nome completo"
        />

        {newItem.type === 'release' && (
          <InputField
            label="Posição/Cargo"
            value={newItem.position || ''}
            onChange={(e) => setNewItem({ ...newItem, position: e.target.value })}
            placeholder="Digite a posição"
          />
        )}

        {newItem.type === 'support' && (
          <InputField
            label="Nome do Chamado"
            value={newItem.callingName || ''}
            onChange={(e) => setNewItem({ ...newItem, callingName: e.target.value })}
            placeholder="Digite o nome do chamado"
          />
        )}

        <Button
          onClick={addItem}
          disabled={!newItem.fullName}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Adicionar Item
        </Button>
      </div>
    </div>
  );
}
