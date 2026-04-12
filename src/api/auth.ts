import client from './client';
import type { AuthResponse } from '../types';

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/login', { username, password });
  return res.data;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/register', { username, password });
  return res.data;
}

export async function getProfile() {
  const res = await client.get('/auth/me');
  return res.data;
}
