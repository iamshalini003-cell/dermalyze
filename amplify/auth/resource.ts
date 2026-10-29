import { defineAuth } from '@aws-amplify/backend';

/** Email + password login through Amazon Cognito. */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
