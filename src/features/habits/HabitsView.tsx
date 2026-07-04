import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePlannerStore } from '../../store/plannerStore';
import { computeHabitStreak, getLastNDays } from '../../lib/habits';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../lib/icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const renderIcon = (iconName: string, className = 'w-5 h-5', color?: string) => {
  const IconComponent = (Icons as any)[iconName];
  if (!IconComponent) return <Icons.Sparkles className={className} style={{ color }} />;
  return <IconComponent className={className} style={{ color }} />;
};

export const HabitsView: React.FC = () => {
  const { habits, addHabit, deleteHabit, toggleHabitToday } = usePlannerStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [targetDays, setTargetDays] = useState(7);

  const last7Days = getLastNDays(7);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addHabit({ title: title.trim(), icon, color, targetDaysPerWeek: targetDays });
    setTitle('');
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Habitudes & Objectifs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivez vos routines récurrentes jour après jour.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 rounded-xl">
          <Icons.Plus className="w-4 h-4" />
          Nouvelle habitude
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="overflow-hidden mb-5"
          >
            <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col gap-3">
              <Input
                label="Nom de l'habitude"
                placeholder="Ex: Lire 20 minutes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Couleur
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Icône
                </span>
                <div className="grid grid-cols-9 gap-1.5">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      type="button"
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={`h-9 rounded-lg flex items-center justify-center transition-all ${
                        icon === iconName
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {renderIcon(iconName, 'w-4 h-4')}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Objectif (jours / semaine)"
                type="number"
                min={1}
                max={7}
                value={targetDays}
                onChange={(e) => setTargetDays(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
              />

              <Button type="submit" className="rounded-xl">Créer l'habitude</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {habits.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900/60 rounded-full flex items-center justify-center text-indigo-500 mb-4 border border-slate-200/50 dark:border-slate-800">
            <Icons.Flame className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aucune habitude pour l'instant</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px]">
            Créez une routine à suivre au quotidien (sport, lecture, méditation...) et gardez votre série active !
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => {
            const streak = computeHabitStreak(habit.completedDates);
            const doneToday = habit.completedDates.includes(todayStr);
            return (
              <div
                key={habit.id}
                className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-4"
              >
                <button
                  onClick={() => toggleHabitToday(habit.id)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border-2"
                  style={{
                    backgroundColor: doneToday ? habit.color : 'transparent',
                    borderColor: habit.color
                  }}
                  title={doneToday ? 'Marquer comme non fait aujourd\'hui' : 'Marquer comme fait aujourd\'hui'}
                >
                  {renderIcon(habit.icon, 'w-5 h-5', doneToday ? '#fff' : habit.color)}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {habit.title}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 flex-shrink-0">
                      <Icons.Flame className="w-3.5 h-3.5" />
                      {streak.current}
                    </div>
                  </div>

                  {/* 7-day dot row */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {last7Days.map((d) => {
                      const isDone = habit.completedDates.includes(d);
                      return (
                        <div
                          key={d}
                          title={format(new Date(d + 'T00:00:00'), 'EEEE d MMM', { locale: fr })}
                          className="w-4 h-4 rounded-full border"
                          style={{
                            backgroundColor: isDone ? habit.color : 'transparent',
                            borderColor: isDone ? habit.color : 'rgb(203 213 225 / 0.6)'
                          }}
                        />
                      );
                    })}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                      Record : {streak.longest}j
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-slate-300 hover:text-rose-500 dark:text-slate-700 dark:hover:text-rose-400 transition-colors flex-shrink-0"
                  title="Supprimer l'habitude"
                >
                  <Icons.Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
