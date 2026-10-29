/**
 * Questionnaire.tsx
 * Multi-step post-analysis questionnaire shown after a successful photo analysis.
 * Steps:
 *   1. Skin type & sensitivities
 *   2. Lifestyle (sleep, stress, diet, water)
 *   3. Current skincare products (with ingredient analysis)
 * On completion, returns the filled data via onComplete so the parent can
 * generate a personalised holistic routine.
 */

import { useState } from 'react';
import type { QuestionnaireData } from '../lib/questionnaire';
import { COMEDOGENIC_DB, flagIngredients } from '../lib/ingredients';

// ─── Step definitions ────────────────────────────────────────────────────────

const STRESS_LEVELS = ['Low', 'Moderate', 'High', 'Very high'] as const;
const DIET_TYPES = ['Balanced', 'Vegetarian', 'Vegan', 'High sugar/processed', 'Keto / low carb', 'Not sure'] as const;
const WATER_AMOUNTS = ['Less than 1 L', '1–1.5 L', '1.5–2 L', '2–3 L', 'More than 3 L'] as const;
const EXERCISE_FREQ = ['Never', '1–2 × per week', '3–4 × per week', '5+ × per week'] as const;
const SLEEP_HOURS = ['Less than 5 h', '5–6 h', '7–8 h', 'More than 8 h'] as const;
const PRODUCT_CATEGORIES = ['Cleanser', 'Toner', 'Serum', 'Moisturiser', 'Sunscreen', 'Exfoliant', 'Mask', 'Eye cream', 'Other'];

export interface ProductEntry {
  name: string;
  category: string;
  ingredients: string; // comma-separated ingredient list (optional)
}

interface StepProps {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
}

// ─── Step 1 – Skin ────────────────────────────────────────────────────────────

