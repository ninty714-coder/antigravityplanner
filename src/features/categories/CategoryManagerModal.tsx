import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../lib/icons';

export const CategoryManagerModal: React.FC = () => {
  const { categories, addCategory, deleteCategory } = usePlannerStore();
  const { activeModal, closeModal } = useUIStore();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [error, setError] = useState('');

  const isOpen = activeModal === 'category';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }
    setError('');
    await addCategory({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon
    });
    setName('');
  };

  const renderIcon = (iconName: string, color: string, className = "w-4 h-4") => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} style={{ color }} />;
    }
    return <Icons.HelpCircle className={className} style={{ color }} />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Gérer les Catégories"
      size="md"
    >
      <div className="flex flex-col gap-6">
        {/* Existing Categories */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Catégories Existantes
          </h4>
          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {renderIcon(cat.icon, cat.color, "w-4 h-4")}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {cat.name}
                  </span>
                </div>

                {/* Don't allow deleting base categories that are seeded to keep app clean, but allow other deletions */}
                {!['cat-work', 'cat-personal', 'cat-sport', 'cat-health', 'cat-finance'].includes(cat.id) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCategory(cat.id)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs px-2.5 py-1"
                  >
                    Supprimer
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 select-none">
                    Système
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        {/* Create Category Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Créer une Nouvelle Catégorie
          </h4>
          
          <Input
            label="Nom"
            placeholder="Ex: Lecture, Jardinage..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Couleur
            </span>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform active:scale-95 border-2 ${
                    selectedColor === color
                      ? 'border-slate-800 scale-110 dark:border-white'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Icône
            </span>
            <div className="grid grid-cols-6 gap-2 max-h-[180px] overflow-y-auto pr-1">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComponent = (Icons as any)[iconName];
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    type="button"
                    key={iconName}
                    onClick={() => setSelectedIcon(iconName)}
                    className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-slate-100'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/40 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-2.5 mt-2 rounded-xl text-sm"
          >
            Créer la catégorie
          </Button>
        </form>
      </div>
    </Modal>
  );
};
