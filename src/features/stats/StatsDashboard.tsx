import React from 'react';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { Card } from '../../components/ui/Card';
import { CircleChart } from './CircleChart';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  subDays 
} from 'date-fns';
import { fr } from 'date-fns/locale';

export const StatsDashboard: React.FC = () => {
  const { tasks, events, categories } = usePlannerStore();

  // 1. Gather all completion dates (YYYY-MM-DD) to calculate streaks
  const completionDates = new Set<string>();

  tasks.forEach(t => {
    // Add completed non-recurring tasks
    if (t.completed && t.completedAt) {
      completionDates.add(t.completedAt.split('T')[0]);
    }
    // Add completed instances of recurring tasks
    if ((t as any).completedDates) {
      (t as any).completedDates.forEach((d: string) => completionDates.add(d));
    }
  });

  events.forEach(e => {
    if (e.completed && e.startTime) {
      completionDates.add(e.startTime.split('T')[0]);
    }
    if ((e as any).completedDates) {
      (e as any).completedDates.forEach((d: string) => completionDates.add(d));
    }
  });

  // Calculate Streak
  const calculateStreak = () => {
    const sortedDates = Array.from(completionDates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    if (sortedDates.length === 0) {
      return { current: 0, longest: 0 };
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check if user has been active today or yesterday to continue current streak
    const hasActivityToday = completionDates.has(todayStr);
    const hasActivityYesterday = completionDates.has(yesterdayStr);

    if (hasActivityToday || hasActivityYesterday) {
      let checkDate = hasActivityToday ? new Date() : subDays(new Date(), 1);
      while (completionDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // Calculate longest streak in history
    // We walk through all dates sorted in ascending order and check if consecutive
    const ascDates = Array.from(completionDates)
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    if (ascDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      
      for (let i = 1; i < ascDates.length; i++) {
        const diffTime = ascDates[i].getTime() - ascDates[i - 1].getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      current: currentStreak,
      longest: Math.max(longestStreak, currentStreak)
    };
  };

  const streaks = calculateStreak();

  // 2. Calculate category statistics (completions by category)
  const categoryStats = categories.map(cat => {
    const taskCount = tasks.filter(t => {
      if (t.categoryId !== cat.id) return false;
      const isNormalCompleted = t.completed;
      const recurringCompletedCount = (t as any).completedDates?.length || 0;
      return isNormalCompleted || recurringCompletedCount > 0;
    }).length;

    const eventCount = events.filter(e => {
      if (e.categoryId !== cat.id) return false;
      const isNormalCompleted = e.completed;
      const recurringCompletedCount = (e as any).completedDates?.length || 0;
      return isNormalCompleted || recurringCompletedCount > 0;
    }).length;

    return {
      label: cat.name,
      value: taskCount + eventCount,
      color: cat.color
    };
  });

  // 3. Weekly Completion Rate (Monday to Sunday of current week)
  const getWeeklyStats = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start, end });

    let completed = 0;
    let total = 0;

    weekDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Count tasks scheduled for this day
      tasks.forEach(t => {
        if (t.dueDate === dayStr || (t.recurrence && t.recurrence.type !== 'none' && t.dueDate)) {
          // If task recurs or is scheduled today
          total++;
          const isComp = t.completed || ((t as any).completedDates || []).includes(dayStr);
          if (isComp) completed++;
        }
      });
    });

    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const weeklyOverview = getWeeklyStats();

  return (
    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 select-none pb-8">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak card */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex items-center justify-center text-amber-555 text-amber-500">
            <Icons.Flame className="w-6 h-6 fill-amber-500/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Streak Actuel
            </span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {streaks.current} {streaks.current > 1 ? 'Jours' : 'Jour'}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">
              Record: {streaks.longest} jours
            </span>
          </div>
        </Card>

        {/* Completion rate card */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500">
            <Icons.CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Taux Hebdo
            </span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {weeklyOverview.rate}%
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">
              {weeklyOverview.completed} sur {weeklyOverview.total} planifiés
            </span>
          </div>
        </Card>

        {/* Total Tasks card */}
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-500">
            <Icons.TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Actions Totales
            </span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {completionDates.size}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">
              Jours actifs enregistrés
            </span>
          </div>
        </Card>
      </div>

      {/* Graphs / Ring analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ring Chart distribution */}
        <Card className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
            Répartition par Catégorie (Completions)
          </h3>
          <div className="flex-1 flex items-center justify-center py-4">
            <CircleChart data={categoryStats} />
          </div>
        </Card>

        {/* Weekly Productivity Calendar view */}
        <Card className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
            Bilan d'activité cette semaine
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-3">
            {/* Show completion bar per day */}
            {eachDayOfInterval({
              start: startOfWeek(new Date(), { weekStartsOn: 1 }),
              end: endOfWeek(new Date(), { weekStartsOn: 1 })
            }).map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              // Count completions today
              const dayTasks = tasks.filter(t => 
                t.dueDate === dayStr || 
                (t.recurrence && t.recurrence.type !== 'none' && t.dueDate)
              );
              const dayTasksTotal = dayTasks.length;
              const dayTasksCompleted = dayTasks.filter(t => 
                t.completed || ((t as any).completedDates || []).includes(dayStr)
              ).length;
              
              const percent = dayTasksTotal > 0 ? (dayTasksCompleted / dayTasksTotal) * 100 : 0;

              return (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <span className={`text-xs font-semibold w-16 uppercase ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
                    {format(day, 'EEEE', { locale: fr }).substring(0, 3)}
                  </span>
                  
                  {/* Progress track */}
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 text-right">
                    {dayTasksCompleted}/{dayTasksTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