function SkinStep({ data, onChange }: StepProps) {
  return (
    <div className="q-step">
      <h3 className="q-heading">Step 1 of 3 — About your skin</h3>

      <label className="q-label">
        Skin type
        <select
          className="q-select"
          value={data.skinType}
          onChange={(e) => onChange({ skinType: e.target.value })}
        >
          <option value="">Choose one</option>
          {['Oily', 'Dry', 'Combination', 'Normal', 'Not sure'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="q-label">
        Sensitive skin?
        <select
          className="q-select"
          value={data.sensitive}
          onChange={(e) => onChange({ sensitive: e.target.value })}
        >
          <option value="">Choose one</option>
          <option value="yes">Yes — stings / turns red easily</option>
          <option value="sometimes">Sometimes</option>
          <option value="no">No</option>
        </select>
      </label>

      <label className="q-label">
        Known ingredient allergies (optional)
        <input
          className="q-input"
          type="text"
          value={data.allergies}
          placeholder="e.g. fragrance, lanolin, nuts"
          onChange={(e) => onChange({ allergies: e.target.value })}
        />
      </label>
    </div>
  );
}

// ─── Step 2 – Lifestyle ───────────────────────────────────────────────────────

function LifestyleStep({ data, onChange }: StepProps) {
  return (
    <div className="q-step">
      <h3 className="q-heading">Step 2 of 3 — Lifestyle habits</h3>

      <label className="q-label">
        Average sleep per night
        <select className="q-select" value={data.sleepHours} onChange={(e) => onChange({ sleepHours: e.target.value })}>
          <option value="">Choose one</option>
          {SLEEP_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </label>

      <label className="q-label">
        Stress level
        <select className="q-select" value={data.stressLevel} onChange={(e) => onChange({ stressLevel: e.target.value })}>
          <option value="">Choose one</option>
          {STRESS_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label className="q-label">
        Diet type
        <select className="q-select" value={data.dietType} onChange={(e) => onChange({ dietType: e.target.value })}>
          <option value="">Choose one</option>
          {DIET_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>

      <label className="q-label">
        Daily water intake
        <select className="q-select" value={data.waterIntake} onChange={(e) => onChange({ waterIntake: e.target.value })}>
          <option value="">Choose one</option>
          {WATER_AMOUNTS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>

      <label className="q-label">
        Exercise frequency
        <select className="q-select" value={data.exerciseFreq} onChange={(e) => onChange({ exerciseFreq: e.target.value })}>
          <option value="">Choose one</option>
          {EXERCISE_FREQ.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
    </div>
  );
}

// ─── Step 3 – Products ────────────────────────────────────────────────────────

function ProductsStep({ data, onChange }: StepProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [ingredients, setIngredients] = useState('');

  function addProduct() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const entry: ProductEntry = { name: trimmed, category, ingredients: ingredients.trim() };
    onChange({ products: [...data.products, entry] });
    setName('');
    setIngredients('');
  }

  function removeProduct(i: number) {
    onChange({ products: data.products.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="q-step">
      <h3 className="q-heading">Step 3 of 3 — Current skincare products</h3>
      <p className="q-hint">
        Add what you currently use. Paste the ingredient list if you have it — we'll flag anything that
        might be harmful or clog pores.
      </p>

      <div className="q-product-form">
        <input
          className="q-input"
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="q-select q-select-inline"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea
          className="q-textarea"
          placeholder="Ingredient list (optional) — paste from product label"
          value={ingredients}
          rows={2}
          onChange={(e) => setIngredients(e.target.value)}
        />
        <button className="secondary q-add-btn" onClick={addProduct} type="button">
          Add product
        </button>
      </div>

      {data.products.length > 0 && (
        <ul className="q-product-list">
          {data.products.map((p, i) => {
            const flags = p.ingredients ? flagIngredients(p.ingredients) : [];
            return (
              <li key={i} className="q-product-item">
                <div className="q-product-header">
                  <span>
                    <strong>{p.name}</strong>
                    <span className="q-category"> · {p.category}</span>
                  </span>
                  <button className="link danger" onClick={() => removeProduct(i)} type="button">
                    Remove
                  </button>
                </div>
                {flags.length > 0 && (
                  <div className="q-flags">
                    {flags.map((f) => (
                      <span key={f.ingredient} className={`q-flag q-flag-${f.level}`}>
                        ⚠ {f.ingredient}: {f.reason}
                        {f.alternative && <span className="q-alt"> → Try: {f.alternative}</span>}
                      </span>
                    ))}
                  </div>
                )}
                {flags.length === 0 && p.ingredients && (
                  <span className="q-flag-ok">✓ No problematic ingredients detected</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="q-comedogenic-key">
        <strong>Legend:</strong>
        <span className="q-flag q-flag-high">High comedogenic / harmful</span>
        <span className="q-flag q-flag-moderate">Moderate risk</span>
        <span className="q-flag q-flag-low">Low — worth noting</span>
      </div>
    </div>
  );
}

// ─── Main Questionnaire component ────────────────────────────────────────────

const EMPTY: QuestionnaireData = {
  skinType: '',
  sensitive: '',
  allergies: '',
  sleepHours: '',
  stressLevel: '',
  dietType: '',
  waterIntake: '',
  exerciseFreq: '',
  products: [],
};

interface Props {
  onComplete: (data: QuestionnaireData) => void;
  onSkip: () => void;
}

export default function Questionnaire({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuestionnaireData>(EMPTY);

  function patch(partial: Partial<QuestionnaireData>) {
    setData((d) => ({ ...d, ...partial }));
  }

  function next() {
    if (step < 3) setStep((s) => s + 1);
    else onComplete(data);
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  return (
    <section className="card q-card">
      <div className="q-progress">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`q-dot ${n <= step ? 'q-dot-active' : ''}`} />
        ))}
      </div>

      {step === 1 && <SkinStep data={data} onChange={patch} />}
      {step === 2 && <LifestyleStep data={data} onChange={patch} />}
      {step === 3 && <ProductsStep data={data} onChange={patch} />}

      <div className="q-nav">
        {step > 1 ? (
          <button className="secondary" type="button" onClick={back}>← Back</button>
        ) : (
          <button className="link" type="button" onClick={onSkip}>Skip questionnaire</button>
        )}
        <button className="primary q-next-btn" type="button" onClick={next}>
          {step === 3 ? 'Generate my routine →' : 'Next →'}
        </button>
      </div>
    </section>
  );
}

// Re-export for convenience
export { COMEDOGENIC_DB };
