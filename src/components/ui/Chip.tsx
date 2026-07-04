import React from 'react';
import { cn, hexToRgba } from '../../lib/utils';

interface ChipProps {
  label: string;
  color?: string; // Hex color (e.g. '#6366f1')
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  color,
  active = false,
  onClick,
  icon,
  className
}) => {
  const isClickable = !!onClick;
  
  // Resolve styles depending on color parameter
  const customStyle = color 
    ? {
        backgroundColor: active ? color : hexToRgba(color, 0.12),
        color: active ? '#ffffff' : color,
        borderColor: active ? color : hexToRgba(color, 0.25),
      }
    : undefined;

  const defaultClasses = cn(
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all select-none",
    isClickable ? "cursor-pointer active:scale-95" : "",
    !color && (
      active 
        ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-50 dark:border-slate-50 dark:text-slate-950" 
        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
    ),
    className
  );

  return (
    <span
      onClick={onClick}
      className={defaultClasses}
      style={customStyle}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
