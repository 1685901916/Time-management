import client from './client';
import type { Todo } from '../types';

export async function getTodos(date?: string): Promise<Todo[]> {
  const res = await client.get('/todos', { params: date ? { date } : {} });
  return res.data.todos;
}

export async function createTodo(data: Partial<Todo>): Promise<Todo> {
  const res = await client.post('/todos', {
    title: data.title,
    quadrant: data.quadrant,
    note: data.note,
    date: data.date,
  });
  return res.data.todo;
}

export async function updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
  const res = await client.put(`/todos/${id}`, data);
  return res.data.todo;
}

export async function deleteTodo(id: string): Promise<void> {
  await client.delete(`/todos/${id}`);
}
