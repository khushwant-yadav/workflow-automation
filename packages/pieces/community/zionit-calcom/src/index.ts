import { createPiece } from '@activepieces/pieces-framework';
import { calComAuth } from './lib/common/auth';
import { getMyProfile } from './lib/actions/get-my-profile';

export const calCom = createPiece({
  displayName: 'Cal.com',
  description: 'Manage bookings and scheduling.',
  auth: calComAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal-com.png',
  authors: [],
  actions: [getMyProfile],
  triggers: [],
});