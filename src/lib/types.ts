export type Severity = 'none' | 'mild' | 'moderate' | 'severe';

export interface Concern {
  severity: Severity;
  explanation: string;
}

export interface AnalysisResult {
  faceVisible: boolean;
  retakeReason: string;
  acne: Concern;
  darkCircles: Concern;
  pigmentation: Concern;
  summary: string;
  nextStep: string;
}

export const DISCLAIMER =
  'Dermalyze gives general skin-care insights. It is not a medical diagnosis. ' +
  'If something worries you, please see a dermatologist.';
