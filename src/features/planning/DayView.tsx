import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { EventCard } from './EventCard';
import { format, addDays } from 'date-fns';

export const DayView: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    getEventsForDateRange,
    getTasksForDate,
    scheduleTaskToSlot,
    selectedCategoryId,
    searchQuery
  } = usePlannerStore();
  const { openEventModal, openTaskModal } = useUIStore();
  const { triggerLight } = useHapticFeedback();

  const timelineRef = useRef<HTMLDivElement>(null);
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get events and filter them
  const events = getEventsForDateRange(startOfDay, endOfDay);
  const filteredEvents = events.filter(e => {
    const matchesCategory = selectedCategoryId ? e.categoryId === selectedCategoryId : true;
    const matchesSearch = searchQuery ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  // Tasks that have been dragged onto a calendar slot for this day
  const scheduledTasks = getTasksForDate(currentDate).filter(t => t.timeSlot);

  // Hours array (0 to 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourHeight = 65; // Height in pixels per hour

  // Scroll to current hour on load to keep UX polished
  useEffect(() => {
    if (timelineRef.current) {
      const currentHour = new Date().getHours();
      // Scroll to 2 hours before current hour so it's centered nicely
      const scrollPosition = Math.max(0, (currentHour - 2) * hourHeight);
      timelineRef.current.scrollTop = scrollPosition;
    }
  }, [currentDate]);

  const handleTimelineClick = (hour: number) => {
    // Generate selected slot time
    const selectedSlot = new Date(currentDate);
    selectedSlot.setHours(hour, 0, 0, 0);
    openEventModal(null, selectedSlot.toISOString());
  };

  // Swipe horizontal on the whole Day view -> navigate between days
  const handleDaySwipeEnd = (_e: any, info: any) => {
    const threshold = 80;
    if (info.offset.x < -threshold) {
      triggerLight();
      setCurrentDate(addDays(currentDate, 1));
    } else if (info.offset.x > threshold) {
      triggerLight();
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  return (
    <motion.div
      className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 overflow-hidden select-none"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDaySwipeEnd}
    >
      {/* Scrollable Timeline Grid */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto relative pr-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div 
          className="relative w-full"
          style={{ height: `${24 * hourHeight}px` }}
        >
          {/* Hour grid lines - also act as drop targets for scheduling tasks */}
          {hours.map((hour) => (
            <div
              key={hour}
              onClick={() => handleTimelineClick(hour)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const draggedTaskId = e.dataTransfer.getData('text/task-id');
                if (draggedTaskId) {
                  scheduleTaskToSlot(draggedTaskId, dateStr, hour);
                  triggerLight();
                }
              }}
              className="absolute left-0 right-0 border-t border-slate-200/60 dark:border-slate-850 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors"
              style={{ 
                top: `${hour * hourHeight}px`, 
                height: `${hourHeight}px` 
              }}
            >
              {/* Hour Label */}
              <span className="absolute left-3 -top-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Render Absolutely Positioned Events */}
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              absolute={true} 
              hourHeight={hourHeight} 
            />
          ))}

          {/* Render tasks scheduled onto the timeline via drag & drop */}
          {scheduledTasks.map((task) => {
            const [h, m] = task.timeSlot!.startTime.split(':').map(Number);
            const top = h * hourHeight + (m / 60) * hourHeight;
            return (
              <div
                key={task.id}
                onClick={() => openTaskModal(task.id, dateStr)}
                className="absolute left-16 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/90 text-white text-xs font-semibold shadow-sm cursor-pointer hover:bg-indigo-600 transition-colors truncate"
                style={{ top: `${top}px`, height: `${hourHeight - 8}px` }}
                title={task.title}
              >
                <Icons.CheckSquare className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{task.title}</span>
              </div>
            );
          })}

          {/* Current Time Indicator Red Line (Only if current date is today) */}
          {format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
            <TimeIndicator hourHeight={hourHeight} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Current Time Indicator Component
const TimeIndicator: React.FC<{ hourHeight: number }> = ({ hourHeight }) => {
  const [top, setTop] = React.useState(0);

  React.useEffect(() => {
    const calculateTop = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      return (hours * hourHeight) + ((minutes / 60) * hourHeight);
    };

    setTop(calculateTop());

    const interval = setInterval(() => {
      setTop(calculateTop());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [hourHeight]);

  return (
    <div 
      className="absolute left-14 right-0 flex items-center z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      {/* Red dot */}
      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full -ml-1.5 shadow" />
      {/* Red line */}
      <div className="flex-1 h-[1.5px] bg-rose-500 opacity-80" />
    </div>
  );
};
