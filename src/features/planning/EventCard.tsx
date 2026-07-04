import React from 'react';
import * as Icons from 'lucide-react';
import type { PlannerEvent } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import { hexToRgba } from '../../lib/utils';
import { differenceInMinutes, parseISO, format } from 'date-fns';

interface EventCardProps {
  event: PlannerEvent;
  // If true, position is absolute inside timeline grid. If false, standard relative styling (like list items).
  absolute?: boolean;
  hourHeight?: number; // Height in pixels for 1 hour slot (default 60)
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  absolute = true,
  hourHeight = 60 
}) => {
  const { categories } = usePlannerStore();
  const { openEventModal } = useUIStore();

  const category = categories.find(c => c.id === event.categoryId);
  const color = category?.color || '#6366f1';
  
  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);
  const duration = differenceInMinutes(end, start);
  
  const dateStr = format(start, 'yyyy-MM-dd');

  // Render Icon
  const renderIcon = () => {
    if (!category) return null;
    const IconComponent = (Icons as any)[category.icon];
    if (IconComponent) {
      return <IconComponent className="w-3.5 h-3.5" />;
    }
    return null;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Pass the actual event ID (virtual or raw) and date string to edit
    openEventModal(event.id, dateStr);
  };

  // Absolute positioning calculations
  const top = (start.getHours() * hourHeight) + ((start.getMinutes() / 60) * hourHeight);
  const height = (duration / 60) * hourHeight;

  // Premium semi-transparent styling
  const cardStyle: React.CSSProperties = {
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: color,
    color: color,
    ...(absolute ? {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '8px',
      right: '8px',
    } : {})
  };

  return (
    <div
      onClick={handleCardClick}
      style={cardStyle}
      className={`border-l-4 rounded-xl px-3 py-2 flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-all hover:scale-[1.01] hover:shadow-sm shadow-slate-100/50 ${
        absolute ? 'z-10' : 'w-full'
      }`}
    >
      <div className="flex flex-col gap-0.5">
        {/* Title and Time row */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold truncate block text-slate-800 dark:text-slate-200">
            {event.title}
          </span>
          <span className="text-[10px] font-semibold opacity-85 flex-shrink-0">
            {format(start, 'HH:mm')}
          </span>
        </div>

        {/* Location if present */}
        {event.location && height > 35 && (
          <span className="text-[9px] opacity-80 flex items-center gap-1 font-medium truncate">
            <Icons.MapPin className="w-2.5 h-2.5" />
            {event.location}
          </span>
        )}
      </div>

      {/* Footer (Category name, recurrence indicator) */}
      {height > 55 && (
        <div className="flex items-center justify-between mt-1 text-[9px] font-bold uppercase tracking-wider opacity-90 border-t border-slate-200/10 dark:border-slate-800/10 pt-1">
          <div className="flex items-center gap-1">
            {renderIcon()}
            <span>{category?.name}</span>
          </div>

          {/* Recurrence indicator */}
          {event.recurrence && event.recurrence.type !== 'none' && (
            <Icons.RefreshCw className="w-2.5 h-2.5" />
          )}
        </div>
      )}
    </div>
  );
};
