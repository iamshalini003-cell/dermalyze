/**
 * routine.ts
 * Pure function that derives a personalised holistic routine from
 * the questionnaire data + analysis result. No network call needed —
 * this runs entirely on the client.
 */

import type { QuestionnaireData } from './questionnaire';
import type { AnalysisResult } from './types';

export interface RoutineStep {
  time: string;        // e.g. "AM – Step 1"
  name: string;        // e.g. "Gentle Foaming Cleanser"
  instruction: string; // how to use
  note?: string;       // ingredient tip
}

export interface DietTip {
  category: string;
  foods: string[];
  avoid: string[];
}

export interface SleepTip {
  headline: string;
  tips: string[];
}

export interface YogaTip {
  name: string;
  duration: string;
  benefit: string;
}

export interface HolisticRoutine {
  amSteps: RoutineStep[];
  pmSteps: RoutineStep[];
  dietPlan: DietTip[];
  sleepSchedule: SleepTip;
  yogaRoutine: YogaTip[];
  personalNotes: string[];
}

// ─── Helper builders ─────────────────────────────────────────────────────────

function hasSeverity(r: AnalysisResult, level: 'mild' | 'moderate' | 'severe'): boolean {
  const lvls = { none: 0, mild: 1, moderate: 2, severe: 3 };
  return (
    lvls[r.acne.severity] >= lvls[level] ||
    lvls[r.darkCircles.severity] >= lvls[level] ||
    lvls[r.pigmentation.severity] >= lvls[level]
  );
}

// ─── AM Routine ──────────────────────────────────────────────────────────────

function buildAM(q: QuestionnaireData, r: AnalysisResult): RoutineStep[] {
  const oily = q.skinType.toLowerCase().includes('oily');
  const dry = q.skinType.toLowerCase().includes('dry');
  const sensitive = q.sensitive === 'yes';
  const acneProne = r.acne.severity !== 'none';
  const pigmented = r.pigmentation.severity !== 'none';

  const steps: RoutineStep[] = [];

  // 1. Cleanser
  steps.push({
    time: 'AM – Step 1',
    name: oily ? 'Salicylic Acid Cleanser (0.5–2%)' : sensitive ? 'Micellar / Cream Cleanser' : 'Gentle Foaming Cleanser',
    instruction: 'Wash with lukewarm water for 30–60 s. Pat dry — do not rub.',
    note: oily ? 'BHA (salicylic acid) dissolves sebum in pores.' : 'Avoid SLS; look for Cocamidopropyl Betaine as surfactant.',
  });

  // 2. Toner (optional but useful)
  if (acneProne || oily) {
    steps.push({
      time: 'AM – Step 2',
      name: 'Niacinamide Toner (5–10%)',
      instruction: 'Apply with cotton pad or press gently into skin. Allow 30 s to absorb.',
      note: 'Niacinamide reduces sebum, minimises pores, and brightens post-acne marks.',
    });
  }

  // 3. Serum
  if (pigmented || r.darkCircles.severity !== 'none') {
    steps.push({
      time: `AM – Step ${steps.length + 1}`,
      name: 'Vitamin C Serum (L-Ascorbic Acid 10–15%)',
      instruction: '3–5 drops pressed into skin. Wait 1 min before next step.',
      note: 'Use pH < 3.5 for best efficacy. Store in a dark, cool place.',
    });
  } else if (acneProne) {
    steps.push({
      time: `AM – Step ${steps.length + 1}`,
      name: 'Azelaic Acid Serum (10%)',
      instruction: 'Spread a pea-sized amount evenly. Wait 2 min.',
      note: 'Antibacterial, anti-inflammatory, non-comedogenic. Great for sensitive skin too.',
    });
  }

  // 4. Moisturiser
  steps.push({
    time: `AM – Step ${steps.length + 1}`,
    name: dry ? 'Rich Ceramide Moisturiser' : 'Oil-free Gel Moisturiser',
    instruction: dry ? 'Apply generously to damp skin.' : 'Use a small pea-sized amount — focus on cheeks and forehead.',
    note: 'Look for: Ceramides, Hyaluronic Acid, Panthenol. Avoid: Isopropyl Myristate, Coconut Oil.',
  });

  // 5. SPF – mandatory last step
  steps.push({
    time: `AM – Step ${steps.length + 1}`,
    name: 'Broad-Spectrum SPF 50 Sunscreen',
    instruction: 'Apply ¼ tsp (2 mg/cm²) 15 min before sun exposure. Reapply every 2 h outdoors.',
    note: 'Mineral (Zinc Oxide / Titanium Dioxide) is gentler for sensitive/acne-prone skin. Avoid Oxybenzone.',
  });

  return steps;
}

