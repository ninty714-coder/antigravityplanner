import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import type { ChecklistItem, RecurrenceType } from '../../types';

export const TaskModal: React.FC = () => {
  const { categories, tasks, addTask, updateTask, currentDate } = usePlannerStore();
  const { activeModal, selectedTaskId, closeModal } = useUIStore();

  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  
  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Tags state (free-form labels, comma or Enter separated)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const isOpen = activeModal === 'task';

  // Load editing task details if selectedTaskId is set
  useEffect(() => {
    if (isOpen) {
      if (selectedTaskId) {
        // Strip virtual recurrence suffixes if editing from calendar range
        const actualId = selectedTaskId.split('_')[0];
        const task = tasks.find(t => t.id === actualId);
        if (task) {
          setTitle(task.title);
          setCatId(task.categoryId);
          setPriority(task.priority);
          setDueDate(task.dueDate || '');
          setRecurrenceType(task.recurrence?.type || 'none');
          setRecurrenceInterval(task.recurrence?.interval || 1);
          setChecklist(task.checklist || []);
          setTags(task.tags || []);
        }
      } else {
        // Default initial states for creation
        setTitle('');
        setCatId(categories[0]?.id || 'cat-work');
        setPriority('medium');
        const todayStr = currentDate.toISOString().split('T')[0];
        setDueDate(todayStr);
        setRecurrenceType('none');
        setRecurrenceInterval(1);
        setChecklist([]);
        setTags([]);
      }
    }
  }, [isOpen, selectedTaskId, tasks, categories, currentDate]);

  const handleAddSubtask = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    const newItem: ChecklistItem = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false
    };

    setChecklist([...checklist, newItem]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    e?.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean || tags.includes(clean)) {
      setTagInput('');
      return;
    }
    setTags([...tags, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload = {
      title: title.trim(),
      categoryId: catId,
      priority,
      dueDate: dueDate || undefined,
      checklist,
      tags,
      recurrence: {
        type: recurrenceType,
        interval: recurrenceInterval > 0 ? recurrenceInterval : undefined
      },
      order: 1
    };

    if (selectedTaskId) {
      const actualId = selectedTaskId.split('_')[0];
      const existingTask = tasks.find(t => t.id === actualId);
      if (existingTask) {
        await updateTask({
          ...existingTask,
          ...taskPayload
        });
      }
    } else {
      await addTask(taskPayload);
    }
    
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={selectedTaskId ? 'Modifier la Tâche' : 'Créer une Tâche'}
      size="md"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Titre de la tâche"
          placeholder="Ex: Terminer le rapport trimestriel..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Catégorie"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />

          <Select
            label="Priorité"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            options={[
              { value: 'low', label: 'Basse' },
              { value: 'medium', label: 'Moyenne' },
              { value: 'high', label: 'Haute' }
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date d'échéance"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Select
            label="Récurrence"
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value as any)}
            options={[
              { value: 'none', label: 'Aucune' },
              { value: 'daily', label: 'Quotidienne' },
              { value: 'weekly', label: 'Hebdomadaire' },
              { value: 'monthly', label: 'Mensuelle' }
            ]}
          />
        </div>

        {/* Custom interval choice if recurrence is active */}
        {recurrenceType !== 'none' && (
          <Input
            label="Intervalle (Fréquence)"
            type="number"
            min={1}
            value={recurrenceInterval}
            onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
            placeholder="Ex: Répéter toutes les N fois"
          />
        )}

        <hr className="border-slate-100 dark:border-slate-800/80 my-1" />

        {/* Subtask checklist builder */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sous-tâches / Checklist
          </label>

          {/* Current subtasks */}
          {checklist.length > 0 && (
            <div className="flex flex-col gap-2 mb-2 max-h-[140px] overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(item.id)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1 rounded"
                  >
                    <Icons.Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter une sous-tâche..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddSubtask}
              className="px-3"
            >
              <Icons.Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80 my-1" />

        {/* Tags / labels */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Étiquettes
          </label>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--accent-soft)] dark:bg-[var(--accent-soft-dark)] text-[var(--accent)]"
                >
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                    <Icons.X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Ex: urgent, maison..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') handleAddTag(e);
              }}
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={handleAddTag} className="px-3">
              <Icons.Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-2.5 mt-3 rounded-xl text-sm"
        >
          {selectedTaskId ? 'Enregistrer les modifications' : 'Créer la tâche'}
        </Button>
      </form>
    </Modal>
  );
};
