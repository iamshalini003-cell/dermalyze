import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import type { AnalysisResult } from './types';
import type { PreparedImage } from './image';

const client = generateClient<Schema>();

export interface SavedAnalysis {
  id: string;
  photoPath: string;
  createdAt: string;
  note: string;
  result: AnalysisResult;
}

/** Upload the photo to private S3, ask the AI to analyze it, then save the result. */
export async function analyzeAndSave(image: PreparedImage, note = ''): Promise<SavedAnalysis> {
  const fileName = `${Date.now()}.jpg`;

  const uploaded = await uploadData({
    path: ({ identityId }) => `photos/${identityId}/${fileName}`,
    data: image.blob,
    options: { contentType: 'image/jpeg' },
  }).result;

  const { data, errors } = await client.queries.analyzePhoto({
    imageBase64: image.base64,
  });
  if (errors?.length || !data) {
    throw new Error(errors?.[0]?.message ?? 'The AI could not analyze this photo.');
  }

  const result = JSON.parse(data) as AnalysisResult;

  // Do not save photos where no face was found; remove them again.
  if (!result.faceVisible) {
    await remove({ path: uploaded.path }).catch(() => undefined);
    return { id: '', photoPath: '', createdAt: new Date().toISOString(), note, result };
  }

  const created = await client.models.SkinAnalysis.create({
    photoPath: uploaded.path,
    summary: result.summary,
    acne: result.acne.severity,
    darkCircles: result.darkCircles.severity,
    pigmentation: result.pigmentation.severity,
    resultJson: data,
    note,
  });
  if (created.errors?.length || !created.data) {
    throw new Error(created.errors?.[0]?.message ?? 'Could not save the result.');
  }

  return {
    id: created.data.id,
    photoPath: uploaded.path,
    createdAt: created.data.createdAt,
    note,
    result,
  };
}

export async function listAnalyses(): Promise<SavedAnalysis[]> {
  const { data } = await client.models.SkinAnalysis.list();
  return data
    .map((row) => ({
      id: row.id,
      photoPath: row.photoPath,
      createdAt: row.createdAt,
      note: row.note ?? '',
      result: JSON.parse(row.resultJson) as AnalysisResult,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteAnalysis(item: SavedAnalysis): Promise<void> {
  await remove({ path: item.photoPath }).catch(() => undefined);
  await client.models.SkinAnalysis.delete({ id: item.id });
}

export async function photoUrl(path: string): Promise<string> {
  const { url } = await getUrl({ path, options: { expiresIn: 300 } });
  return url.toString();
}
