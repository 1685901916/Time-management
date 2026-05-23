import type Database from 'better-sqlite3';

interface TimerRow {
  goal_data: string;
  started_at: number;
  note: string;
}

export interface FinishedTimerEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  note: string;
  durationMinutes: number;
  linkedGoalId?: string;
  photos: [];
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (date: Date) =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

export function finishActiveTimerTransaction(db: Database.Database, userId: number, endedAt = Date.now()) {
  const finish = db.transaction((currentUserId: number, currentEndedAt: number) => {
    const timer = db
      .prepare('SELECT goal_data, started_at, note FROM active_timers WHERE user_id = ?')
      .get(currentUserId) as TimerRow | undefined;

    if (!timer) {
      return { created: false, entry: null as FinishedTimerEntry | null };
    }

    let goal: any = null;
    try {
      goal = JSON.parse(timer.goal_data);
    } catch {
      goal = {};
    }

    const start = new Date(timer.started_at);
    const end = new Date(currentEndedAt);
    const durationMinutes = Math.max(1, Math.floor((currentEndedAt - timer.started_at) / 60000));
    const date = getLocalDateString(end);
    const startTime = formatTime(start);
    const endTime = formatTime(end);
    const category = typeof goal?.category === 'string' && goal.category.trim() ? goal.category : '未记录';
    const linkedGoalId = goal?.id && /^\d+$/.test(String(goal.id)) ? String(goal.id) : null;
    const note = timer.note || '';

    const result = db
      .prepare(
        `INSERT INTO time_entries
          (user_id, date, start_time, end_time, category, note, duration_minutes, linked_goal_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(currentUserId, date, startTime, endTime, category, note, durationMinutes, linkedGoalId);

    db.prepare('DELETE FROM active_timers WHERE user_id = ?').run(currentUserId);

    return {
      created: true,
      entry: {
        id: String(result.lastInsertRowid),
        date,
        startTime,
        endTime,
        category,
        note,
        durationMinutes,
        linkedGoalId: linkedGoalId || undefined,
        photos: [],
      },
    };
  });

  return finish(userId, endedAt);
}
