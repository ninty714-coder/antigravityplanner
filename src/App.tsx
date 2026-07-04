import { useEffect, useRef, useState } from 'react';
import { usePlannerStore } from './store/plannerStore';
import { useUIStore } from './store/uiStore';
import { useNotification } from './hooks/useNotification';
import { parseISO, differenceInSeconds } from 'date-fns';
import { Layout } from './components/Layout';
import { startSync, stopSync } from './lib/syncEngine';
import { CalendarHeader } from './features/planning/CalendarHeader';
import { CategoryFilterBar } from './features/categories/CategoryFilterBar';
import { DayView } from './features/planning/DayView';
import { WeekView } from './features/planning/WeekView';
import { MonthView } from './features/planning/MonthView';
import { TaskList } from './features/tasks/TaskList';
import { StatsDashboard } from './features/stats/StatsDashboard';
import { HabitsView } from './features/habits/HabitsView';
import { KanbanView } from './features/kanban/KanbanView';

// Modals
import { TaskModal } from './features/tasks/TaskModal';
import { EventModal } from './features/planning/EventModal';
import { CategoryManagerModal } from './features/categories/CategoryManagerModal';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';

function App() {
  const { init, loading, events, getEventsForDateRange, markReminderTriggered } = usePlannerStore();
  const { theme, viewMode, setTheme } = useUIStore();
  const { requestPermission, showNotification } = useNotification();
  const [activeView, setActiveView] = useState<'planning' | 'stats' | 'habits' | 'kanban'>('planning');

  // Tracks which (event id, reminder id) pairs already fired a notification
  // this session, so recurring event instances don't get re-notified on every check.
  const notifiedRef = useRef<Set<string>>(new Set());

  // Initialize data on load
  useEffect(() => {
    init().then(() => {
      // Une fois les données locales chargées, on restaure/pousse les
      // données du compte connecté et on branche la sauvegarde automatique.
      startSync();
    });
    setTheme(theme); // Re-apply the saved (or system) theme preference on load
    requestPermission();
    // App n'est monté que pendant une session authentifiée (voir AuthGate) :
    // ce nettoyage s'exécute donc précisément à la déconnexion.
    return () => {
      stopSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  // Reminder engine: periodically checks upcoming events for due reminders
  // and fires a local notification (Notifications API / service worker).
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const lookAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const upcoming = getEventsForDateRange(now, lookAhead);

      upcoming.forEach((event) => {
        const start = parseISO(event.startTime);
        (event.reminders || []).forEach((reminder) => {
          if (reminder.triggered) return;

          const notifyKey = `${event.id}_${reminder.id}`;
          if (notifiedRef.current.has(notifyKey)) return;

          const secondsUntil = differenceInSeconds(start, now) - reminder.minutesBefore * 60;
          // Fire once the reminder time has arrived (small grace window since we poll every 30s)
          if (secondsUntil <= 0 && secondsUntil > -60) {
            showNotification(event.title, {
              body: `Dans ${reminder.minutesBefore} min • ${event.location || 'Planning'}`,
              tag: notifyKey
            });
            notifiedRef.current.add(notifyKey);
            // Only persist "triggered" for non-recurring events; recurring
            // instances are virtual and re-checked each occurrence.
            if (!event.recurrenceParentId) {
              markReminderTriggered('event', event.id, reminder.id);
            }
          }
        });
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [events, getEventsForDateRange, showNotification, markReminderTriggered]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute w-full h-full border-4 border-indigo-500/25 rounded-full" />
          <div className="absolute w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin" />
        </div>
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          Chargement de votre planning...
        </span>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {activeView === 'planning' && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          {/* Calendar View Header */}
          <CalendarHeader />

          {/* Categories Horizontal Filter Bar */}
          <CategoryFilterBar />

          {/* View Dispatcher */}
          <div className="flex-1 overflow-hidden mt-2">
            {viewMode === 'day' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full overflow-hidden">
                {/* Timeline Grid (60%) */}
                <div className="lg:col-span-3 flex flex-col h-[50vh] lg:h-full overflow-hidden">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 px-1 block select-none">
                    Ligne du temps
                  </span>
                  <DayView />
                </div>
                {/* Tasks panel (40%) */}
                <div className="lg:col-span-2 flex flex-col h-[45vh] lg:h-full overflow-hidden">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 px-1 block select-none">
                    Tâches du jour
                  </span>
                  <TaskList />
                </div>
              </div>
            )}

            {viewMode === 'week' && <WeekView />}
            
            {viewMode === 'month' && <MonthView />}
          </div>
        </div>
      )}

      {activeView === 'kanban' && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-2">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Tableau Kanban
            </h1>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
              Glissez vos tâches d'une colonne à l'autre pour suivre leur avancement.
            </p>
          </div>
          <KanbanView />
        </div>
      )}

      {activeView === 'habits' && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          <HabitsView />
        </div>
      )}

      {activeView === 'stats' && (
        /* Analytics View */
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-2">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Analyses & Productivité
            </h1>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
              Consultez vos statistiques d'achèvement et vos streaks d'activité.
            </p>
          </div>
          <StatsDashboard />
        </div>
      )}

      {/* Mounting Overlay Modals */}
      <TaskModal />
      <EventModal />
      <CategoryManagerModal />
      <SearchModal />
      <SettingsModal />
      <ProfileModal />
    </Layout>
  );
}

export default App;
