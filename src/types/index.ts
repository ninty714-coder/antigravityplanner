// src/types/index.ts

export type Priority = 'low' | 'medium' | 'high';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc. (for weekly recurrence)
  dayOfMonth?: number; // 1-31 (for monthly recurrence)
  endDate?: string; // ISO String for end boundary
}

export interface ReminderSetting {
  id: string;
  minutesBefore: number; // e.g., 15 minutes before event
  triggered: boolean;
}

export interface Category {
  id: string; // UUID
  name: string;
  color: string; // Tailwind bg color class or HEX (e.g. 'bg-indigo-500')
  icon: string; // Lucide icon identifier (e.g. 'Briefcase')
}

export interface PlannerEvent {
  id: string; // UUID
  title: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  categoryId: string; // References Category.id
  location?: string;
  notes?: string;
  checklist: ChecklistItem[];
  reminders: ReminderSetting[];
  recurrence: RecurrenceRule;
  recurrenceParentId?: string; // Links instance to template
  completed: boolean;
  completedDates?: string[]; // For recurring completion dates YYYY-MM-DD
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface PlannerTask {
  id: string; // UUID
  title: string;
  categoryId: string; // References Category.id
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  timeSlot?: {
    startTime: string; // 'HH:MM'
    endTime: string;   // 'HH:MM'
  }; // Optional slot in calendar timeline if dragged there
  order: number; // Drag and drop sort order
  checklist: ChecklistItem[];
  recurrence: RecurrenceRule;
  completed: boolean;
  completedAt?: string; // ISO String
  createdAt: string; // ISO String
  notes?: string; // Additional details
  completedDates?: string[]; // For recurring completion dates YYYY-MM-DD
  tags?: string[]; // Free-form labels, in addition to the single Category
  status?: TaskStatus; // Used by the Kanban board (defaults from `completed` if absent)
}

export interface Habit {
  id: string; // UUID
  title: string;
  icon: string; // Lucide icon identifier
  color: string; // HEX
  targetDaysPerWeek: number; // e.g. 5 (used for weekly completion rate)
  completedDates: string[]; // YYYY-MM-DD, days the habit was checked off
  createdAt: string; // ISO String
}

export interface ProductivityStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string; // YYYY-MM-DD
}

export interface WeeklyStat {
  weekStarting: string; // YYYY-MM-DD
  completionRate: number; // Percentage (0-100)
  totalTasksCompleted: number;
  timeSpentByCategory: Record<string, number>; // categoryId -> total minutes/count
  dailyCompletionCount: number[]; // Array of 7 numbers corresponding to Mon-Sun
}
