export type CategoryType = '学习' | '睡觉' | '刷手机' | '游戏' | '信息工作' | '户外' | '写笔记' | '休息' | '琐事' | '运动' | '未记录';

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

export interface Goal {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryType;
}

export type QuadrantType = '重要且紧急' | '重要不紧急' | '不重要但紧急' | '不重要不紧急';

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
