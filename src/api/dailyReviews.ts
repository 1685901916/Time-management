import client from './client';
import type { DailyReview } from '../types';

export async function getDailyReview(date: string): Promise<DailyReview | null> {
  const res = await client.get('/daily-reviews', { params: { date } });
  return res.data.review;
}

export async function saveDailyReview(date: string, content: string): Promise<DailyReview> {
  const res = await client.put('/daily-reviews', { date, content });
  return res.data.review;
}
