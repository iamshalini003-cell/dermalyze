/**
 * Timeline.tsx
 * Progress Timeline & Photo Comparison for the History tab.
 *
 * Features:
 * - Chronological photo log (oldest → newest) with severity-colour dots
 * - Tap two photos to select Before / After
 * - Interactive drag-to-compare Before/After slider
 * - "What Changed" delta report between selected entries
 */

import { useEffect, useRef, useState } from 'react';
import { listAnalyses, photoUrl, type SavedAnalysis } from '../lib/api';
import type { Severity } from '../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoadedEntry {
  item: SavedAnalysis;
  url: string;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEV_ORDER: Record<Severity, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };

function sevLabel(s: Severity) {
  return ({ none: 'None', mild: 'Mild', moderate: 'Moderate', severe: 'Severe' } as const)[s] ?? s;
}

function sevDelta(before: Severity, after: Severity): { label: string; cls: string } {
  const d = SEV_ORDER[after] - SEV_ORDER[before];
  if (d === 0) return { label: 'No change', cls: 'delta-neutral' };
  if (d < 0) return { label: `Improved (${sevLabel(before)} → ${sevLabel(after)})`, cls: 'delta-better' };
  return { label: `Worsened (${sevLabel(before)} → ${sevLabel(after)})`, cls: 'delta-worse' };
}

// ─── What Changed report ──────────────────────────────────────────────────────

function WhatChanged({ before, after }: { before: LoadedEntry; after: LoadedEntry }) {
  const br = before.item.result;
  const ar = after.item.result;
  const daysBetween = Math.round(
    (new Date(after.item.createdAt).getTime() - new Date(before.item.createdAt).getTime()) /
      86_400_000,
  );

  const acneDelta = sevDelta(br.acne.severity, ar.acne.severity);
  const dcDelta   = sevDelta(br.darkCircles.severity, ar.darkCircles.severity);
  const pigDelta  = sevDelta(br.pigmentation.severity, ar.pigmentation.severity);

  const improved = [acneDelta, dcDelta, pigDelta].filter((d) => d.cls === 'delta-better').length;
  const worsened = [acneDelta, dcDelta, pigDelta].filter((d) => d.cls === 'delta-worse').length;

  const summary =
    improved > 0 && worsened === 0
      ? `🎉 Overall improvement over ${daysBetween} day${daysBetween !== 1 ? 's' : ''}!`
      : worsened > 0 && improved === 0
      ? `📉 Things got a little harder over ${daysBetween} day${daysBetween !== 1 ? 's' : ''}. Don't give up — consistency pays off.`
      : `Mixed picture over ${daysBetween} day${daysBetween !== 1 ? 's' : ''} — some areas improved, others need attention.`;

  return (
    <div className="what-changed">
      <h4 className="wc-heading">What Changed</h4>
      <p className="wc-summary">{summary}</p>
      <div className="wc-table-wrap">
        <table className="wc-table">
          <thead>
            <tr>
              <th>Concern</th>
              <th>Before</th>
              <th>After</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Acne</td>
              <td><span className={`chip chip-${br.acne.severity}`}>{sevLabel(br.acne.severity)}</span></td>
              <td><span className={`chip chip-${ar.acne.severity}`}>{sevLabel(ar.acne.severity)}</span></td>
              <td><span className={acneDelta.cls}>{acneDelta.label}</span></td>
            </tr>
            <tr>
              <td>Dark circles</td>
              <td><span className={`chip chip-${br.darkCircles.severity}`}>{sevLabel(br.darkCircles.severity)}</span></td>
              <td><span className={`chip chip-${ar.darkCircles.severity}`}>{sevLabel(ar.darkCircles.severity)}</span></td>
              <td><span className={dcDelta.cls}>{dcDelta.label}</span></td>
            </tr>
            <tr>
              <td>Pigmentation</td>
              <td><span className={`chip chip-${br.pigmentation.severity}`}>{sevLabel(br.pigmentation.severity)}</span></td>
              <td><span className={`chip chip-${ar.pigmentation.severity}`}>{sevLabel(ar.pigmentation.severity)}</span></td>
              <td><span className={pigDelta.cls}>{pigDelta.label}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      {before.item.note && <p className="wc-note"><strong>Before note:</strong> {before.item.note}</p>}
      {after.item.note  && <p className="wc-note"><strong>After note:</strong>  {after.item.note}</p>}
    </div>
  );
}

// ─── Before/After slider ─────────────────────────────────────────────────────

function ComparisonSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percentage 0-100
  const dragging = useRef(false);

  function calcPos(clientX: number): number {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setPos(calcPos(e.clientX));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setPos(calcPos(e.clientX));
  }
  function onPointerUp() { dragging.current = false; }

  return (
    <div
      ref={containerRef}
      className="slider-container"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="slider"
      aria-label="Drag to compare before and after photos"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft')  setPos((p) => Math.max(0,   p - 5));
        if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5));
      }}
    >
      {/* After image — full width, underneath */}
      <img src={afterUrl}  alt="After"  className="slider-img" />

      {/* Before image — clipped to left of handle */}
      <div className="slider-before-clip" style={{ width: `${pos}%` }}>
        <img src={beforeUrl} alt="Before" className="slider-img" style={{ width: containerRef.current?.clientWidth ?? '100%' }} />
      </div>

      {/* Drag handle */}
      <div className="slider-handle" style={{ left: `${pos}%` }}>
        <div className="slider-line" />
        <div className="slider-grip" aria-hidden="true">◀▶</div>
      </div>

      {/* Corner labels */}
      <span className="slider-label slider-label-before">BEFORE</span>
      <span className="slider-label slider-label-after">AFTER</span>
    </div>
  );
}

