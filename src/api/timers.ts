import client from './client';
import type { Goal } from '../types';

export interface ActiveTimer {
  goal: Goal;
  startTime: number;
  note: string;
}

export async function getActiveTimer(): Promise<ActiveTimer | null> {
  const { data } = await client.get('/timers');
  return data?.timer ?? null;
}

export async function startActiveTimer(goal: Goal, startTime?: number): Promise<ActiveTimer | null> {
  const { data } = await client.post('/timers/start', { goal, startTime });
  return data?.timer ?? null;
}

export async function updateActiveTimerNote(note: string): Promise<ActiveTimer | null> {
  const { data } = await client.patch('/timers/note', { note });
  return data?.timer ?? null;
}

export async function clearActiveTimer(): Promise<void> {
  await client.delete('/timers');
}
