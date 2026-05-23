import client from './client';
import type { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const res = await client.get('/categories');
  return res.data.categories;
}

export async function createCategory(data: { name: string; color: string }): Promise<Category> {
  const res = await client.post('/categories', data);
  return res.data.category;
}

export async function updateCategory(id: string, data: { name?: string; color?: string; sortOrder?: number }): Promise<Category> {
  const res = await client.put(`/categories/${id}`, data);
  return res.data.category;
}

export async function reorderCategories(categoryIds: string[]): Promise<void> {
  await client.put('/categories/reorder/all', { categoryIds });
}

export async function deleteCategory(id: string): Promise<void> {
  await client.delete(`/categories/${id}`);
}
