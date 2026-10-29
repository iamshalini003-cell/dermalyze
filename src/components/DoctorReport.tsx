/**
 * DoctorReport.tsx
 * A printable / exportable skin health summary report.
 *
 * Contains:
 *  – Patient + report header (date, disclaimer)
 *  – Latest skin analysis metrics (acne, dark circles, pigmentation)
 *  – AI summary & next step
 *  – Historical trend table (all saved analyses)
 *  – Current product list + ingredient audit flags
 *
 * Rendered inside a modal overlay. The "Print / Save as PDF" button calls
 * window.print(), which is matched by @media print rules in styles.css so
 * only the report body is printed — not the modal chrome or app UI.
 */

import { useEffect, useRef, useState } from 'react';
import { listAnalyses, photoUrl, type SavedAnalysis } from '../lib/api';
import { loadProfile, type ProfileData } from '../lib/profile';
import { flagIngredients } from '../lib/ingredients';
import { DISCLAIMER, type Severity } from '../lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEV_LABEL: Record<Severity, string> = {
  none: 'None', mild: 'Mild', moderate: 'Moderate', severe: 'Severe',
};
const SEV_ORDER: Record<Severity, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };

function trend(items: SavedAnalysis[], key: 'acne' | 'darkCircles' | 'pigmentation'): string {
  if (items.length < 2) return '—';
  const first = SEV_ORDER[items[items.length - 1].result[key].severity];
  const last  = SEV_ORDER[items[0].result[key].severity];
  if (last < first) return '↓ Improving';
  if (last > first) return '↑ Worsening';
  return '→ Stable';
}

function trendCls(t: string) {
  if (t.startsWith('↓')) return 'rep-trend-better';
  if (t.startsWith('↑')) return 'rep-trend-worse';
  return 'rep-trend-stable';
}

// ─── Report body (also what gets printed) ────────────────────────────────────

interface ReportBodyProps {
  analyses: SavedAnalysis[];
  profile:  ProfileData;
  latestUrl: string;
}

