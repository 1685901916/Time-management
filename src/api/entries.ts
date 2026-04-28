import client from './client';
import type { TimeEntry } from '../types';

export async function getEntries(date: string): Promise<TimeEntry[]> {
  const res = await client.get('/entries', { params: { date } });
  return res.data.entries;
}

export async function getEntriesRange(from: string, to: string): Promise<TimeEntry[]> {
  const res = await client.get('/entries', { params: { from, to } });
  return res.data.entries;
}

export async function createEntry(data: Partial<TimeEntry>): Promise<TimeEntry> {
  const res = await client.post('/entries', {
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    category: data.category,
    note: data.note,
    linkedTodoId: data.linkedTodoId,
    linkedGoalId: data.linkedGoalId,
  });
  return res.data.entry;
}

export async function updateEntry(id: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
  const res = await client.put(`/entries/${id}`, {
    startTime: data.startTime,
    endTime: data.endTime,
    category: data.category,
    note: data.note,
    linkedTodoId: data.linkedTodoId,
    linkedGoalId: data.linkedGoalId,
  });
  return res.data.entry;
}

export async function deleteEntry(id: string): Promise<void> {
  await client.delete(`/entries/${id}`);
}

export async function uploadPhoto(entryId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post(`/entries/${entryId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.photo;
}

export async function deletePhoto(entryId: string, photoId: string): Promise<void> {
  await client.delete(`/entries/${entryId}/photos/${photoId}`);
}

export async function getStats() {
  const res = await client.get('/stats');
  return res.data.stats;
}