// ─── Single timeline dot/card ─────────────────────────────────────────────────

function TimelineDot({
  entry,
  role,
  onSelect,
}: {
  entry: LoadedEntry;
  role: 'before' | 'after' | null;
  onSelect: () => void;
}) {
  const r = entry.item.result;
  const worst = Math.max(
    SEV_ORDER[r.acne.severity],
    SEV_ORDER[r.darkCircles.severity],
    SEV_ORDER[r.pigmentation.severity],
  );
  const dotClass = ['none', 'mild', 'moderate', 'severe'][worst] ?? 'none';

  return (
    <button
      type="button"
      className={`tl-dot-btn ${role ? 'tl-dot-selected' : ''}`}
      onClick={onSelect}
      aria-label={`Select ${new Date(entry.item.createdAt).toLocaleDateString()} photo`}
      aria-pressed={role !== null}
    >
      {/* Severity indicator */}
      <span className={`tl-sev-dot tl-sev-${dotClass}`} />

      {/* Thumbnail */}
      {entry.url
        ? <img src={entry.url} alt="" className="tl-thumb" />
        : <div className="tl-thumb tl-thumb-empty" />
      }

      {/* Date */}
      <span className="tl-date">{new Date(entry.item.createdAt).toLocaleDateString()}</span>

      {/* Before / After badge */}
      {role && (
        <span className={`tl-role tl-role-${role}`}>
          {role === 'before' ? 'BEFORE' : 'AFTER'}
        </span>
      )}
    </button>
  );
}

// ─── Main Timeline component ─────────────────────────────────────────────────

export default function Timeline({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries]   = useState<LoadedEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [beforeIdx, setBeforeIdx] = useState<number | null>(null);
  const [afterIdx,  setAfterIdx]  = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    listAnalyses()
      .then(async (items) => {
        // Keep only entries with a visible face + photo; show oldest first
        const sorted = [...items]
          .filter((i) => i.result.faceVisible && i.photoPath)
          .reverse();

        const loaded = await Promise.all(
          sorted.map(async (item) => {
            const url = await photoUrl(item.photoPath).catch(() => '');
            return { item, url };
          }),
        );
        setEntries(loaded);

        // Auto-select first and last if we have ≥ 2
        if (loaded.length >= 2) {
          setBeforeIdx(0);
          setAfterIdx(loaded.length - 1);
        } else {
          setBeforeIdx(null);
          setAfterIdx(null);
        }
      })
      .catch(() => setError('Could not load your photo history.'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  /** Tap logic:
   *  - Nothing selected → set as before
   *  - Before set, no after → set as after (swap if needed so order is chronological)
   *  - Both set → reset and set tapped as new before
   */
  function selectEntry(idx: number) {
    if (beforeIdx === null) {
      setBeforeIdx(idx);
      return;
    }
    if (afterIdx === null) {
      if (idx === beforeIdx) { setBeforeIdx(null); return; }
      if (idx < beforeIdx) { setAfterIdx(beforeIdx); setBeforeIdx(idx); }
      else                 { setAfterIdx(idx); }
      return;
    }
    // reset
    setBeforeIdx(idx);
    setAfterIdx(null);
  }

  if (loading) return <p className="muted" style={{ padding: '8px 0' }}>Loading timeline…</p>;
  if (error)   return <p className="error">{error}</p>;

  if (entries.length === 0) {
    return (
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Progress Timeline</h3>
        <p className="muted">No analysed photos yet. Use the Analyze tab to capture your first photo.</p>
      </section>
    );
  }

  const beforeEntry = beforeIdx !== null ? entries[beforeIdx] : null;
  const afterEntry  = afterIdx  !== null ? entries[afterIdx]  : null;
  const canCompare  = beforeEntry !== null && afterEntry !== null;

  return (
    <div>
      {/* ── Timeline strip ── */}
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Progress Timeline</h3>

        <p className="muted" style={{ marginBottom: 10 }}>
          Tap a photo to set <strong>Before</strong>, then tap another to set <strong>After</strong>.
          The slider below will update automatically.
        </p>

        {/* Severity legend */}
        <div className="tl-legend">
          <span className="tl-sev-dot tl-sev-none" />None &nbsp;
          <span className="tl-sev-dot tl-sev-mild" />Mild &nbsp;
          <span className="tl-sev-dot tl-sev-moderate" />Moderate &nbsp;
          <span className="tl-sev-dot tl-sev-severe" />Severe
        </div>

        <div className="tl-strip">
          <div className="tl-connector-line" />
          <div className="tl-dots-row">
            {entries.map((entry, i) => (
              <TimelineDot
                key={entry.item.id}
                entry={entry}
                role={i === beforeIdx ? 'before' : i === afterIdx ? 'after' : null}
                onSelect={() => selectEntry(i)}
              />
            ))}
          </div>
        </div>

        {beforeIdx !== null && afterIdx === null && (
          <p className="muted" style={{ marginTop: 6, fontSize: '0.85rem' }}>
            Now tap another photo to set the <strong>After</strong> point.
          </p>
        )}
      </section>

      {/* ── Comparison slider + report ── */}
      {canCompare && (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Before / After Comparison</h3>
          <p className="muted" style={{ marginBottom: 10 }}>
            Drag the handle (or use ← → keys) to reveal each photo.
          </p>
          <ComparisonSlider beforeUrl={beforeEntry!.url} afterUrl={afterEntry!.url} />
          <WhatChanged before={beforeEntry!} after={afterEntry!} />
        </section>
      )}

      {!canCompare && entries.length < 2 && (
        <section className="card">
          <p className="muted">Analyse more photos over time to unlock the Before/After comparison.</p>
        </section>
      )}
    </div>
  );
}
