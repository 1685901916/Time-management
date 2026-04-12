import { useState, useCallback } from 'react';
import type { Goal } from '../types';
import * as goalsApi from '../api/goals';

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goalsApi.getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (data: { title: string; subtitle: string; category: string }) => {
    try {
      const goal = await goalsApi.createGoal(data);
      setGoals(prev => [...prev, goal]);
      return goal;
    } catch (err) {
      console.error('Failed to create goal:', err);
      return null;
    }
  }, []);

  const updateGoal = useCallback(async (id: string, data: { title?: string; subtitle?: string; category?: string }) => {
    try {
      const goal = await goalsApi.updateGoal(id, data);
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goal } : g));
      return goal;
    } catch (err) {
      console.error('Failed to update goal:', err);
      return null;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await goalsApi.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  }, []);

  return { goals, loading, fetchGoals, createGoal, updateGoal, deleteGoal };
}
