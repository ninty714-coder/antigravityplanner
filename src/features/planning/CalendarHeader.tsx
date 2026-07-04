import React from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { useUIStore } from '../../store/uiStore';
import type { ViewMode, ThemeMode } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { 
  format, 
  addDays, 
  addWeeks, 
  addMonths, 
  subDays, 
  subWeeks, 
  subMonths 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export const CalendarHeader: React.FC = () => {
  const { currentDate, setCurrentDate } = usePlannerStore();
  const { viewMode, setViewMode, theme, setTheme, openSearchModal } = useUIStore();

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleTheme = () => {
    const nextTheme: Record<ThemeMode, ThemeMode> = {
      system: 'light',
      light: 'dark',
      dark: 'system'
    };
    setTheme(nextTheme[theme]);
  };

  const themeIcons = {
    system: <Icons.Laptop className="w-4 h-4 text-slate-500" />,
    light: <Icons.Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />,
    dark: <Icons.Moon className="w-4 h-4 text-indigo-400" />
  };

  // Capitalize first letter of string helper
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Format header label depending on selected view
  const getHeaderLabel = () => {
    if (viewMode === 'day') {
      return capitalize(format(currentDate, 'EEEE d MMMM yyyy', { locale: fr }));
    } else if (viewMode === 'week') {
      const start = format(currentDate, 'd', { locale: fr });
      return `Semaine du ${start} ${format(currentDate, 'MMMM yyyy', { locale: fr })}`;
    } else {
      return capitalize(format(currentDate, 'MMMM yyyy', { locale: fr }));
    }
  };

  const viewModesList: { value: ViewMode; label: string }[] = [
    { value: 'day', label: 'Jour' },
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' }
  ];

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-800/80 px-2 select-none">
      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-r border-slate-150 dark:border-slate-800/80 transition-colors"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-150 dark:border-slate-800/80 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <Icons.ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {getHeaderLabel()}
        </h1>
      </div>

      {/* Mode Select & Global actions */}
      <div className="flex items-center gap-3 justify-between md:justify-end">
        {/* Sliding View Switcher */}
        <div className="relative flex p-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-xl">
          {viewModesList.map((mode) => {
            const isSelected = viewMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={`relative px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-250 ${
                  isSelected 
                    ? 'text-slate-900 dark:text-slate-50 z-10' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="view-selector-highlight"
                    className="absolute inset-0 bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openSearchModal}
            className="w-9 h-9 !p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800"
          >
            <Icons.Search className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" />
          </Button>

          {/* Theme switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-9 h-9 !p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800"
            title={`Thème actuel: ${theme}`}
          >
            {themeIcons[theme]}
          </Button>
        </div>
      </div>
    </div>
  );
};
