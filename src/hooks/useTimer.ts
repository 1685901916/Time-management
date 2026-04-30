import { useCallback, useEffect, useRef, useState } from 'react';
import type { Goal } from '../types';
import {
  type ActiveTimer,
  clearActiveTimer,
  getActiveTimer,
  startActiveTimer,
  updateActiveTimerNote,
} from '../api/timers';

const STREAM_ENDPOINT = '/api/timers/stream';

const formatElapsed = (startTime: number) => {
  const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  const h = Math.floor(diff / 3600).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const s = (diff % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const note = activeTimer?.note ?? '';

  // tick: 每秒计算 elapsed
  useEffect(() => {
    if (!activeTimer) {
      setElapsed('00:00:00');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    setElapsed(formatElapsed(activeTimer.startTime));
    intervalRef.current = setInterval(() => {
      setElapsed(formatElapsed(activeTimer.startTime));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer]);

  // 拉取初始状态 + 订阅 SSE
  useEffect(() => {
    let cancelled = false;

    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : '';
    if (!token) {
      setActiveTimer(null);
      return () => {
        cancelled = true;
      };
    }

    getActiveTimer()
      .then((timer) => {
        if (!cancelled) setActiveTimer(timer);
      })
      .catch(() => {
        if (!cancelled) setActiveTimer(null);
      });

    const url = `${STREAM_ENDPOINT}?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    const onSnapshot = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        setActiveTimer(payload || null);
      } catch {
        // ignore
      }
    };
    const onStarted = (event: MessageEvent) => {
      try {
        setActiveTimer(JSON.parse(event.data));
      } catch {
        // ignore
      }
    };
    const onNote = (event: MessageEvent) => {
      try {
        setActiveTimer(JSON.parse(event.data));
      } catch {
        // ignore
      }
    };
    const onStopped = () => setActiveTimer(null);

    source.addEventListener('snapshot', onSnapshot as EventListener);
    source.addEventListener('started', onStarted as EventListener);
    source.addEventListener('note', onNote as EventListener);
    source.addEventListener('stopped', onStopped as EventListener);

    return () => {
      cancelled = true;
      source.removeEventListener('snapshot', onSnapshot as EventListener);
      source.removeEventListener('started', onStarted as EventListener);
      source.removeEventListener('note', onNote as EventListener);
      source.removeEventListener('stopped', onStopped as EventListener);
      source.close();
      eventSourceRef.current = null;
    };
  }, []);

  const getElapsedMinutes = useCallback(() => {
    if (!activeTimer) return 0;
    return Math.floor((Date.now() - activeTimer.startTime) / 60000);
  }, [activeTimer]);

  const startTimer = useCallback(async (goal: Goal) => {
    const timer = await startActiveTimer(goal, Date.now());
    setActiveTimer(timer);
  }, []);

  const clearTimer = useCallback(async () => {
    try {
      await clearActiveTimer();
    } finally {
      setActiveTimer(null);
    }
  }, []);

  const setNote = useCallback((value: string) => {
    setActiveTimer((current) => (current ? { ...current, note: value } : current));
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      updateActiveTimerNote(value).catch(() => {
        // 静默：服务端没有 timer 时会 404，本地状态会被 SSE stopped 修正
      });
    }, 400);
  }, []);

  useEffect(() => () => {
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
  }, []);

  return {
    activeTimer,
    elapsed,
    note,
    isActive: !!activeTimer,
    startTimer,
    clearTimer,
    setNote,
    getElapsedMinutes,
  };
}
