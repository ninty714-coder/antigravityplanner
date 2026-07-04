import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { TaskItem } from './TaskItem';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { format } from 'date-fns';

export const TaskList: React.FC = () => {
  const { 
    getTasksForDate, 
    addTask, 
    categories, 
    currentDate,
    selectedCategoryId,
    searchQuery,
    scheduleTaskToSlot
  } = usePlannerStore();
  
  const { openTaskModal } = useUIStore();

  const [quickTitle, setQuickTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [catId, setCatId] = useState(categories[0]?.id || 'cat-work');
  const [showCompleted, setShowCompleted] = useState(false);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const tasksForDay = getTasksForDate(currentDate);

  // Apply filters
  const filteredTasks = tasksForDay.filter(task => {
    const matchesCategory = selectedCategoryId ? task.categoryId === selectedCategoryId : true;
    const matchesSearch = searchQuery 
      ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true;
    return matchesCategory && matchesSearch;
  });

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await addTask({
      title: quickTitle.trim(),
      categoryId: catId || categories[0]?.id || 'cat-work',
      priority,
      dueDate: dateStr,
      order: tasksForDay.length + 1,
      checklist: [],
      recurrence: { type: 'none' }
    });

    setQuickTitle('');
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="mb-4 flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ajouter rapidement une tâche pour aujourd'hui..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 border-0 focus:ring-0 !px-2 !py-1.5 bg-transparent shadow-none"
          />
          <Button
            type="submit"
            disabled={!quickTitle.trim()}
            className="w-8 h-8 !p-0 rounded-xl"
            title="Ajouter"
          >
            <Icons.Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick parameters */}
        <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-slate-800/40 pt-2 px-2 text-xs">
          <div className="flex items-center gap-3">
            {/* Category Select */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Icons.FolderDot className="w-3.5 h-3.5" />
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="bg-transparent font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Icons.Flag className="w-3.5 h-3.5" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="bg-transparent font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="low" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">Basse</option>
                <option value="medium" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">Moyenne</option>
                <option value="high" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">Haute</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openTaskModal(null, dateStr)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            Plus d'options
            <Icons.ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Task List Content - also a drop target to un-schedule a task from the calendar timeline */}
      <div
        className="flex-1 overflow-y-auto pr-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const draggedTaskId = e.dataTransfer.getData('text/task-id');
          if (draggedTaskId) {
            scheduleTaskToSlot(draggedTaskId, dateStr, null);
          }
        }}
      >
        {/* Active Tasks */}
        {activeTasks.length > 0 ? (
          <div>
            {activeTasks.map(task => (
              <TaskItem key={task.id} task={task} dateStr={dateStr} />
            ))}
          </div>
        ) : (
          /* Empty State if no active tasks */
          activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900/60 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border border-slate-200/50 dark:border-slate-800">
                <Icons.Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Aucune tâche pour aujourd'hui
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                Profitez de votre journée, ou planifiez de nouvelles tâches ci-dessus !
              </p>
            </div>
          )
        )}

        {/* Collapsible Completed Section */}
        {completedTasks.length > 0 && (
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 transition-colors uppercase tracking-wider mb-3 px-1"
            >
              <Icons.ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
              Tâches terminées ({completedTasks.length})
            </button>

            {showCompleted && (
              <div className="opacity-75">
                {completedTasks.map(task => (
                  <TaskItem key={task.id} task={task} dateStr={dateStr} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