// ─── PM Routine ──────────────────────────────────────────────────────────────

function buildPM(q: QuestionnaireData, r: AnalysisResult): RoutineStep[] {
  const oily = q.skinType.toLowerCase().includes('oily');
  const dry = q.skinType.toLowerCase().includes('dry');
  const acneProne = r.acne.severity !== 'none';
  const pigmented = r.pigmentation.severity !== 'none';
  const sensitive = q.sensitive === 'yes';

  const steps: RoutineStep[] = [];

  // 1. Oil cleanser / micellar (first cleanse — remove SPF/makeup)
  steps.push({
    time: 'PM – Step 1',
    name: 'Oil Cleanser or Micellar Water',
    instruction: 'Massage onto dry skin for 60 s, then rinse. This removes sunscreen and makeup.',
    note: 'Even if you don\'t wear makeup, removing SPF with a dedicated cleanser is important.',
  });

  // 2. Second cleanse
  steps.push({
    time: 'PM – Step 2',
    name: oily ? 'Salicylic Acid Cleanser' : sensitive ? 'Cream Cleanser' : 'Gentle Foaming Cleanser',
    instruction: 'Wash with lukewarm water. Double-cleansing ensures all residue is removed.',
  });

  // 3. Treatment (targeted actives — PM only)
  if (acneProne && !sensitive) {
    steps.push({
      time: 'PM – Step 3',
      name: 'Benzoyl Peroxide 2.5% Spot Treatment (or Adapalene 0.1% if prescribed)',
      instruction: 'Thin layer on active breakouts only. Alternate nights with retinol if using both.',
      note: 'Start 3 nights per week to build tolerance. Can cause initial purging (4–8 wks).',
    });
  } else if (pigmented || r.darkCircles.severity !== 'none') {
    steps.push({
      time: 'PM – Step 3',
      name: 'Alpha-Arbutin Serum (2%) or Tranexamic Acid (3–5%)',
      instruction: '3–4 drops pressed into skin. Wait 2 min.',
      note: 'Safer alternative to hydroquinone for brightening.',
    });
  }

  // 4. Retinol (3–4 nights per week — anti-ageing, acne, pigmentation)
  if (!sensitive) {
    steps.push({
      time: `PM – Step ${steps.length + 1}`,
      name: hasSeverity(r, 'moderate') ? 'Retinol 0.5%' : 'Retinol 0.25% (starter strength)',
      instruction: 'Pea-sized amount on entire face. Start 2 nights/week; increase slowly.',
      note: 'Do NOT use on the same night as AHA/BHA exfoliants. Use a buffer moisturiser if irritated.',
    });
  }

  // 5. Moisturiser
  steps.push({
    time: `PM – Step ${steps.length + 1}`,
    name: dry ? 'Overnight Repair Cream with Ceramides & Peptides' : 'Lightweight Gel-Cream',
    instruction: 'Apply generously as the last step. Let skin "drink it in" before sleep.',
    note: dry ? 'Seal with a thin layer of pure squalane over the top for extra barrier repair.' : undefined,
  });

  return steps;
}

