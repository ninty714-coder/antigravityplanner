import React, { useRef } from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../store/plannerStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { format, parseISO, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db } from '../db';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'planning' | 'stats' | 'habits' | 'kanban';
  setActiveView: (view: 'planning' | 'stats' | 'habits' | 'kanban') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const { tasks, events, init } = usePlannerStore();
  const { openTaskModal, openEventModal, openSettingsModal, openProfileModal } = useUIStore();
  const { user } = useAuthStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // 1. Calculate stats for Today's Widget
  const todayTasks = tasks.filter(t => {
    if (t.recurrence && t.recurrence.type !== 'none') {
      const isCompleted = ((t as any).completedDates || []).includes(todayStr);
      return t.dueDate && !isCompleted;
    }
    return t.dueDate === todayStr && !t.completed;
  });

  const todayEvents = events.filter(e => {
    const isRecurring = e.recurrence && e.recurrence.type !== 'none';
    const dateStr = isRecurring ? todayStr : e.startTime.split('T')[0];
    const isCompleted = isRecurring 
      ? ((e as any).completedDates || []).includes(todayStr)
      : e.completed;
    return dateStr === todayStr && !isCompleted;
  });

  // Find next event today
  const nextEvent = todayEvents
    .map(e => {
      // Re-route recurring startTimes to today's date context
      const start = parseISO(e.startTime);
      const actualStart = new Date(start);
      actualStart.setFullYear(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      return { ...e, actualStart };
    })
    .filter(e => isAfter(e.actualStart, new Date()))
    .sort((a, b) => a.actualStart.getTime() - b.actualStart.getTime())[0];

  // 2. Export / Import Data
  const handleExport = async () => {
    try {
      const categories = await db.categories.toArray();
      const tasksList = await db.tasks.toArray();
      const eventsList = await db.events.toArray();
      const habitsList = await db.habits.toArray();
      
      const backup = { categories, tasks: tasksList, events: eventsList, habits: habitsList };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `planner_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export database:', error);
      alert('Erreur lors de l\'exportation des données.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.categories && data.tasks && data.events) {
          // Clear current database
          await db.categories.clear();
          await db.tasks.clear();
          await db.events.clear();
          await db.habits.clear();

          // Load import
          await db.categories.bulkAdd(data.categories);
          await db.tasks.bulkAdd(data.tasks);
          await db.events.bulkAdd(data.events);
          if (data.habits) await db.habits.bulkAdd(data.habits);

          // Re-initialize store
          await init();
          alert('Données importées avec succès !');
        } else {
          alert('Le fichier importé n\'est pas un backup de planning valide.');
        }
      } catch (error) {
        console.error('Failed to import database:', error);
        alert('Erreur lors de la lecture du fichier de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* SIDEBAR - Sticky Desktop Drawer */}
      <aside className="w-full lg:w-[280px] bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col justify-between gap-6 flex-shrink-0">
        <div className="flex flex-col gap-6">
          {/* Logo / Header */}
          <div className="flex items-center gap-2.5 px-1 select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Icons.Zap className="w-4.5 h-4.5 fill-white/10" />
            </div>
            <span className="font-extrabold text-slate-850 dark:text-slate-55 text-base tracking-tight">
              Antigravity Planner
            </span>
          </div>

          {/* Bouton Profil */}
          {user && (
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors text-left"
              title="Mon compte"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.trim().charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</span>
              </div>
              <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-350 dark:text-slate-550 ml-auto flex-shrink-0" />
            </button>
          )}

          {/* Widget "Aujourd'hui" */}
          <div className="glass rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555">
                Aujourd'hui
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {format(new Date(), 'dd MMM', { locale: fr })}
              </span>
            </div>

            {/* Counts info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350">
                <Icons.CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayTasks.length} tâches en attente</span>
              </div>

              {/* Next event details */}
              {nextEvent ? (
                <div className="mt-1 border-t border-slate-200/40 dark:border-slate-800/40 pt-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Prochain événement
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">
                    {nextEvent.title}
                  </span>
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold flex items-center gap-1">
                    <Icons.Clock className="w-2.5 h-2.5" />
                    {format(nextEvent.actualStart, 'HH:mm')}
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-455 dark:text-slate-500 italic mt-1 border-t border-slate-200/40 dark:border-slate-800/40 pt-2">
                  Plus d'événements aujourd'hui
                </div>
              )}
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5 select-none">
            {[
              { key: 'planning', label: 'Planning', icon: 'CalendarDays' },
              { key: 'kanban', label: 'Kanban', icon: 'Columns3' },
              { key: 'habits', label: 'Habitudes', icon: 'Flame' },
              { key: 'stats', label: 'Statistiques', icon: 'BarChart3' }
            ].map((item) => {
              const ItemIcon = (Icons as any)[item.icon];
              const isActive = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key as any)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[var(--accent-soft)] dark:bg-[var(--accent-soft-dark)] text-[var(--accent)]"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ItemIcon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </div>
                  <Icons.ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions - Quick Creator, Import/Export */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => openTaskModal()}
              className="py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              Tâche
            </Button>
            <Button
              variant="secondary"
              onClick={() => openEventModal()}
              className="py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold"
            >
              <Icons.Calendar className="w-3.5 h-3.5" />
              Événement
            </Button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80 my-1" />

          {/* Settings Backup */}
          <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400 dark:text-slate-550 select-none">
            <span>SAUVEGARDES</span>
            <div className="flex items-center gap-2.5">
              {/* Settings Trigger */}
              <button
                onClick={openSettingsModal}
                className="hover:text-[var(--accent)] transition-colors"
                title="Réglages"
              >
                <Icons.Settings className="w-3.5 h-3.5" />
              </button>

              {/* Import File Trigger */}
              <button 
                onClick={handleImportClick}
                className="hover:text-[var(--accent)] transition-colors" 
                title="Importer sauvegarde"
              >
                <Icons.Upload className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              
              {/* Export Trigger */}
              <button 
                onClick={handleExport}
                className="hover:text-[var(--accent)] transition-colors" 
                title="Exporter sauvegarde"
              >
                <Icons.Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-x-hidden min-h-[500px]">
        {children}
      </main>
    </div>
  );
};
