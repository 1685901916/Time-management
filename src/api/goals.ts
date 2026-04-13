import client from './client';
import type { Goal } from '../types';

export async function getGoals(): Promise<Goal[]> {
  const res = await client.get('/goals');
  return res.data.goals;
}

export async function createGoal(data: { title: string; subtitle: string; category: string; color?: string }): Promise<Goal> {
  const res = await client.post('/goals', data);
  return res.data.goal;
}

export async function updateGoal(id: string, data: { title?: string; subtitle?: string; category?: string; color?: string; sortOrder?: number }): Promise<Goal> {
  const res = await client.put(`/goals/${id}`, data);
  return res.data.goal;
}

export async function reorderGoals(goalIds: string[]): Promise<void> {
  await client.put('/goals/reorder/all', { goalIds });
}

export async function deleteGoal(id: string): Promise<void> {
  await client.delete(`/goals/${id}`);
}
