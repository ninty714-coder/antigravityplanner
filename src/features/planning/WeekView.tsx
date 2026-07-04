import React from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { EventCard } from './EventCard';
import { TaskItem } from '../tasks/TaskItem';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';

export const WeekView: React.FC = () => {
  const { currentDate, getEventsForDateRange, getTasksForDate, setCurrentDate } = usePlannerStore();
  const { openEventModal, openTaskModal, setViewMode } = useUIStore();

  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Generate 7 days
  const days = eachDayOfInterval({ start, end });

  const handleDayHeaderClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode('day'); // Jump to day view
  };

  return (
    <div className="flex-1 overflow-y-auto pr-1 select-none">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4 min-h-[500px]">
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, currentDate);
          const dateStr = format(day, 'yyyy-MM-dd');

          // Fetch items for this day
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);

          const dayEvents = getEventsForDateRange(dayStart, dayEnd);
          const dayTasks = getTasksForDate(day);

          return (
            <div
              key={dateStr}
              className={cn(
                "flex flex-col rounded-2xl border p-3.5 min-h-[250px] transition-all bg-white dark:bg-slate-900",
                isSelected 
                  ? "border-indigo-400 ring-2 ring-indigo-500/10 dark:border-indigo-500" 
                  : "border-slate-200/80 dark:border-slate-800/80",
                isToday && "bg-indigo-50/20 dark:bg-indigo-950/5"
              )}
            >
              {/* Header */}
              <div 
                onClick={() => handleDayHeaderClick(day)}
                className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2 mb-3 cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-indigo-500 transition-colors">
                    {format(day, 'EEEE', { locale: fr }).substring(0, 3)}.
                  </span>
                  <span className={cn(
                    "text-base font-bold text-slate-800 dark:text-slate-100",
                    isToday && "text-indigo-600 dark:text-indigo-400"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskModal(null, dateStr);
                    }}
                    className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-400 hover:text-indigo-500"
                    title="Ajouter Tâche"
                  >
                    <Icons.PlusSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal(null, day.toISOString());
                    }}
                    className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-400 hover:text-indigo-500"
                    title="Ajouter Événement"
                  >
                    <Icons.CalendarPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Events */}
              <div className="flex flex-col gap-2 mb-4">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Événements ({dayEvents.length})
                </span>
                {dayEvents.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {dayEvents.map(event => (
                      <EventCard key={event.id} event={event} absolute={false} />
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-0.5">
                    Aucun événement
                  </span>
                )}
              </div>

              {/* Day Tasks */}
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Tâches ({dayTasks.length})
                </span>
                {dayTasks.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {dayTasks.map(task => (
                      <div key={task.id} className="scale-[0.95] origin-top-left -mb-1 w-[105%]">
                        <TaskItem task={task} dateStr={dateStr} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-0.5">
                    Aucune tâche
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
