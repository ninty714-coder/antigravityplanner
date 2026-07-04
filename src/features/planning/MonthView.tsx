import React from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay 
} from 'date-fns';
import { cn } from '../../lib/utils';

export const MonthView: React.FC = () => {
  const { currentDate, getEventsForDateRange, getTasksForDate, categories, setCurrentDate } = usePlannerStore();
  const { setViewMode } = useUIStore();

  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  const startGrid = startOfWeek(startMonth, { weekStartsOn: 1 });
  const endGrid = endOfWeek(endMonth, { weekStartsOn: 1 });

  // Generate all grid days
  const gridDays = eachDayOfInterval({ start: startGrid, end: endGrid });

  const weekdayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handleCellClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode('day'); // Jump to day view to explore
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm select-none">
      {/* Weekday headers row */}
      <div className="grid grid-cols-7 text-center pb-2 border-b border-slate-100 dark:border-slate-850">
        {weekdayHeaders.map((header) => (
          <span
            key={header}
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
          >
            {header}
          </span>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1 mt-2 flex-1 min-h-[360px]">
        {gridDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, currentDate);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dateStr = format(day, 'yyyy-MM-dd');

          // Fetch items for this day to draw dots
          const dayStart = new Date(day);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(day);
          dayEnd.setHours(23, 59, 59, 999);

          const dayEvents = getEventsForDateRange(dayStart, dayEnd);
          const dayTasks = getTasksForDate(day);

          // Get unique category colors for indicators
          const activeCategories = new Set<string>();
          dayEvents.forEach(e => {
            const cat = categories.find(c => c.id === e.categoryId);
            if (cat) activeCategories.add(cat.color);
          });
          dayTasks.filter(t => !t.completed).forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            if (cat) activeCategories.add(cat.color);
          });
          const indicatorColors = Array.from(activeCategories).slice(0, 4); // Max 4 dots

          return (
            <div
              key={dateStr}
              onClick={() => handleCellClick(day)}
              className={cn(
                "flex flex-col items-center justify-between p-2 rounded-xl border border-transparent cursor-pointer transition-all hover:bg-slate-55 dark:hover:bg-slate-800/40 min-h-[65px]",
                !isCurrentMonth && "opacity-30 pointer-events-none sm:pointer-events-auto",
                isSelected && "border-indigo-400 bg-indigo-50/10 dark:border-indigo-500 dark:bg-indigo-950/10",
                isToday && "bg-slate-50 dark:bg-slate-800/40"
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center text-slate-700 dark:text-slate-350",
                  isToday && "bg-indigo-600 text-white dark:bg-indigo-500",
                  isSelected && !isToday && "text-indigo-600 dark:text-indigo-400"
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Indicator dots container */}
              <div className="flex gap-1 justify-center items-center mt-1 w-full min-h-[6px]">
                {indicatorColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
