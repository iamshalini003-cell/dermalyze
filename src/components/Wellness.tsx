/**
 * Wellness.tsx
 * The "Wellness" tab — shows the Hydration Tracker and the user's last generated routine.
 * If no routine has been generated yet, prompts the user to run the questionnaire
 * from the Analyze tab.
 */

import { useEffect, useState } from 'react';
import HydrationReminder from './HydrationReminder';
import RoutineCard from './RoutineCard';
import type { HolisticRoutine } from '../lib/routine';

const ROUTINE_STORAGE_KEY = 'dermalyze-last-routine-v1';

function loadStoredRoutine(): HolisticRoutine | null {
  try {
    const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HolisticRoutine;
  } catch {
    return null;
  }
}

export function saveRoutineToStorage(r: HolisticRoutine) {
  try { localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

export default function Wellness() {
  const [routine, setRoutine] = useState<HolisticRoutine | null>(null);

  useEffect(() => {
    setRoutine(loadStoredRoutine());
  }, []);

  return (
    <div>
      {/* Water tracker is always visible */}
      <HydrationReminder />

      {/* Routine section */}
      {routine ? (
        <RoutineCard routine={routine} />
      ) : (
        <section className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Your personalised routine</h3>
          <p className="muted">
            You haven't generated a routine yet. Go to the <strong>Analyze</strong> tab, take a
            photo, and fill in the questionnaire — your full AM/PM routine, diet plan, sleep
            schedule, and yoga guide will appear here automatically.
          </p>
        </section>
      )}
    </div>
  );
}
