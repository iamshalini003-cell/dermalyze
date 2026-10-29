/**
 * ingredients.ts
 * Comedogenic & harmful ingredient database + flag logic.
 *
 * Comedogenicity ratings are sourced from established dermatology references
 * (Kligman & Mills scale 0-5). "harmful" covers known irritants / endocrine
 * disruptors flagged by EWG and mainstream derm literature.
 */

export type FlagLevel = 'high' | 'moderate' | 'low';

export interface IngredientFlag {
  ingredient: string;
  level: FlagLevel;
  reason: string;
  alternative?: string;
}

/** Master database of problematic ingredients.
 *  Keys are lowercase, comma-separated aliases. */
export const COMEDOGENIC_DB: Record<string, Omit<IngredientFlag, 'ingredient'>> = {
  // ── High comedogenic (rating 4-5) ────────────────────────────────────────
  'isopropyl myristate': {
    level: 'high',
    reason: 'Comedogenicity rating 5/5 — highly pore-clogging',
    alternative: 'Caprylic/Capric Triglyceride (CCT)',
  },
  'isopropyl palmitate': {
    level: 'high',
    reason: 'Comedogenicity rating 4/5 — clogs pores in most skin types',
    alternative: 'Squalane',
  },
  'isopropyl isostearate': {
    level: 'high',
    reason: 'Comedogenicity rating 4/5',
    alternative: 'Jojoba oil',
  },
  'coconut oil': {
    level: 'high',
    reason: 'Comedogenicity rating 4/5 — frequently breaks out acne-prone skin',
    alternative: 'Hemp seed oil (rating 0)',
  },
  'wheat germ oil': {
    level: 'high',
    reason: 'Comedogenicity rating 5/5',
    alternative: 'Rosehip oil',
  },
  'sodium lauryl sulfate': {
    level: 'high',
    reason: 'Highly irritating surfactant — strips skin barrier',
    alternative: 'Sodium Lauroyl Sarcosinate or Cocamidopropyl Betaine',
  },
  sls: {
    level: 'high',
    reason: 'Alias for Sodium Lauryl Sulfate — strips skin barrier',
    alternative: 'Sodium Lauroyl Sarcosinate',
  },
  'butyl stearate': { level: 'high', reason: 'Comedogenicity rating 4/5', alternative: 'Cetyl alcohol' },
  'decyl oleate': { level: 'high', reason: 'Comedogenicity rating 4/5', alternative: 'C12-15 Alkyl Benzoate' },
  'myristyl myristate': { level: 'high', reason: 'Comedogenicity rating 5/5', alternative: 'Caprylic/Capric Triglyceride' },
  'acetylated lanolin': { level: 'high', reason: 'Comedogenicity rating 4/5', alternative: 'Shea butter (rating 0)' },
  'lauric acid': { level: 'high', reason: 'Comedogenicity rating 4/5 — present in high amounts in coconut oil', alternative: 'Linoleic acid-rich oils' },

  // ── Moderate comedogenic (rating 2-3) ────────────────────────────────────
  'stearic acid': { level: 'moderate', reason: 'Comedogenicity rating 2-3', alternative: 'Myristic acid (used sparingly)' },
  'palmitic acid': { level: 'moderate', reason: 'Comedogenicity rating 2', alternative: 'Stearic acid (lower rating)' },
  'cocoa butter': { level: 'moderate', reason: 'Comedogenicity rating 4 — better avoided for acne-prone skin', alternative: 'Shea butter' },
  'lanolin': { level: 'moderate', reason: 'Comedogenicity rating 1-4 depending on type; common sensitiser', alternative: 'Ceramides or Squalane' },
  'beeswax': { level: 'moderate', reason: 'Comedogenicity rating 2', alternative: 'Candelilla wax' },
  'cetyl alcohol': { level: 'moderate', reason: 'Comedogenicity rating 2 — generally safe but can trigger breakouts in some', alternative: 'Behenyl alcohol' },
  'glyceryl stearate': { level: 'moderate', reason: 'Comedogenicity rating 2', alternative: 'PEG-free emulsifiers' },
  'corn oil': { level: 'moderate', reason: 'Comedogenicity rating 3', alternative: 'Rosehip oil' },
  'soybean oil': { level: 'moderate', reason: 'Comedogenicity rating 3', alternative: 'Sea buckthorn oil' },

  // ── Harmful / irritants / endocrine disruptors ────────────────────────────
  'fragrance': {
    level: 'high',
    reason: 'Top cause of allergic contact dermatitis; hides up to 100+ unlisted chemicals',
    alternative: 'Fragrance-free or Vitamin E (Tocopherol) for scent masking',
  },
  parfum: {
    level: 'high',
    reason: 'EU label for "fragrance" — same concerns apply',
    alternative: 'Fragrance-free formulation',
  },
  'oxybenzone': {
    level: 'high',
    reason: 'Chemical UV filter — endocrine disruptor; banned in some jurisdictions',
    alternative: 'Zinc Oxide or Titanium Dioxide (mineral sunscreens)',
  },
  'parabens': {
    level: 'moderate',
    reason: 'Preservatives with mild estrogenic activity (methylparaben, propylparaben)',
    alternative: 'Phenoxyethanol or Ethylhexylglycerin',
  },
  methylparaben: { level: 'moderate', reason: 'Paraben preservative — mild estrogenic activity', alternative: 'Phenoxyethanol' },
  propylparaben: { level: 'moderate', reason: 'Paraben preservative — stronger estrogenic activity than methyl', alternative: 'Phenoxyethanol' },
  butylparaben: { level: 'high', reason: 'Highest-concern paraben — potent estrogen mimicker', alternative: 'Phenoxyethanol' },
  'formaldehyde': {
    level: 'high',
    reason: 'Known carcinogen; found in some preservative systems',
    alternative: 'Optiphen or Leucidal Liquid',
  },
  'dmdm hydantoin': {
    level: 'high',
    reason: 'Formaldehyde-releasing preservative',
    alternative: 'Leucidal Liquid SF or Naticide',
  },
  'imidazolidinyl urea': {
    level: 'high',
    reason: 'Formaldehyde-releasing preservative',
    alternative: 'Vitamin E + Rosemary extract',
  },
  'diazolidinyl urea': {
    level: 'high',
    reason: 'Formaldehyde-releasing preservative',
    alternative: 'Optiphen Plus',
  },
  'alcohol denat': {
    level: 'moderate',
    reason: 'Denaturing alcohol — disrupts skin barrier; drying with repeated use',
    alternative: 'Cetearyl alcohol (fatty alcohol) or avoid alcohol-based toners',
  },
  'denatured alcohol': {
    level: 'moderate',
    reason: 'Same as Alcohol Denat',
    alternative: 'Witch hazel (alcohol-free) or rose water',
  },
  'mineral oil': {
    level: 'low',
    reason: 'Highly refined mineral oil (cosmetic grade) is non-comedogenic but occlusive; impure grades are concerning',
    alternative: 'Squalane or Jojoba oil',
  },
  'petrolatum': { level: 'low', reason: 'Occlusive; safe when fully refined, but impure grades contain PAHs', alternative: 'Shea butter' },
  'talc': { level: 'low', reason: 'Risk of asbestos contamination in unregulated grades', alternative: 'Cornstarch or Zinc Oxide' },
  'phthalates': { level: 'high', reason: 'Endocrine disruptors; used as fragrance carriers (often unlisted)', alternative: 'Phthalate-free fragrance' },
  'triclosan': { level: 'high', reason: 'Antimicrobial — endocrine disruption; banned in US OTC products', alternative: 'Tea tree oil (2%) or Benzoyl Peroxide (in acne tx)' },
  'hydroquinone': { level: 'moderate', reason: 'Skin brightener — banned in EU for OTC use; can cause ochronosis with overuse', alternative: 'Alpha-Arbutin or Tranexamic Acid' },
};

/** Parse a comma-separated ingredient string and return any flagged items. */
export function flagIngredients(ingredientString: string): IngredientFlag[] {
  const found: IngredientFlag[] = [];
  const seen = new Set<string>();

  // Normalise: lower, trim, split on comma or newline
  const list = ingredientString
    .toLowerCase()
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const rawIngredient of list) {
    for (const [key, info] of Object.entries(COMEDOGENIC_DB)) {
      // Match if the ingredient name contains the key or vice versa (partial match)
      if (
        (rawIngredient.includes(key) || key.includes(rawIngredient)) &&
        rawIngredient.length > 2 &&
        !seen.has(key)
      ) {
        seen.add(key);
        found.push({ ingredient: toTitleCase(key), ...info });
      }
    }
  }

  // Sort: high first, then moderate, then low
  const order: Record<FlagLevel, number> = { high: 0, moderate: 1, low: 2 };
  return found.sort((a, b) => order[a.level] - order[b.level]);
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
