import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../store/plannerStore';
import { useUIStore } from '../store/uiStore';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SearchModal: React.FC = () => {
  const { tasks, events, categories } = usePlannerStore();
  const { activeModal, closeModal, openTaskModal, openEventModal } = useUIStore();

  const [query, setQuery] = useState('');

  const isOpen = activeModal === 'search';

  // Listen for Cmd+K or Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const uiStore = useUIStore.getState();
        if (uiStore.activeModal === 'search') {
          uiStore.closeModal();
        } else {
          uiStore.openSearchModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear query on open/close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const matches = (text: string) => {
    return text.toLowerCase().includes(query.toLowerCase());
  };

  // Search through all items if query is present
  const matchedTasks = query ? tasks.filter(t => matches(t.title) || (t.notes && matches(t.notes as any))) : [];
  const matchedEvents = query ? events.filter(e => matches(e.title) || (e.location && matches(e.location)) || (e.notes && matches(e.notes))) : [];

  const handleTaskClick = (id: string, dueDate?: string) => {
    closeModal();
    // Pass date if available to prefill
    openTaskModal(id, dueDate || format(new Date(), 'yyyy-MM-dd'));
  };

  const handleEventClick = (id: string, startTime: string) => {
    closeModal();
    openEventModal(id, startTime);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Recherche Globale"
      size="md"
    >
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Rechercher des tâches, des réunions ou des notes... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Icons.Search className="w-4.5 h-4.5 text-slate-400" />}
          autoFocus
        />

        {/* Results */}
        {query ? (
          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
            {/* Events matched */}
            {matchedEvents.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Événements ({matchedEvents.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {matchedEvents.map((event) => {
                    const cat = categories.find(c => c.id === event.categoryId);
                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event.id, event.startTime)}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {event.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {format(parseISO(event.startTime), 'd MMMM yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                        {cat && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color, borderColor: `${cat.color}25` }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tasks matched */}
            {matchedTasks.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Tâches ({matchedTasks.length})
                </h4>
                <div className="flex flex-col gap-2">
                  {matchedTasks.map((task) => {
                    const cat = categories.find(c => c.id === task.categoryId);
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task.id, task.dueDate)}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {task.title}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              Échéance : {format(parseISO(task.dueDate), 'd MMMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                        {cat && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color, borderColor: `${cat.color}25` }}
                          >
                            {cat.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No matches */}
            {matchedEvents.length === 0 && matchedTasks.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 italic">
                Aucun résultat trouvé pour "{query}"
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-slate-500">
            <Icons.Keyboard className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
            <span className="text-xs font-medium">
              Saisissez votre recherche pour afficher les résultats
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};
