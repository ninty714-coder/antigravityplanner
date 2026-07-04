import React from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { hexToRgba } from '../../lib/utils';
import type { PlannerTask, TaskStatus } from '../../types';

const COLUMNS: { key: TaskStatus; label: string; icon: keyof typeof Icons }[] = [
  { key: 'todo', label: 'À faire', icon: 'Circle' },
  { key: 'in_progress', label: 'En cours', icon: 'Clock' },
  { key: 'done', label: 'Terminé', icon: 'CheckCircle2' }
];

// A task with no explicit `status` falls back to a status derived from `completed`.
const getStatus = (task: PlannerTask): TaskStatus => task.status || (task.completed ? 'done' : 'todo');

export const KanbanView: React.FC = () => {
  const { tasks, categories, setTaskStatus } = usePlannerStore();
  const { openTaskModal } = useUIStore();

  // Kanban is day-agnostic: show every real (non-recurring-virtual) task once.
  const baseTasks = tasks;

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/task-id');
    if (taskId) setTaskStatus(taskId, status);
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-hidden">
      {COLUMNS.map((col) => {
        const columnTasks = baseTasks.filter(t => getStatus(t) === col.key);
        const ColIcon = Icons[col.icon] as React.ElementType;

        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.key)}
            className="flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/20 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/60">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <ColIcon className="w-4 h-4" />
                {col.label}
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 dark:text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-800">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              {columnTasks.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-600 italic text-center py-6">
                  Glissez une tâche ici
                </div>
              )}
              {columnTasks.map((task) => {
                const category = categories.find(c => c.id === task.categoryId);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)}
                    onClick={() => openTaskModal(task.id, task.dueDate)}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/80 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {category && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: hexToRgba(category.color, 0.12), color: category.color }}
                        >
                          {category.name}
                        </span>
                      )}
                      {(task.tags || []).map(tag => (
                        <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
