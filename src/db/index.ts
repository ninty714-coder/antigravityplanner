import Dexie, { type Table } from 'dexie';
import type { Category, PlannerEvent, PlannerTask, Habit } from '../types';

export class PlannerDatabase extends Dexie {
  categories!: Table<Category, string>;
  events!: Table<PlannerEvent, string>;
  tasks!: Table<PlannerTask, string>;
  habits!: Table<Habit, string>;

  constructor() {
    super('PlannerDatabase');
    this.version(1).stores({
      categories: 'id, name',
      events: 'id, startTime, endTime, categoryId, completed',
      tasks: 'id, categoryId, dueDate, priority, completed, order',
    });
    // v2: adds the Habits table for recurring habit tracking with streaks
    this.version(2).stores({
      categories: 'id, name',
      events: 'id, startTime, endTime, categoryId, completed',
      tasks: 'id, categoryId, dueDate, priority, completed, order',
      habits: 'id, createdAt',
    });
  }
}

export const db = new PlannerDatabase();

// Seed function to insert default categories and items if DB is empty
export async function seedDatabase() {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const defaultCategories: Category[] = [
      { id: 'cat-work', name: 'Travail', color: '#6366f1', icon: 'Briefcase' }, // Indigo
      { id: 'cat-personal', name: 'Perso', color: '#ec4899', icon: 'User' }, // Pink
      { id: 'cat-sport', name: 'Sport', color: '#10b981', icon: 'Dumbbell' }, // Emerald
      { id: 'cat-health', name: 'Santé', color: '#f43f5e', icon: 'HeartPulse' }, // Rose
      { id: 'cat-finance', name: 'Finances', color: '#eab308', icon: 'DollarSign' }, // Yellow
    ];
    await db.categories.bulkAdd(defaultCategories);

    // Add sample tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const sampleTasks: PlannerTask[] = [
      {
        id: 'task-1',
        title: 'Planifier la semaine de projet',
        categoryId: 'cat-work',
        priority: 'high',
        dueDate: todayStr,
        order: 1,
        checklist: [
          { id: 'check-1-1', title: 'Définir les jalons', completed: true },
          { id: 'check-1-2', title: 'Assigner les tâches', completed: false }
        ],
        recurrence: { type: 'none' },
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-2',
        title: 'Séance de cardio/muscu 45 min',
        categoryId: 'cat-sport',
        priority: 'medium',
        dueDate: todayStr,
        order: 2,
        checklist: [],
        recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] },
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-3',
        title: 'Acheter des fruits et légumes',
        categoryId: 'cat-personal',
        priority: 'low',
        dueDate: todayStr,
        order: 3,
        checklist: [],
        recurrence: { type: 'none' },
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
    await db.tasks.bulkAdd(sampleTasks);

    // Add sample events
    const today = new Date();
    
    // Event 1: Meeting today at 10:00 - 11:30
    const ev1Start = new Date(today);
    ev1Start.setHours(10, 0, 0, 0);
    const ev1End = new Date(today);
    ev1End.setHours(11, 30, 0, 0);

    // Event 2: Lunch today at 12:30 - 13:30
    const ev2Start = new Date(today);
    ev2Start.setHours(12, 30, 0, 0);
    const ev2End = new Date(today);
    ev2End.setHours(13, 30, 0, 0);

    const sampleEvents: PlannerEvent[] = [
      {
        id: 'event-1',
        title: 'Réunion d\'équipe Antigravity',
        startTime: ev1Start.toISOString(),
        endTime: ev1End.toISOString(),
        categoryId: 'cat-work',
        location: 'Salle 4B ou Google Meet',
        notes: 'Discuter de l\'avancement du planning et des objectifs Q3.',
        checklist: [],
        reminders: [{ id: 'rem-1', minutesBefore: 15, triggered: false }],
        recurrence: { type: 'none' },
        completed: false
      },
      {
        id: 'event-2',
        title: 'Déjeuner avec Sophie',
        startTime: ev2Start.toISOString(),
        endTime: ev2End.toISOString(),
        categoryId: 'cat-personal',
        location: 'Bistro du centre',
        notes: 'Prendre des nouvelles et rendre son livre.',
        checklist: [],
        reminders: [],
        recurrence: { type: 'none' },
        completed: false
      }
    ];
    await db.events.bulkAdd(sampleEvents);
  }

  // Separate check so habits get seeded even for databases created before v2.
  const habitCount = await db.habits.count();
  if (habitCount === 0) {
    const todayForHabits = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(todayForHabits);
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };

    const sampleHabits: Habit[] = [
      {
        id: 'habit-1',
        title: 'Boire 2L d\'eau',
        icon: 'Droplet',
        color: '#06b6d4',
        targetDaysPerWeek: 7,
        completedDates: [daysAgo(1), daysAgo(2), daysAgo(3)],
        createdAt: new Date().toISOString()
      },
      {
        id: 'habit-2',
        title: 'Méditer 10 minutes',
        icon: 'Brain',
        color: '#8b5cf6',
        targetDaysPerWeek: 5,
        completedDates: [daysAgo(1), daysAgo(4)],
        createdAt: new Date().toISOString()
      }
    ];
    await db.habits.bulkAdd(sampleHabits);
  }
}
