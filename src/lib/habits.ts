// src/lib/habits.ts
// Small pure helpers to compute streaks and weekly stats for a Habit,
// kept separate from the store since they're derived, read-only values.

import { format, subDays } from 'date-fns';

export interface HabitStreak {
  current: number;
  longest: number;
}

/**
 * Computes the current streak (consecutive days up to and including today,
 * or yesterday if today isn't done yet) and the longest streak ever recorded.
 */
export function computeHabitStreak(completedDates: string[]): HabitStreak {
  const dateSet = new Set(completedDates);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Current streak: walk backwards from today (or yesterday, if today isn't
  // done yet so an unchecked "today" doesn't immediately zero out the streak).
  let current = 0;
  let cursor = dateSet.has(todayStr) ? today : subDays(today, 1);
  while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    current += 1;
    cursor = subDays(cursor, 1);
  }

  // Longest streak: scan all completed dates sorted chronologically.
  const sorted = [...completedDates].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;

  sorted.forEach((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (prev) {
      const diffDays = Math.round((d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  });

  return { current, longest: Math.max(longest, current) };
}

/** Returns the last N days (oldest first) as 'yyyy-MM-dd' strings, for a dot/heatmap row. */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return days;
}