// ─── Diet plan ───────────────────────────────────────────────────────────────

function buildDiet(q: QuestionnaireData, r: AnalysisResult): DietTip[] {
  const acneProne = r.acne.severity !== 'none';
  const tips: DietTip[] = [];

  tips.push({
    category: '💧 Anti-inflammatory foods',
    foods: [
      'Fatty fish (salmon, sardines) — Omega-3 reduces skin inflammation',
      'Walnuts, flaxseeds — plant-based Omega-3',
      'Turmeric with black pepper — curcumin is a potent anti-inflammatory',
      'Green leafy veg (spinach, kale) — antioxidants protect skin cells',
      'Berries (blueberries, strawberries) — polyphenols reduce oxidative stress',
      'Sweet potato, pumpkin — beta-carotene (provitamin A) for skin repair',
    ],
    avoid: [],
  });

  if (acneProne || q.dietType === 'High sugar/processed') {
    tips.push({
      category: '🚫 Acne trigger foods',
      foods: [],
      avoid: [
        'High-glycaemic foods (white bread, sugary drinks, pastries) — spike insulin → increase sebum',
        'Dairy, especially skim milk — linked to hormonal acne in several studies',
        'Whey protein supplements — may worsen acne',
        'Fast food / ultra-processed food — promotes systemic inflammation',
        'Excessive alcohol — dehydrates skin; impairs liver detox',
      ],
    });
  }

  tips.push({
    category: '🌿 Skin vitamins & minerals',
    foods: [
      'Vitamin C (citrus, kiwi, capsicum) — collagen synthesis',
      'Vitamin E (almonds, sunflower seeds) — antioxidant, barrier support',
      'Zinc (pumpkin seeds, chickpeas, lentils) — wound healing, anti-inflammatory',
      'Selenium (Brazil nuts — just 2/day) — protects against UV damage',
      'Biotin (eggs, avocado) — supports skin structure',
    ],
    avoid: [],
  });

  if (q.waterIntake === 'Less than 1 L' || q.waterIntake === '1–1.5 L') {
    tips.push({
      category: '💧 Hydration (you need more!)',
      foods: [
        'Water — aim for 2–3 L/day depending on body weight and climate',
        'Herbal teas (caffeine-free) — count toward daily fluid intake',
        'Cucumber, celery, watermelon — ~90–95% water content',
        'Coconut water — natural electrolytes without added sugar',
      ],
      avoid: [
        'Excessive caffeine (> 3 cups/day) — mild diuretic; compounds dehydration',
        'Salty snacks — increase water retention AND dehydration',
      ],
    });
  }

  return tips;
}

// ─── Sleep schedule ──────────────────────────────────────────────────────────

function buildSleep(q: QuestionnaireData): SleepTip {
  const poor = q.sleepHours === 'Less than 5 h' || q.sleepHours === '5–6 h';
  return {
    headline: poor
      ? '⚠ You\'re getting insufficient sleep — this directly impacts skin repair'
      : '✓ Your sleep duration is reasonable — focus on quality',
    tips: [
      'Aim for 7–8 hours in a consistent window (e.g. 10 PM – 6 AM). Skin cell turnover peaks 10 PM–2 AM.',
      'Sleep on a silk or satin pillowcase — reduces friction and absorbs less product.',
      'Wash pillowcase every 2–3 days if acne-prone (bacteria + sebum accumulate quickly).',
      'Keep bedroom cool (16–19 °C / 61–66 °F) — lower temperature improves deep sleep quality.',
      'Avoid screens 60 min before bed — blue light suppresses melatonin, delays sleep onset.',
      poor
        ? 'Try a 20-min "wind-down" ritual: dim lights → warm shower → apply PM routine → read.'
        : 'If you wake at night, avoid checking your phone — the light resets your cortisol clock.',
      'Elevate your head slightly (one extra pillow) — reduces morning puffiness and dark circles.',
    ],
  };
}

