/**
 * questionnaire.ts
 * Types and data for the post-analysis questionnaire.
 */
import type { ProductEntry } from '../components/Questionnaire';

export interface QuestionnaireData {
  skinType: string;
  sensitive: string;
  allergies: string;
  // lifestyle
  sleepHours: string;
  stressLevel: string;
  dietType: string;
  waterIntake: string;
  exerciseFreq: string;
  // products
  products: ProductEntry[];
}
