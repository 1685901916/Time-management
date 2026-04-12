import { useState, useCallback } from 'react';
import type { Todo } from '../types';
import * as todosApi from '../api/todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async (date?: string) => {
    setLoading(true);
    try {
      const data = await todosApi.getTodos(date);
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTodo = useCallback(async (data: Partial<Todo>) => {
    try {
      const todo = await todosApi.createTodo(data);
      setTodos(prev => [todo, ...prev]);
      return todo;
    } catch (err) {
      console.error('Failed to create todo:', err);
      return null;
    }
  }, []);

  const updateTodo = useCallback(async (id: string, data: Partial<Todo>) => {
    try {
      const todo = await todosApi.updateTodo(id, data);
      setTodos(prev => prev.map(t => t.id === id ? { ...t, ...todo } : t));
      return todo;
    } catch (err) {
      console.error('Failed to update todo:', err);
      return null;
    }
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    try {
      await todosApi.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    await updateTodo(id, { completed: !todo.completed });
  }, [todos, updateTodo]);

  return { todos, loading, fetchTodos, createTodo, updateTodo, deleteTodo, toggleTodo };
}
