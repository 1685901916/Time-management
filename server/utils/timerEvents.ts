import type { Response } from 'express';

type TimerEvent = 'started' | 'stopped' | 'note' | 'snapshot' | 'ping';

const subscribers = new Map<number, Set<Response>>();

export function subscribe(userId: number, res: Response) {
  if (!subscribers.has(userId)) {
    subscribers.set(userId, new Set());
  }
  subscribers.get(userId)!.add(res);
}

export function unsubscribe(userId: number, res: Response) {
  const set = subscribers.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) {
    subscribers.delete(userId);
  }
}

export function emit(userId: number, event: TimerEvent, payload: unknown) {
  const set = subscribers.get(userId);
  if (!set) return;
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(data);
    } catch {
      // ignore broken pipe; cleanup happens on close handler
    }
  }
}
