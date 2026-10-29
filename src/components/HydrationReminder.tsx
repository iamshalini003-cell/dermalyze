/**
 * HydrationReminder.tsx
 * Hourly water hydration tracker.
 *
 * Features:
 * - Tracks number of glasses consumed (150–250 ml each)
 * - Customisable glass size (150 / 200 / 250 ml)
 * - Manual "I drank a glass" button
 * - "Remind me" button → browser notification + phone vibration
 * - Daily goal progress bar (target: 8 × 200 ml = 1600 ml default)
 * - Reminder scheduling — notification every N minutes (default 60)
 * - State persisted to localStorage so it survives page refresh
 */

import { useEffect, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dermalyze-hydration-v1';
const DEFAULT_ML = 200;
const DEFAULT_GLASSES = 8;

interface HydrationState {
  date: string;       // ISO date string YYYY-MM-DD
  glasses: number;    // glasses consumed today
  ml: number;         // ml per glass
  goal: number;       // daily glass goal
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): HydrationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed: HydrationState = JSON.parse(raw);
    // Reset counter each new day
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), glasses: 0, ml: parsed.ml ?? DEFAULT_ML, goal: parsed.goal ?? DEFAULT_GLASSES };
    }
    return parsed;
  } catch {
    return { date: todayKey(), glasses: 0, ml: DEFAULT_ML, goal: DEFAULT_GLASSES };
  }
}

function saveState(s: HydrationState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendNotification(ml: number) {
  if (Notification.permission === 'granted') {
    new Notification('💧 Time to hydrate!', {
      body: `Drink a glass of water (${ml} ml) — your skin will thank you.`,
      icon: '/favicon.ico',
      tag: 'hydration-reminder',
    });
  }
}

function vibrate() {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HydrationReminder() {
  const [state, setState] = useState<HydrationState>(loadState);
  const [intervalMin, setIntervalMin] = useState(60);
  const [reminderActive, setReminderActive] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist state on change
  useEffect(() => { saveState(state); }, [state]);

  // Sync date (reset at midnight)
  useEffect(() => {
    const id = setInterval(() => {
      const today = todayKey();
      setState((s) => {
        if (s.date !== today) return { ...s, date: today, glasses: 0 };
        return s;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Reminder scheduling
  useEffect(() => {
    if (!reminderActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setNextReminder(null);
      setCountdown('');
      return;
    }

    const fire = () => {
      sendNotification(state.ml);
      vibrate();
      const next = new Date(Date.now() + intervalMin * 60_000);
      setNextReminder(next);
    };

    // Fire immediately on activation
    fire();
    intervalRef.current = setInterval(fire, intervalMin * 60_000);

    // Countdown display
    countdownRef.current = setInterval(() => {
      setNextReminder((n) => {
        if (!n) return n;
        const diff = n.getTime() - Date.now();
        if (diff <= 0) return n;
        const m = Math.floor(diff / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
        return n;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderActive, intervalMin]);

  async function toggleReminder() {
    if (reminderActive) {
      setReminderActive(false);
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission('Notification' in window ? Notification.permission : 'denied');
    if (!granted) {
      alert('Please allow notifications in your browser settings to enable reminders.');
      return;
    }
    setReminderActive(true);
  }

  function drinkGlass() {
    setState((s) => ({ ...s, glasses: s.glasses + 1 }));
  }

  function undoGlass() {
    setState((s) => ({ ...s, glasses: Math.max(0, s.glasses - 1) }));
  }

  const totalMl = state.glasses * state.ml;
  const goalMl = state.goal * state.ml;
  const progress = Math.min(1, totalMl / goalMl);
  const pct = Math.round(progress * 100);

  return (
    <section className="card hydration-card">
      <h3 className="hydration-title">💧 Hydration Tracker</h3>
      <p className="muted">
        Skin needs water from the inside. Aim for {state.goal} glasses of {state.ml} ml ({goalMl} ml) per day.
      </p>

      {/* Progress bar */}
      <div className="hydration-progress-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="hydration-bar"
          style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--accent)' : '#4db6f5' }}
        />
      </div>
      <p className="hydration-progress-label">
        {totalMl} ml / {goalMl} ml ({pct}%)
        {pct >= 100 && <span className="hydration-done"> 🎉 Goal reached!</span>}
      </p>

      {/* Glass icons */}
      <div className="hydration-glasses" aria-label={`${state.glasses} glasses drunk`}>
        {Array.from({ length: state.goal }).map((_, i) => (
          <span
            key={i}
            className={`hydration-glass ${i < state.glasses ? 'hydration-glass-full' : ''}`}
            title={i < state.glasses ? 'Drunk' : 'Not yet'}
          >
            {i < state.glasses ? '💧' : '○'}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="hydration-controls">
        <button className="primary" onClick={drinkGlass} type="button">
          + I drank a glass ({state.ml} ml)
        </button>
        {state.glasses > 0 && (
          <button className="link" onClick={undoGlass} type="button" style={{ marginTop: 4 }}>
            Undo last
          </button>
        )}
      </div>

      {/* Settings row */}
      <details className="hydration-settings">
        <summary className="hydration-settings-toggle">⚙ Settings</summary>
        <div className="hydration-settings-body">
          <label className="q-label">
            Glass size (ml)
            <select
              className="q-select"
              value={state.ml}
              onChange={(e) => setState((s) => ({ ...s, ml: Number(e.target.value) }))}
            >
              <option value={150}>150 ml (small)</option>
              <option value={200}>200 ml (standard)</option>
              <option value={250}>250 ml (large)</option>
            </select>
          </label>
          <label className="q-label">
            Daily glass goal
            <select
              className="q-select"
              value={state.goal}
              onChange={(e) => setState((s) => ({ ...s, goal: Number(e.target.value) }))}
            >
              {[6, 7, 8, 9, 10, 12].map((n) => (
                <option key={n} value={n}>{n} glasses</option>
              ))}
            </select>
          </label>
          <label className="q-label">
            Reminder interval
            <select
              className="q-select"
              value={intervalMin}
              onChange={(e) => { setIntervalMin(Number(e.target.value)); setReminderActive(false); }}
            >
              <option value={30}>Every 30 min</option>
              <option value={45}>Every 45 min</option>
              <option value={60}>Every hour</option>
              <option value={90}>Every 90 min</option>
              <option value={120}>Every 2 hours</option>
            </select>
          </label>
        </div>
      </details>

      {/* Reminder button */}
      <div className="hydration-reminder-row">
        <button
          className={reminderActive ? 'secondary hydration-stop-btn' : 'secondary'}
          onClick={toggleReminder}
          type="button"
        >
          {reminderActive ? '🔔 Stop reminders' : '🔔 Start hourly reminders'}
        </button>
        {notifPermission === 'denied' && (
          <p className="error" style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>
            Notifications are blocked in your browser — please enable them in site settings.
          </p>
        )}
        {reminderActive && countdown && (
          <p className="muted" style={{ marginTop: 4 }}>
            Next reminder in <strong>{countdown}</strong>
          </p>
        )}
      </div>
    </section>
  );
}
