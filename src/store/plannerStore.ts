import { create } from 'zustand';
import { db, seedDatabase } from '../db';
import type { Category, PlannerEvent, PlannerTask, RecurrenceRule, Habit, TaskStatus } from '../types';
import { 
  addDays, 
  parseISO, 
  format,
  startOfDay,
  getDay
} from 'date-fns';

interface PlannerState {
  categories: Category[];
  events: PlannerEvent[];
  tasks: PlannerTask[];
  habits: Habit[];
  currentDate: Date;
  selectedCategoryId: string | null;
  searchQuery: string;
  loading: boolean;

  // Initialization
  init: () => Promise<void>;
  // Vide entièrement les données locales (IndexedDB + état) — utilisé à la
  // déconnexion pour garantir qu'aucune donnée d'un utilisateur ne reste
  // visible pour le prochain utilisateur sur le même appareil.
  resetLocal: () => Promise<void>;
  
  // Actions - Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Actions - Tasks
  addTask: (task: Omit<PlannerTask, 'id' | 'createdAt' | 'completed'>) => Promise<void>;
  updateTask: (task: PlannerTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string, dateStr: string) => Promise<void>;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => Promise<void>;
  // Drag & drop: schedule a task onto a calendar time slot (or clear it)
  scheduleTaskToSlot: (id: string, dateStr: string, hour: number | null) => Promise<void>;
  // Drag & drop: reorder tasks within the same day
  reorderTask: (draggedId: string, targetId: string, dateStr: string) => Promise<void>;
  // Kanban: move a task between status columns
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;

