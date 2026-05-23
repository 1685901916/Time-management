import type { CategoryType, QuadrantType } from '../constants';

export type { CategoryType, QuadrantType } from '../constants';

export interface EntryPhoto {
  id: string;
  entryId: string;
  filePath: string;
  caption: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime: string;
  category: CategoryType;
  note?: string;
  durationMinutes: number;
  date: string;
  isArchived?: boolean;
  photos?: EntryPhoto[];
  linkedTodoId?: string;
  linkedGoalId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder?: number;
}

export interface Goal {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  color?: string;
  sortOrder?: number;
}

export interface DailyReview {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  quadrant: QuadrantType;
  date?: string;
  note?: string;
  isArchived?: boolean;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Stats {
  totalEntries: number;
  distinctDays: number;
  recordRate: number;
}
