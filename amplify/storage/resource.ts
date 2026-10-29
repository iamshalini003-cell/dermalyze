import { defineStorage } from '@aws-amplify/backend';

/**
 * Private, encrypted S3 bucket for face photos.
 * Each signed-in user can only touch their own folder.
 */
export const storage = defineStorage({
  name: 'dermalyzePhotos',
  access: (allow) => ({
    'photos/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
