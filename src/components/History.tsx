/**
 * History.tsx
 * History tab — Timeline (photo comparison) at top, then the skin diary list below.
 * Includes "Download Doctor Report" button that opens a printable summary modal.
 */

import { useEffect, useState } from 'react';
import { deleteAnalysis, listAnalyses, photoUrl, type SavedAnalysis } from '../lib/api';
import ResultCard from './ResultCard';
import Timeline from './Timeline';
import DoctorReport from './DoctorReport';

// ─── Individual diary entry ────────────────────────────────────────────────────

function Entry({ item, onDeleted }: { item: SavedAnalysis; onDeleted: () => void }) {
  const [url, setUrl]   = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    photoUrl(item.photoPath).then(setUrl).catch(() => setUrl(''));
  }, [item.photoPath]);

  async function remove() {
    if (!window.confirm('Delete this photo and its result permanently?')) return;
    await deleteAnalysis(item);
    onDeleted();
  }

  return (
    <li className="entry">
      <div className="entry-row">
        {url ? <img src={url} alt="" /> : <div className="thumb-empty" />}
        <div className="entry-text">
          <strong>{new Date(item.createdAt).toLocaleDateString()}</strong>
          <span className="chips">
            <span className={`chip chip-${item.result.acne.severity}`}>
              Acne: {item.result.acne.severity}
            </span>
            <span className={`chip chip-${item.result.darkCircles.severity}`}>
              Dark circles: {item.result.darkCircles.severity}
            </span>
            <span className={`chip chip-${item.result.pigmentation.severity}`}>
              Pigmentation: {item.result.pigmentation.severity}
            </span>
          </span>
          {item.note && <span className="muted">{item.note}</span>}
        </div>
      </div>
      <div className="entry-actions">
        <button className="link" onClick={() => setOpen(!open)}>
          {open ? 'Hide details' : 'View details'}
        </button>
        <button className="link danger" onClick={remove}>Delete</button>
      </div>
      {open && <ResultCard result={item.result} />}
    </li>
  );
}

// ─── Skin diary list ───────────────────────────────────────────────────────────

function SkinDiary({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<SavedAnalysis[] | null>(null);
  const [error, setError] = useState('');
  const [tick,  setTick]  = useState(0);

  useEffect(() => {
    listAnalyses()
      .then(setItems)
      .catch(() => setError('Could not load your history.'));
  }, [refreshKey, tick]);

  if (error) return <p className="error">{error}</p>;
  if (!items) return <p className="muted">Loading…</p>;
  if (items.length === 0) {
    return (
      <section className="card">
        <h2>No photos yet</h2>
        <p className="muted">Your analyzed photos will appear here.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Skin diary</h2>
      <ul className="entries">
        {items.map((item) => (
          <Entry key={item.id} item={item} onDeleted={() => setTick((t) => t + 1)} />
        ))}
      </ul>
    </section>
  );
}

// ─── Main History component ────────────────────────────────────────────────────

export default function History({ refreshKey }: { refreshKey: number }) {
  const [showReport, setShowReport] = useState(false);

  return (
    <div>
      {/* Doctor Report button */}
      <section className="card history-report-banner">
        <div className="history-report-row">
          <div>
            <strong>Doctor Report</strong>
            <p className="muted" style={{ margin: '2px 0 0' }}>
              Export a printable summary of your skin metrics, trend history, and product audit.
            </p>
          </div>
          <button
            className="secondary report-dl-btn"
            type="button"
            onClick={() => setShowReport(true)}
          >
            📄 Download Report
          </button>
        </div>
      </section>

      {/* Timeline + Before/After comparison */}
      <Timeline refreshKey={refreshKey} />

      {/* Chronological diary list */}
      <SkinDiary refreshKey={refreshKey} />

      {/* Doctor Report modal */}
      {showReport && <DoctorReport onClose={() => setShowReport(false)} />}
    </div>
  );
}
