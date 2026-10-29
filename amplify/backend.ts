import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { analyze } from './functions/analyze/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  analyze,
});

// Let the analyze function call Amazon Bedrock (Nova).
backend.analyze.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    resources: ['*'],
  })
);
