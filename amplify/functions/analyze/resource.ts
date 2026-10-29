import { defineFunction } from '@aws-amplify/backend';

/**
 * ONE place to change the AI model.
 * - Default: Amazon Nova Pro through the Asia-Pacific inference profile.
 * - If you get "model not available", try 'amazon.nova-pro-v1:0' or 'apac.amazon.nova-lite-v1:0'.
 */
export const MODEL_ID = 'apac.amazon.nova-pro-v1:0';

export const analyze = defineFunction({
  name: 'analyze',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 25,
  memoryMB: 512,
  environment: {
    MODEL_ID,
    BEDROCK_REGION: 'ap-southeast-2',
  },
});
