import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { analyze } from '../functions/analyze/resource';

const schema = a.schema({
  /** One saved AI analysis of one photo. Only its owner can read or change it. */
  SkinAnalysis: a
    .model({
      photoPath: a.string().required(),
      summary: a.string(),
      acne: a.string(),
      darkCircles: a.string(),
      pigmentation: a.string(),
      resultJson: a.string().required(),
      note: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  /** The user's answers about their skin and the products they use. One row per user. */
  SkinProfile: a
    .model({
      skinType: a.string(),
      duration: a.string(),
      sensitive: a.string(),
      allergies: a.string(),
      concernsJson: a.string().required(),
      productsJson: a.string().required(),
    })
    .authorization((allow) => [allow.owner()]),

  /** Sends a resized photo to Amazon Bedrock and returns the analysis as a JSON string. */
  analyzePhoto: a
    .query()
    .arguments({
      imageBase64: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(analyze))
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