function ReportBody({ analyses, profile, latestUrl }: ReportBodyProps) {
  const latest   = analyses[0];
  const r        = latest?.result;
  const now      = new Date().toLocaleDateString('en-AU', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const acneTrend = trend(analyses, 'acne');
  const dcTrend   = trend(analyses, 'darkCircles');
  const pigTrend  = trend(analyses, 'pigmentation');

  return (
    <div className="rep-body" id="doctor-report-body">
      {/* ── Header ── */}
      <div className="rep-header">
        <div className="rep-logo">Dermalyze</div>
        <div className="rep-meta">
          <strong>Skin Health Report</strong>
          <span>Generated: {now}</span>
        </div>
      </div>

      <p className="rep-disclaimer">{DISCLAIMER}</p>

      {/* ── Latest analysis ── */}
      {latest ? (
        <>
          <h2 className="rep-section-title">Latest Analysis</h2>
          <div className="rep-analysis-row">
            {latestUrl && (
              <img src={latestUrl} alt="Latest skin photo" className="rep-photo" />
            )}
            <div className="rep-analysis-detail">
              <p className="rep-date">
                Photo date: <strong>{new Date(latest.createdAt).toLocaleDateString()}</strong>
              </p>
              {latest.note && <p className="rep-note-text">Note: {latest.note}</p>}

              <table className="rep-metrics">
                <thead>
                  <tr>
                    <th>Concern</th>
                    <th>Severity</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Acne</td>
                    <td><span className={`chip chip-${r.acne.severity}`}>{SEV_LABEL[r.acne.severity]}</span></td>
                    <td className={trendCls(acneTrend)}>{acneTrend}</td>
                  </tr>
                  <tr>
                    <td>Dark circles</td>
                    <td><span className={`chip chip-${r.darkCircles.severity}`}>{SEV_LABEL[r.darkCircles.severity]}</span></td>
                    <td className={trendCls(dcTrend)}>{dcTrend}</td>
                  </tr>
                  <tr>
                    <td>Pigmentation</td>
                    <td><span className={`chip chip-${r.pigmentation.severity}`}>{SEV_LABEL[r.pigmentation.severity]}</span></td>
                    <td className={trendCls(pigTrend)}>{pigTrend}</td>
                  </tr>
                </tbody>
              </table>

              <div className="rep-ai-summary">
                <strong>AI Summary</strong>
                <p>{r.summary}</p>
                {r.nextStep && (
                  <p className="rep-next-step"><strong>Recommended next step:</strong> {r.nextStep}</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="muted">No analyses found.</p>
      )}

      {/* ── History table ── */}
      {analyses.length > 1 && (
        <>
          <h2 className="rep-section-title">Progress History</h2>
          <table className="rep-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Acne</th>
                <th>Dark circles</th>
                <th>Pigmentation</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td><span className={`chip chip-${item.result.acne.severity}`}>{SEV_LABEL[item.result.acne.severity]}</span></td>
                  <td><span className={`chip chip-${item.result.darkCircles.severity}`}>{SEV_LABEL[item.result.darkCircles.severity]}</span></td>
                  <td><span className={`chip chip-${item.result.pigmentation.severity}`}>{SEV_LABEL[item.result.pigmentation.severity]}</span></td>
                  <td className="rep-note-cell">{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── Skin profile ── */}
      {(profile.skinType || profile.concerns.length > 0) && (
        <>
          <h2 className="rep-section-title">Skin Profile</h2>
          <div className="rep-profile-grid">
            {profile.skinType && (
              <div className="rep-profile-item">
                <span className="rep-profile-label">Skin type</span>
                <span>{profile.skinType}</span>
              </div>
            )}
            {profile.concerns.length > 0 && (
              <div className="rep-profile-item">
                <span className="rep-profile-label">Concerns</span>
                <span>{profile.concerns.join(', ')}</span>
              </div>
            )}
            {profile.sensitive && (
              <div className="rep-profile-item">
                <span className="rep-profile-label">Sensitive skin</span>
                <span>{profile.sensitive}</span>
              </div>
            )}
            {profile.allergies && (
              <div className="rep-profile-item">
                <span className="rep-profile-label">Allergies</span>
                <span>{profile.allergies}</span>
              </div>
            )}
            {profile.duration && (
              <div className="rep-profile-item">
                <span className="rep-profile-label">Duration of concerns</span>
                <span>{profile.duration}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Product audit ── */}
      {profile.products.length > 0 && (
        <>
          <h2 className="rep-section-title">Current Products — Ingredient Audit</h2>
          <table className="rep-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {profile.products.map((p, i) => {
                const flags = flagIngredients(p.name);
                return (
                  <tr key={i} className={flags.length > 0 ? 'rep-row-warn' : ''}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.kind}</td>
                    <td>
                      {flags.length === 0 ? (
                        <span className="rep-flag-ok">✓ Clean</span>
                      ) : (
                        <ul className="rep-flag-list">
                          {flags.map((f) => (
                            <li key={f.ingredient} className={`rep-flag rep-flag-${f.level}`}>
                              <strong>{f.ingredient}</strong>: {f.reason}
                              {f.alternative && <span className="rep-alt"> → Alt: {f.alternative}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* ── Footer ── */}
      <div className="rep-footer">
        <p>This report was generated by Dermalyze — an AI-assisted skin analysis tool.</p>
        <p>It is not a medical diagnosis. Please consult a qualified dermatologist for clinical advice.</p>
      </div>
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function DoctorReport({ onClose }: Props) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [profile,  setProfile]  = useState<ProfileData | null>(null);
  const [latestUrl, setLatestUrl] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([listAnalyses(), loadProfile()])
      .then(async ([items, profileRes]) => {
        setAnalyses(items);
        setProfile(profileRes.data);
        if (items.length > 0 && items[0].photoPath) {
          const url = await photoUrl(items[0].photoPath).catch(() => '');
          setLatestUrl(url);
        }
      })
      .catch(() => setError('Could not load report data.'))
      .finally(() => setLoading(false));
  }, []);

  // Close on backdrop click
  function onBackdrop(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Keyboard: Escape closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Doctor Report"
    >
      <div className="modal-box rep-modal-box">
        {/* Modal toolbar — hidden when printing */}
        <div className="modal-toolbar rep-toolbar no-print">
          <h2 className="modal-title">Skin Health Report</h2>
          <div className="rep-toolbar-actions">
            <button
              className="primary rep-print-btn"
              type="button"
              onClick={() => window.print()}
              disabled={loading || !!error}
            >
              🖨 Print / Save as PDF
            </button>
            <button
              className="link"
              type="button"
              onClick={onClose}
              aria-label="Close report"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading && <p className="muted">Generating report…</p>}
          {error   && <p className="error">{error}</p>}
          {!loading && !error && profile && (
            <ReportBody
              analyses={analyses}
              profile={profile}
              latestUrl={latestUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}
