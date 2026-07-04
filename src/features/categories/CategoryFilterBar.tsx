import React from 'react';
import { Settings } from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';

export const CategoryFilterBar: React.FC = () => {
  const { categories, selectedCategoryId, setSelectedCategoryId } = usePlannerStore();
  const { openCategoryModal } = useUIStore();

  return (
    <div className="w-full flex items-center justify-between gap-3 py-2 overflow-x-auto no-scrollbar select-none border-b border-slate-100 dark:border-slate-800/80 px-1">
      {/* Filters Container */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Chip
          label="Tous"
          active={selectedCategoryId === null}
          onClick={() => setSelectedCategoryId(null)}
          className="text-xs"
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            color={cat.color}
            active={selectedCategoryId === cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className="text-xs"
          />
        ))}
      </div>

      {/* Settings / Create Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={openCategoryModal}
        className="flex-shrink-0 w-8 h-8 !p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800"
      >
        <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </Button>
    </div>
  );
};