// ─── Yoga / stress-relief ────────────────────────────────────────────────────

function buildYoga(q: QuestionnaireData): YogaTip[] {
  const highStress = q.stressLevel === 'High' || q.stressLevel === 'Very high';
  const base: YogaTip[] = [
    {
      name: "Child's Pose (Balasana)",
      duration: '2–3 min',
      benefit: 'Calms the nervous system; relieves tension in neck/shoulders.',
    },
    {
      name: 'Legs Up the Wall (Viparita Karani)',
      duration: '5–10 min',
      benefit: 'Reduces cortisol; improves lymphatic drainage (reduces puffiness).',
    },
    {
      name: 'Cat-Cow Breath (Marjaryasana-Bitilasana)',
      duration: '3–5 min',
      benefit: 'Syncs breath with movement; activates parasympathetic nervous system.',
    },
    {
      name: '4-7-8 Breathing',
      duration: '4 cycles (× 2 sessions/day)',
      benefit: 'Inhale 4 s → hold 7 s → exhale 8 s. Rapidly lowers cortisol and heart rate.',
    },
    {
      name: 'Seated Forward Fold (Paschimottanasana)',
      duration: '2 min',
      benefit: 'Stimulates digestion; calms anxiety.',
    },
  ];

  if (highStress) {
    base.push(
      {
        name: 'Supported Savasana with Eye Pillow',
        duration: '10–15 min',
        benefit: 'Full nervous system reset; reduces inflammatory cytokines linked to acne.',
      },
      {
        name: 'Alternate Nostril Breathing (Nadi Shodhana)',
        duration: '5 min',
        benefit: 'Balances left/right brain; dramatically reduces stress hormones.',
      }
    );
  }

  if (q.exerciseFreq === 'Never') {
    base.push({
      name: '20-Minute Beginner Walk (daily)',
      duration: '20 min',
      benefit: 'Boosts circulation → nutrients reach skin cells; lowers cortisol naturally.',
    });
  }

  return base;
}

// ─── Personal notes ──────────────────────────────────────────────────────────

function buildNotes(q: QuestionnaireData, r: AnalysisResult): string[] {
  const notes: string[] = [];

  if (q.allergies.trim()) {
    notes.push(`⚠ You mentioned allergies to: "${q.allergies}". Always patch-test new products on your inner forearm for 48 h first.`);
  }
  if (r.acne.severity === 'severe') {
    notes.push('Your acne appears severe. Prescription-strength treatments (topical retinoids, antibiotics, or Spironolactone) may be necessary. Please consult a dermatologist.');
  }
  if (r.darkCircles.severity !== 'none') {
    notes.push('Dark circles can have multiple causes: dehydration, iron deficiency, genetics, or lack of sleep. Treat from the inside out — hydration and sleep are often the fastest fixes.');
  }
  if (q.stressLevel === 'Very high') {
    notes.push('Very high stress → elevated cortisol → more sebum, delayed healing, worsened acne. Stress management is as important as topical treatments for your skin.');
  }
  if (q.products.length > 0) {
    const hasActives = q.products.some((p) =>
      p.ingredients.toLowerCase().includes('retinol') ||
      p.ingredients.toLowerCase().includes('salicylic') ||
      p.ingredients.toLowerCase().includes('benzoyl')
    );
    if (hasActives) {
      notes.push('You\'re already using active ingredients. Avoid layering multiple actives in one session — this causes irritation. Alternate them across days or AM/PM.');
    }
  }

  return notes;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateRoutine(q: QuestionnaireData, r: AnalysisResult): HolisticRoutine {
  return {
    amSteps: buildAM(q, r),
    pmSteps: buildPM(q, r),
    dietPlan: buildDiet(q, r),
    sleepSchedule: buildSleep(q),
    yogaRoutine: buildYoga(q),
    personalNotes: buildNotes(q, r),
  };
}