  // Actions - Events
  addEvent: (event: Omit<PlannerEvent, 'id' | 'completed'>) => Promise<void>;
  updateEvent: (event: PlannerEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventComplete: (id: string, dateStr: string) => Promise<void>;

  // Actions - Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitToday: (id: string) => Promise<void>;

  // Reminders (local notifications)
  markReminderTriggered: (kind: 'event' | 'task', id: string, reminderId: string) => Promise<void>;

  // Actions - UI sync
  setCurrentDate: (date: Date) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Helpers
  getEventsForDateRange: (start: Date, end: Date) => PlannerEvent[];
  getTasksForDate: (date: Date) => PlannerTask[];
  getTasksForDateRange: (start: Date, end: Date) => PlannerTask[];
}

// Generate a random UUID-like ID
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Recurring instances use a virtual id like "task-abc123_2026-07-04".
// This strips the date suffix to get back the real DB id.
const getRealId = (id: string) => id.split('_')[0];

// Helper: Check if a date satisfies a recurrence rule
const matchRecurrence = (date: Date, baseDate: Date, rule: RecurrenceRule): boolean => {
  if (rule.type === 'none') return false;
  
  const targetDateStart = startOfDay(date);
  const baseDateStart = startOfDay(baseDate);
  
  // If target date is before the original start date, it doesn't recur yet
  if (targetDateStart < baseDateStart) return false;
  
  // If there's an end date, check it
  if (rule.endDate && targetDateStart > startOfDay(parseISO(rule.endDate))) return false;
  
  const interval = rule.interval || 1;
  
  switch (rule.type) {
    case 'daily': {
      const diffTime = Math.abs(targetDateStart.getTime() - baseDateStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % interval === 0;
    }
    case 'weekly': {
      const diffTime = Math.abs(targetDateStart.getTime() - baseDateStart.getTime());
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      if (diffWeeks % interval !== 0) return false;
      
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday ...
        return rule.daysOfWeek.includes(dayOfWeek);
      }
      // If no specific days of week specified, match on the same day of week as base
      return getDay(date) === getDay(baseDate);
    }
    case 'monthly': {
      // Must be same day of month, or custom handling
      const targetDay = date.getDate();
      const baseDay = baseDate.getDate();
      
      const diffMonths = (date.getFullYear() - baseDate.getFullYear()) * 12 + (date.getMonth() - baseDate.getMonth());
      if (diffMonths % interval !== 0) return false;
      
      if (rule.dayOfMonth) {
        return targetDay === rule.dayOfMonth;
      }
      return targetDay === baseDay;
    }
    default:
      return false;
  }
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  categories: [],
  events: [],
  tasks: [],
  habits: [],
  currentDate: new Date(),
  selectedCategoryId: null,
  searchQuery: '',
  loading: true,

  init: async () => {
    set({ loading: true });
    try {
      await seedDatabase();
      const categories = await db.categories.toArray();
      const events = await db.events.toArray();
      const tasks = await db.tasks.toArray();
      const habits = await db.habits.toArray();
      set({ categories, events, tasks, habits, loading: false });
    } catch (error) {
      console.error('Failed to initialize Planner Database:', error);
      set({ loading: false });
    }
  },

  resetLocal: async () => {
    try {
      await db.categories.clear();
      await db.tasks.clear();
      await db.events.clear();
      await db.habits.clear();
    } catch (error) {
      console.error('Failed to clear local Planner Database:', error);
    }
    set({ categories: [], events: [], tasks: [], habits: [], loading: true });
  },

  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // CATEGORIES
  addCategory: async (categoryData) => {
    const newCategory: Category = { ...categoryData, id: 'cat-' + generateId() };
    await db.categories.add(newCategory);
    const categories = await db.categories.toArray();
    set({ categories });
  },

  updateCategory: async (category) => {
    await db.categories.put(category);
    const categories = await db.categories.toArray();
    set({ categories });
  },

  deleteCategory: async (id) => {
    await db.categories.delete(id);
    const categories = await db.categories.toArray();
    set({ categories });
  },

  // TASKS
  addTask: async (taskData) => {
    const newTask: PlannerTask = {
      ...taskData,
      id: 'task-' + generateId(),
      completed: false,
      createdAt: new Date().toISOString(),
      checklist: taskData.checklist || [],
    };
    await db.tasks.add(newTask);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  updateTask: async (task) => {
    await db.tasks.put(task);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  toggleTaskComplete: async (id, dateStr) => {
    const task = await db.tasks.get(id);
    if (!task) return;

    const isRecurring = task.recurrence && task.recurrence.type !== 'none';

    if (isRecurring) {
      // Cast for recurrence completions
      const completedDates: string[] = (task as any).completedDates || [];
      const index = completedDates.indexOf(dateStr);
      let updatedDates = [...completedDates];
      
      if (index > -1) {
        updatedDates.splice(index, 1);
      } else {
        updatedDates.push(dateStr);
      }

      await db.tasks.update(id, { completedDates: updatedDates } as any);
    } else {
      const newStatus = !task.completed;
      await db.tasks.update(id, {
        completed: newStatus,
        completedAt: newStatus ? new Date().toISOString() : undefined
      });
    }

    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  toggleSubtaskComplete: async (taskId, subtaskId) => {
    const task = await db.tasks.get(taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map(item => 
      item.id === subtaskId ? { ...item, completed: !item.completed } : item
    );

    await db.tasks.update(taskId, { checklist: updatedChecklist });
    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  // Drag & drop: schedule (or unschedule) a task onto an hour slot in the Day view.
  scheduleTaskToSlot: async (id, dateStr, hour) => {
    const realId = getRealId(id);
    const task = await db.tasks.get(realId);
    if (!task) return;

    if (hour === null) {
      // Dropped back onto the plain task list: clear the calendar slot
      await db.tasks.update(realId, { timeSlot: undefined, dueDate: task.dueDate || dateStr });
    } else {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(Math.min(hour + 1, 23)).toString().padStart(2, '0')}:00`;
      await db.tasks.update(realId, {
        dueDate: dateStr,
        timeSlot: { startTime, endTime }
      });
    }

    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  // Drag & drop: reorder tasks within the same day's task list.
  reorderTask: async (draggedId, targetId, dateStr) => {
    const realDraggedId = getRealId(draggedId);
    const realTargetId = getRealId(targetId);
    if (realDraggedId === realTargetId) return;

    const dayTasks = get().getTasksForDate(parseISO(dateStr));
    const orderedIds = dayTasks.map(t => getRealId(t.id));

    const fromIndex = orderedIds.indexOf(realDraggedId);
    const toIndex = orderedIds.indexOf(realTargetId);
    if (fromIndex === -1 || toIndex === -1) return;

    orderedIds.splice(toIndex, 0, orderedIds.splice(fromIndex, 1)[0]);

    await Promise.all(
      orderedIds.map((taskId, index) => db.tasks.update(taskId, { order: index }))
    );

    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  // Kanban: move a task between status columns (also syncs the `completed` flag)
  setTaskStatus: async (id, status) => {
    const realId = getRealId(id);
    const task = await db.tasks.get(realId);
    if (!task) return;

    const completed = status === 'done';
    await db.tasks.update(realId, {
      status,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined
    });

    const tasks = await db.tasks.toArray();
    set({ tasks });
  },

  // REMINDERS (only PlannerEvent carries reminders in this data model)
  markReminderTriggered: async (kind, id, reminderId) => {
    if (kind !== 'event') return;
    const realId = getRealId(id);
    const event = await db.events.get(realId);
    if (!event) return;
    const reminders = event.reminders.map(r => r.id === reminderId ? { ...r, triggered: true } : r);
    await db.events.update(realId, { reminders });
    const events = await db.events.toArray();
    set({ events });
  },

  // EVENTS
  addEvent: async (eventData) => {
    const newEvent: PlannerEvent = {
      ...eventData,
      id: 'event-' + generateId(),
      completed: false,
      checklist: eventData.checklist || [],
      reminders: eventData.reminders || []
    };
    await db.events.add(newEvent);
    const events = await db.events.toArray();
    set({ events });
  },

  updateEvent: async (event) => {
    await db.events.put(event);
    const events = await db.events.toArray();
    set({ events });
  },

  deleteEvent: async (id) => {
    await db.events.delete(id);
    const events = await db.events.toArray();
    set({ events });
  },

  toggleEventComplete: async (id, dateStr) => {
    const event = await db.events.get(id);
    if (!event) return;

    const isRecurring = event.recurrence && event.recurrence.type !== 'none';

    if (isRecurring) {
      const completedDates: string[] = (event as any).completedDates || [];
      const index = completedDates.indexOf(dateStr);
      let updatedDates = [...completedDates];
      
      if (index > -1) {
        updatedDates.splice(index, 1);
      } else {
        updatedDates.push(dateStr);
      }

      await db.events.update(id, { completedDates: updatedDates } as any);
    } else {
      await db.events.update(id, { completed: !event.completed });
    }

    const events = await db.events.toArray();
    set({ events });
  },

  // HABITS
  addHabit: async (habitData) => {
    const newHabit: Habit = {
      ...habitData,
      id: 'habit-' + generateId(),
      completedDates: [],
      createdAt: new Date().toISOString()
    };
    await db.habits.add(newHabit);
    const habits = await db.habits.toArray();
    set({ habits });
  },

  updateHabit: async (habit) => {
    await db.habits.put(habit);
    const habits = await db.habits.toArray();
    set({ habits });
  },

  deleteHabit: async (id) => {
    await db.habits.delete(id);
    const habits = await db.habits.toArray();
    set({ habits });
  },

  toggleHabitToday: async (id) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isDoneToday = habit.completedDates.includes(todayStr);
    const completedDates = isDoneToday
      ? habit.completedDates.filter(d => d !== todayStr)
      : [...habit.completedDates, todayStr];

    await db.habits.update(id, { completedDates });
    const habits = await db.habits.toArray();
    set({ habits });
  },

  // GETTERS & EXPANSIONS
  getEventsForDateRange: (start, end) => {
    const { events } = get();
    const expanded: PlannerEvent[] = [];

    events.forEach(event => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);
      const durationMs = eventEnd.getTime() - eventStart.getTime();

      // Non-recurring: check if it overlaps the date range
      if (!event.recurrence || event.recurrence.type === 'none') {
        if (eventStart <= end && eventEnd >= start) {
          expanded.push(event);
        }
        return;
      }

      // Recurring: walk day by day in range and check if recurrence rules match
      let cursor = new Date(start);
      // Start checking from whichever is later: the range start or event start date
      if (cursor < startOfDay(eventStart)) {
        cursor = startOfDay(eventStart);
      }

      while (cursor <= end) {
        if (matchRecurrence(cursor, eventStart, event.recurrence)) {
          const dateStr = format(cursor, 'yyyy-MM-dd');
          const isCompleted = ((event as any).completedDates || []).includes(dateStr);

          // Build a virtual event instance
          const instanceStart = new Date(cursor);
          instanceStart.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0);
          const instanceEnd = new Date(instanceStart.getTime() + durationMs);

          expanded.push({
            ...event,
            id: `${event.id}_${dateStr}`, // Unique virtual ID
            startTime: instanceStart.toISOString(),
            endTime: instanceEnd.toISOString(),
            completed: isCompleted,
            recurrenceParentId: event.id // Link to original
          });
        }
        cursor = addDays(cursor, 1);
      }
    });

    return expanded;
  },

  getTasksForDate: (date) => {
    const targetDateStr = format(date, 'yyyy-MM-dd');
    const { tasks } = get();
    const result: PlannerTask[] = [];

    tasks.forEach(task => {
      // Non-recurring
      if (!task.recurrence || task.recurrence.type === 'none') {
        if (task.dueDate === targetDateStr) {
          result.push(task);
        }
        return;
      }

      // Recurring
      if (task.dueDate) {
        const baseDate = parseISO(task.dueDate);
        if (matchRecurrence(date, baseDate, task.recurrence)) {
          const isCompleted = ((task as any).completedDates || []).includes(targetDateStr);
          result.push({
            ...task,
            id: `${task.id}_${targetDateStr}`, // virtual id
            completed: isCompleted,
            dueDate: targetDateStr
          });
        }
      }
    });

    return result.sort((a, b) => a.order - b.order);
  },

  getTasksForDateRange: (start, end) => {
    const result: PlannerTask[] = [];
    let cursor = new Date(start);
    while (cursor <= end) {
      result.push(...get().getTasksForDate(cursor));
      cursor = addDays(cursor, 1);
    }
    return result;
  }
}));
