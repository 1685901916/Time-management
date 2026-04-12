import { useState, useCallback } from 'react';
import type { TimeEntry } from '../types';
import * as entriesApi from '../api/entries';

export function useEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const data = await entriesApi.getEntries(date);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (data: Partial<TimeEntry>): Promise<TimeEntry | null> => {
    try {
      const entry = await entriesApi.createEntry(data);
      setEntries(prev => [...prev, entry]);
      return entry;
    } catch (err) {
      console.error('Failed to create entry:', err);
      return null;
    }
  }, []);

  const updateEntry = useCallback(async (id: string, data: Partial<TimeEntry>): Promise<TimeEntry | null> => {
    try {
      const entry = await entriesApi.updateEntry(id, data);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, ...entry } : e));
      return entry;
    } catch (err) {
      console.error('Failed to update entry:', err);
      return null;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await entriesApi.deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  }, []);

  const addPhotoToEntry = useCallback(async (entryId: string, file: File) => {
    try {
      const photo = await entriesApi.uploadPhoto(entryId, file);
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, photos: [...(e.photos || []), photo] } : e
      ));
      return photo;
    } catch (err) {
      console.error('Failed to upload photo:', err);
      return null;
    }
  }, []);

  const removePhotoFromEntry = useCallback(async (entryId: string, photoId: string) => {
    try {
      await entriesApi.deletePhoto(entryId, photoId);
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, photos: (e.photos || []).filter(p => p.id !== photoId) } : e
      ));
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  }, []);

  return {
    entries, loading, fetchEntries, createEntry, updateEntry, deleteEntry,
    addPhotoToEntry, removePhotoFromEntry,
  };
}
