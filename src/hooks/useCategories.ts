import { useCallback, useState } from 'react';
import type { Category } from '../types';
import * as categoriesApi from '../api/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: { name: string; color: string }) => {
    try {
      const category = await categoriesApi.createCategory(data);
      setCategories((prev) => [...prev.filter((item) => item.id !== category.id), category]);
      return category;
    } catch (err) {
      console.error('Failed to create category:', err);
      return null;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: { name?: string; color?: string; sortOrder?: number }) => {
    try {
      const category = await categoriesApi.updateCategory(id, data);
      setCategories((prev) => prev.map((item) => (item.id === id ? category : item)));
      return category;
    } catch (err) {
      console.error('Failed to update category:', err);
      return null;
    }
  }, []);

  const reorderCategories = useCallback(async (categoryIds: string[]) => {
    try {
      await categoriesApi.reorderCategories(categoryIds);
      setCategories((prev) =>
        categoryIds
          .map((id, index) => {
            const category = prev.find((item) => item.id === id);
            return category ? { ...category, sortOrder: index + 1 } : null;
          })
          .filter(Boolean) as Category[]
      );
    } catch (err) {
      console.error('Failed to reorder categories:', err);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await categoriesApi.deleteCategory(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  }, []);

  return { categories, loading, fetchCategories, createCategory, updateCategory, reorderCategories, deleteCategory };
}
