import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export type ProductKind = 'cleanser' | 'moisturizer' | 'sunscreen' | 'serum' | 'treatment' | 'other';

export interface ProductItem {
  name: string;
  kind: ProductKind;
}

export interface ProfileData {
  skinType: string;
  concerns: string[];
  duration: string;
  sensitive: string;
  allergies: string;
  products: ProductItem[];
}

export const EMPTY_PROFILE: ProfileData = {
  skinType: '',
  concerns: [],
  duration: '',
  sensitive: '',
  allergies: '',
  products: [],
};

function parseList<T>(text: string | null | undefined): T[] {
  try {
    const value = JSON.parse(text ?? '[]');
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

/** Load this user's saved answers (or an empty form if they have none yet). */
export async function loadProfile(): Promise<{ id: string | null; data: ProfileData }> {
  const { data } = await client.models.SkinProfile.list();
  const row = data[0];
  if (!row) return { id: null, data: EMPTY_PROFILE };
  return {
    id: row.id,
    data: {
      skinType: row.skinType ?? '',
      concerns: parseList<string>(row.concernsJson),
      duration: row.duration ?? '',
      sensitive: row.sensitive ?? '',
      allergies: row.allergies ?? '',
      products: parseList<ProductItem>(row.productsJson),
    },
  };
}

/** Create the profile the first time, update it after that. Returns the row id. */
export async function saveProfile(id: string | null, p: ProfileData): Promise<string> {
  const fields = {
    skinType: p.skinType,
    duration: p.duration,
    sensitive: p.sensitive,
    allergies: p.allergies,
    concernsJson: JSON.stringify(p.concerns),
    productsJson: JSON.stringify(p.products),
  };
  const res = id
    ? await client.models.SkinProfile.update({ id, ...fields })
    : await client.models.SkinProfile.create(fields);
  if (res.errors?.length || !res.data) {
    throw new Error(res.errors?.[0]?.message ?? 'Could not save your answers.');
  }
  return res.data.id;
}
