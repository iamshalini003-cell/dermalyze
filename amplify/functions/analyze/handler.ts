import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { Schema } from '../../data/resource';

const client = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? 'ap-southeast-2',
});

const PROMPT = `You are a skincare assistant inside a wellness app. Look at the face photo and describe ONLY these three concerns: acne, dark circles under the eyes, and pigmentation (dark patches / uneven tone).

Rules:
- This is a general skin-care insight, NOT a medical diagnosis.
- If there is no clear human face (blurry, too dark, cropped, no face), set "faceVisible" to false and explain in "retakeReason".
- Severity must be exactly one of: "none", "mild", "moderate", "severe".
- Keep every explanation to one or two simple sentences.
- Be kind and neutral. Never comment on attractiveness.

Reply with ONLY valid JSON, no markdown, in exactly this shape:
{
  "faceVisible": true,
  "retakeReason": "",
  "acne": { "severity": "none", "explanation": "" },
  "darkCircles": { "severity": "none", "explanation": "" },
  "pigmentation": { "severity": "none", "explanation": "" },
  "summary": "two sentence overview",
  "nextStep": "one simple next action for the user"
}`;

const SEVERITIES = ['none', 'mild', 'moderate', 'severe'];

function cleanConcern(value: any) {
  const severity = String(value?.severity ?? 'none').toLowerCase();
  return {
    severity: SEVERITIES.includes(severity) ? severity : 'none',
    explanation: String(value?.explanation ?? ''),
  };
}

/** Pull the first JSON object out of the model reply and make sure the shape is safe. */
function parseModelReply(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('The AI reply was not in the expected format.');
  }
  const raw = JSON.parse(text.slice(start, end + 1));
  return {
    faceVisible: raw.faceVisible !== false,
    retakeReason: String(raw.retakeReason ?? ''),
    acne: cleanConcern(raw.acne),
    darkCircles: cleanConcern(raw.darkCircles),
    pigmentation: cleanConcern(raw.pigmentation),
    summary: String(raw.summary ?? ''),
    nextStep: String(raw.nextStep ?? ''),
  };
}

export const handler: Schema['analyzePhoto']['functionHandler'] = async (
  event
) => {
  const { imageBase64 } = event.arguments;
  if (!imageBase64 || imageBase64.length > 3_000_000) {
    throw new Error('Photo is missing or too large. Please use a smaller photo.');
  }

  const bytes = Buffer.from(imageBase64, 'base64');

  const response = await client.send(
    new ConverseCommand({
      modelId: process.env.MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [
            { image: { format: 'jpeg', source: { bytes } } },
            { text: PROMPT },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 700, temperature: 0.2 },
    })
  );

  const text =
    response.output?.message?.content?.map((c) => c.text ?? '').join('') ?? '';

  return JSON.stringify(parseModelReply(text));
};
