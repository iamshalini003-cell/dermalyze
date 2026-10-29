/**
 * Profile.tsx
 * "My skin" tab — skin info form + product ingredient audit against detected concerns.
 */

import { useEffect, useState } from 'react';
import '../profile.css';
import {
  EMPTY_PROFILE,
  loadProfile,
  saveProfile,
  type ProductKind,
  type ProfileData,
} from '../lib/profile';
import { flagIngredients } from '../lib/ingredients';
import { listAnalyses } from '../lib/api';
import type { AnalysisResult } from '../lib/types';

const CONCERNS = ['Acne', 'Dark circles', 'Pigmentation'];
const KINDS: ProductKind[] = ['cleanser', 'moisturizer', 'sunscreen', 'serum', 'treatment', 'other'];

// ─── Product audit panel ──────────────────────────────────────────────────────

/**
 * Checks each saved product's name (as a rough proxy for ingredients) against
 * the comedogenic/harmful database and cross-references the user's AI-detected
 * skin concerns to surface relevant warnings.
 */
function ProductAudit({
  products,
  latestResult,
}: {
  products: ProfileData['products'];
  latestResult: AnalysisResult | null;
}) {
  if (products.length === 0) {
    return (
      <div className="audit-empty">
        <p className="muted">Add your current products above to get an ingredient audit.</p>
      </div>
    );
  }

  // Determine which concerns are active based on latest AI analysis
  const hasAcne        = latestResult ? latestResult.acne.severity        !== 'none' : false;
  const hasDarkCircles = latestResult ? latestResult.darkCircles.severity !== 'none' : false;
  const hasPigment     = latestResult ? latestResult.pigmentation.severity !== 'none' : false;

  const contextNotes: string[] = [];
  if (hasAcne)        contextNotes.push('⚠ Your latest analysis detected acne — avoid comedogenic (pore-clogging) ingredients.');
  if (hasDarkCircles) contextNotes.push('⚠ Dark circles detected — look for Caffeine, Vitamin K, Peptides in your eye area products.');
  if (hasPigment)     contextNotes.push('⚠ Pigmentation detected — avoid Oxybenzone sunscreens; prioritise Niacinamide, Alpha-Arbutin, Vitamin C.');

  return (
    <div className="audit-panel">
      <h3 className="audit-heading">Product Audit</h3>
      <p className="muted" style={{ marginBottom: 10 }}>
        We check your product names against our ingredient database.
        For the best results, paste the full ingredient list when adding a product in
        the questionnaire (Analyze tab → Fill in questionnaire → Step 3).
      </p>

      {contextNotes.length > 0 && (
        <div className="audit-context">
          {contextNotes.map((n, i) => <p key={i} className="audit-context-note">{n}</p>)}
        </div>
      )}

      <ul className="audit-list">
        {products.map((p, i) => {
          // Flag using the product name itself as a crude ingredient string
          // (catches e.g. "Coconut Oil Cleanser", "SLS Body Wash", "Fragrance Mist")
          const flags = flagIngredients(p.name);
          const clean = flags.length === 0;

          // Extra concern-specific warning even if no direct flag
          const concernWarning: string[] = [];
          if (hasAcne && (p.kind === 'moisturizer' || p.kind === 'cleanser' || p.kind === 'other')) {
            const nameLower = p.name.toLowerCase();
            if (
              nameLower.includes('coconut') ||
              nameLower.includes('butter') ||
              nameLower.includes('oil') && !nameLower.includes('jojoba') && !nameLower.includes('rosehip') && !nameLower.includes('hemp')
            ) {
              concernWarning.push('This product may contain high-comedogenic oils. Check ingredient list carefully if you are acne-prone.');
            }
          }
          if (hasPigment && p.kind === 'sunscreen') {
            const nameLower = p.name.toLowerCase();
            if (nameLower.includes('chemical') || nameLower.includes('oxybenzone') || nameLower.includes('avobenzone')) {
              concernWarning.push('For pigmentation, prefer mineral sunscreens (Zinc Oxide / Titanium Dioxide) over chemical filters.');
            }
          }

          return (
            <li key={i} className={`audit-item ${clean && concernWarning.length === 0 ? 'audit-ok' : 'audit-warn'}`}>
              <div className="audit-item-header">
                <span>
                  <strong>{p.name}</strong>
                  <span className="muted"> ({p.kind})</span>
                </span>
                {clean && concernWarning.length === 0
                  ? <span className="audit-badge audit-badge-ok">✓ Clean</span>
                  : <span className="audit-badge audit-badge-warn">⚠ Review</span>
                }
              </div>

              {flags.map((f) => (
                <div key={f.ingredient} className={`audit-flag audit-flag-${f.level}`}>
                  <strong>{f.ingredient}</strong>: {f.reason}
                  {f.alternative && (
                    <div className="audit-alt">→ Alternative: {f.alternative}</div>
                  )}
                </div>
              ))}

              {concernWarning.map((w, wi) => (
                <div key={wi} className="audit-flag audit-flag-moderate">{w}</div>
              ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main Profile component ───────────────────────────────────────────────────

export default function Profile() {
  const [id, setId]         = useState<string | null>(null);
  const [form, setForm]     = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');
  const [newName, setNewName]   = useState('');
  const [newKind, setNewKind]   = useState<ProductKind>('cleanser');
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    Promise.all([loadProfile(), listAnalyses()])
      .then(([profile, analyses]) => {
        setId(profile.id);
        setForm(profile.data);
        if (analyses.length > 0) setLatestResult(analyses[0].result);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your answers.'))
      .finally(() => setLoading(false));
  }, []);

  function change<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage('');
  }

  function toggleConcern(name: string) {
    const has = form.concerns.includes(name);
    change('concerns', has ? form.concerns.filter((c) => c !== name) : [...form.concerns, name]);
  }

  function addProduct() {
    const name = newName.trim();
    if (!name) return;
    change('products', [...form.products, { name, kind: newKind }]);
    setNewName('');
  }

  function removeProduct(index: number) {
    change('products', form.products.filter((_, i) => i !== index));
  }

  async function onSave() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const newId = await saveProfile(id, form);
      setId(newId);
      setMessage('Saved. Thank you!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your answers.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="card">
        <h2>About my skin</h2>
        <p className="muted">
          These answers help Dermalyze give you better skin insights. They are not a medical record.
        </p>

        <p className="q">Which concerns do you want help with?</p>
        <div className="checks">
          {CONCERNS.map((c) => (
            <label key={c} className="check">
              <input type="checkbox" checked={form.concerns.includes(c)} onChange={() => toggleConcern(c)} />
              {c}
            </label>
          ))}
        </div>

        <label className="field">
          What is your skin type?
          <select value={form.skinType} onChange={(e) => change('skinType', e.target.value)}>
            <option value="">Choose one</option>
            <option value="oily">Oily</option>
            <option value="dry">Dry</option>
            <option value="combination">Combination</option>
            <option value="normal">Normal</option>
            <option value="not sure">Not sure</option>
          </select>
        </label>

        <label className="field">
          How long have you had these concerns?
          <select value={form.duration} onChange={(e) => change('duration', e.target.value)}>
            <option value="">Choose one</option>
            <option value="less than 1 month">Less than 1 month</option>
            <option value="1 to 6 months">1 to 6 months</option>
            <option value="6 months to 2 years">6 months to 2 years</option>
            <option value="more than 2 years">More than 2 years</option>
          </select>
        </label>

        <label className="field">
          Does your skin sting or turn red easily?
          <select value={form.sensitive} onChange={(e) => change('sensitive', e.target.value)}>
            <option value="">Choose one</option>
            <option value="yes">Yes</option>
            <option value="sometimes">Sometimes</option>
            <option value="no">No</option>
          </select>
        </label>

        <label className="field">
          Any allergies to skincare ingredients? (optional)
          <input
            type="text"
            value={form.allergies}
            placeholder="e.g. fragrance, none"
            onChange={(e) => change('allergies', e.target.value)}
          />
        </label>

        <p className="q">Products you use now</p>
        {form.products.length === 0 && <p className="muted">No products added yet.</p>}
        <ul className="products">
          {form.products.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <span>
                <strong>{p.name}</strong> <span className="muted">({p.kind})</span>
              </span>
              <button className="link danger" onClick={() => removeProduct(i)}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="add-row">
          <input
            type="text"
            value={newName}
            placeholder="Product name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProduct()}
          />
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as ProductKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button className="secondary add-btn" onClick={addProduct}>Add</button>
        </div>

        {error   && <p className="error">{error}</p>}
        {message && <p className="ok">{message}</p>}

        <button className="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save my answers'}
        </button>
      </div>

      {/* ── Product audit ── */}
      {form.products.length > 0 && (
        <div className="card">
          <div className="audit-toggle-row">
            <h3 style={{ margin: 0 }}>Product Audit</h3>
            <button
              className="link"
              type="button"
              onClick={() => setShowAudit((v) => !v)}
            >
              {showAudit ? 'Hide ▲' : 'Show ▼'}
            </button>
          </div>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Check your products against your detected skin concerns and our ingredient database.
          </p>
          {showAudit && (
            <ProductAudit products={form.products} latestResult={latestResult} />
          )}
        </div>
      )}
    </div>
  );
}
