import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { PlannerTask, Category } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { cn, hexToRgba } from '../../lib/utils';
import { addDays, format, parseISO } from 'date-fns';

interface TaskItemProps {
  task: PlannerTask;
  dateStr: string; // The active date where this task is rendered (useful for recurring instances)
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, dateStr }) => {
  const { categories, toggleTaskComplete, toggleSubtaskComplete, deleteTask, updateTask, reorderTask } = usePlannerStore();
  const { openTaskModal } = useUIStore();
  const { triggerSuccess, triggerLight } = useHapticFeedback();
  
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const controls = useAnimation();

  // Find category details
  const category = categories.find(c => c.id === task.categoryId);

  // Check completion state
  const isCompleted = task.completed;

  // Render Category Icon dynamically
  const renderCategoryIcon = (cat?: Category) => {
    if (!cat) return null;
    const IconComponent = (Icons as any)[cat.icon];
    if (IconComponent) {
      return <IconComponent className="w-3.5 h-3.5" style={{ color: cat.color }} />;
    }
    return null;
  };

  const handleDragEnd = async (_event: any, info: any) => {
    const swipeThreshold = 100;
    const downThreshold = 70;

    // Whichever axis moved the most decides the gesture (since drag isn't axis-locked,
    // this lets us support left/right AND a distinct down-swipe on the same card).
    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absY > downThreshold && absY > absX && info.offset.y > 0) {
      // Swipe Down -> Snooze / Reporter à demain
      triggerLight();
      await controls.start({ y: 60, opacity: 0.4, transition: { duration: 0.15 } });
      await handleRescheduleTomorrow();
      controls.set({ x: 0, y: 0, opacity: 1 });
      return;
    }

    if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Complete Task
      triggerSuccess();
      setShowBurst(true);
      // Visual feedback: animate off to the right, then toggle
      await controls.start({ x: 400, opacity: 0, transition: { duration: 0.2 } });
      await toggleTaskComplete(task.id, dateStr);
      // Reset position
      controls.set({ x: 0, y: 0, opacity: 1 });
      setIsActionsOpen(false);
      setTimeout(() => setShowBurst(false), 650);
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Open Actions Behind Card
      triggerLight();
      setIsActionsOpen(true);
      controls.start({ x: -120, y: 0 });
    } else {
      // Return to original state
      setIsActionsOpen(false);
      controls.start({ x: 0, y: 0 });
    }
  };

  const handleCloseActions = () => {
    setIsActionsOpen(false);
    controls.start({ x: 0 });
  };

  const handleRescheduleTomorrow = async () => {
    const tomorrow = addDays(parseISO(dateStr), 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    
    // For recurring, we cannot just move the dueDate since that affects the recurrence pattern.
    // Instead we modify the specific occurrence if it were an override, or we can just shift the dueDate for normal tasks.
    const isRecurring = task.recurrence && task.recurrence.type !== 'none';
    if (!isRecurring) {
      await updateTask({
        ...task,
        dueDate: tomorrowStr
      });
      triggerLight();
    }
    handleCloseActions();
  };

  const handleDelete = async () => {
    const isRecurring = task.recurrence && task.recurrence.type !== 'none';
    const confirmDelete = isRecurring 
      ? window.confirm("Voulez-vous supprimer toutes les occurrences de cette tâche récurrente ?") 
      : true;

    if (confirmDelete) {
      await deleteTask(task.id);
      triggerSuccess();
    }
    handleCloseActions();
  };

  const priorityColors = {
    high: 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/10',
    medium: 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/10',
    low: 'border-slate-300 bg-slate-50/30 dark:bg-slate-800/10 dark:border-slate-700'
  };

  const hasChecklist = task.checklist && task.checklist.length > 0;
  const completedChecklistCount = task.checklist?.filter(item => item.completed).length || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl w-full select-none mb-2.5">
      {/* Background Sliders - Behind the card */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
        {/* Left Side: Complete Indicator */}
        <div className="w-1/2 h-full bg-emerald-500 text-white flex items-center pl-6 gap-2">
          <Icons.CheckCircle2 className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-semibold">Terminer</span>
        </div>

        {/* Right Side: Quick Action Drawer */}
        <div className="w-1/2 h-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex items-center justify-end pr-3 gap-2 pointer-events-auto">
          {/* Reschedule Tomorrow (Only for non-recurring) */}
          {task.recurrence?.type === 'none' && (
            <button
              onClick={handleRescheduleTomorrow}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              title="Reporter à demain"
            >
              <Icons.CalendarDays className="w-4 h-4" />
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={() => {
              openTaskModal(task.id, dateStr);
              handleCloseActions();
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            title="Modifier"
          >
            <Icons.Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            title="Supprimer"
          >
            <Icons.Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Card Content - Draggable */}
      <motion.div
        drag
        dragConstraints={{ left: -120, right: 120, top: -60, bottom: 60 }}
        dragElastic={{ left: 0.1, right: 0.8, top: 0.3, bottom: 0.3 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        // Accepts drops from another TaskItem's grip handle to reorder within the day.
        onDragOver={(e: any) => e.preventDefault()}
        onDrop={(e: any) => {
          e.preventDefault();
          const draggedId = e.dataTransfer?.getData('text/task-id');
          if (draggedId && draggedId !== task.id) {
            reorderTask(draggedId, task.id, dateStr);
            triggerLight();
          }
        }}
        className={cn(
          "relative flex flex-col p-4 bg-white dark:bg-slate-900 border-l-4 shadow-sm border border-slate-200/80 dark:border-slate-800/80 rounded-2xl z-10 transition-shadow hover:shadow-md",
          priorityColors[task.priority],
          isCompleted && "bg-slate-50/80 border-slate-300 dark:bg-slate-950/40 dark:border-slate-800"
        )}
      >
        {/* Completion burst effect */}
        {showBurst && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20 bg-emerald-400"
            initial={{ opacity: 0.55, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
        <div className="flex items-start justify-between gap-3">
          {/* Left Checkbox & Title */}
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => {
                triggerLight();
                toggleTaskComplete(task.id, dateStr);
              }}
              className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:text-slate-600 dark:hover:text-indigo-400 flex-shrink-0 transition-colors focus:outline-none"
            >
              {isCompleted ? (
                <Icons.CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
              ) : (
                <Icons.Circle className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "text-sm font-semibold text-slate-800 dark:text-slate-100 block break-words",
                  isCompleted && "line-through text-slate-400 dark:text-slate-500 font-normal"
                )}
              >
                {task.title}
              </span>

              {/* Badges / Labels Row */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Category tag */}
                {category && (
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                    style={{ 
                      backgroundColor: hexToRgba(category.color, 0.12),
                      color: category.color,
                      borderColor: hexToRgba(category.color, 0.2)
                    }}
                  >
                    {renderCategoryIcon(category)}
                    {category.name}
                  </span>
                )}

                {/* Recurrence Indicator */}
                {task.recurrence && task.recurrence.type !== 'none' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-800">
                    <Icons.RefreshCw className="w-2.5 h-2.5" />
                    Réc. ({task.recurrence.type === 'weekly' ? 'Hebdo' : task.recurrence.type === 'daily' ? 'Quotidien' : 'Mensuel'})
                  </span>
                )}

                {/* Checklist Indicator */}
                {hasChecklist && (
                  <button
                    onClick={() => setShowChecklist(!showChecklist)}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800/80 transition-colors"
                  >
                    <Icons.CheckSquare className="w-2.5 h-2.5" />
                    {completedChecklistCount}/{task.checklist.length}
                    <Icons.ChevronDown className={cn("w-2.5 h-2.5 transition-transform", showChecklist && "rotate-180")} />
                  </button>
                )}

                {/* Time slot indicator if dragged to calendar */}
                {task.timeSlot && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] font-semibold bg-[var(--accent-soft)] dark:bg-[var(--accent-soft-dark)] px-2 py-0.5 rounded-md border border-transparent">
                    <Icons.Clock className="w-2.5 h-2.5" />
                    {task.timeSlot.startTime} - {task.timeSlot.endTime}
                  </span>
                )}

                {/* Tags */}
                {(task.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            {/* Drag handle: native HTML5 drag to schedule this task onto a calendar
                hour slot in DayView, or to reorder it against another task.
                onPointerDown stops propagation so Framer Motion's swipe drag
                (on the parent card) doesn't hijack the gesture. */}
            <div
              draggable
              onPointerDown={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/task-id', task.id);
                e.dataTransfer.setData('text/task-date', dateStr);
                e.dataTransfer.effectAllowed = 'move';
              }}
              title="Glisser pour planifier ou réorganiser"
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-700 dark:hover:text-slate-400 w-8 h-6 flex items-center justify-center touch-none"
            >
              <Icons.GripVertical className="w-4 h-4" />
            </div>

            {/* Right Action Menu Toggle (Mobile convenience tap) */}
            <button
              onClick={() => {
                triggerLight();
                setIsActionsOpen(!isActionsOpen);
                controls.start({ x: isActionsOpen ? 0 : -120 });
              }}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-55 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Icons.MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtask Checklist Expansion */}
        {hasChecklist && showChecklist && (
          <div className="mt-3.5 pl-8 border-t border-slate-100 dark:border-slate-800/60 pt-3 flex flex-col gap-2">
            {task.checklist.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerLight();
                    toggleSubtaskComplete(task.id, item.id);
                  }}
                  className="text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 flex-shrink-0 transition-colors"
                >
                  {item.completed ? (
                    <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Icons.Circle className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={cn(
                    "text-xs text-slate-700 dark:text-slate-300",
                    item.completed && "line-through text-slate-400 dark:text-slate-500"
                  )}
                >
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
