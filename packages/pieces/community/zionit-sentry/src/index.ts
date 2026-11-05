
import { createPiece } from '@activepieces/pieces-framework';
import { sentryAuth } from './lib/common/auth';
import { getMyProfile } from './lib/actions/get-my-profile';
import { getOrgList } from './lib/actions/get-org-list';

export const sentry = createPiece({
  displayName: 'Sentry',
  description: 'Manage Sentry issues, projects and error monitoring.',
  auth: sentryAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://brandlogos.sgp1.digitaloceanspaces.com/svg/logos/sentry.svg',
  authors: [],
  actions: [getMyProfile, getOrgList],
  triggers: [],
});
