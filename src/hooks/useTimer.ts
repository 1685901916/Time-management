import { useState, useEffect, useRef, useCallback } from 'react';
import type { Goal } from '../types';

interface ActiveTimer {
  startTime: number;
  goal: Goal;
}

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [note, setNote] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeTimer) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const diff = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  const getElapsedMinutes = useCallback(() => {
    if (!activeTimer) return 0;
    return Math.floor((Date.now() - activeTimer.startTime) / 60000);
  }, [activeTimer]);

  const startTimer = useCallback((goal: Goal) => {
    setActiveTimer({ startTime: Date.now(), goal });
    setNote('');
    setElapsed('00:00:00');
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveTimer(null);
    setElapsed('00:00:00');
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
