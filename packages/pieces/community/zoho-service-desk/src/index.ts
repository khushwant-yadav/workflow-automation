import { createPiece } from '@activepieces/pieces-framework';

import { manageEngineAuth } from './lib/common/auth';
import { listRequests } from './lib/actions/list-requests';

export const manageEngineServiceDesk = createPiece({
  displayName: 'ManageEngine ServiceDesk Plus',
  description: 'Automate IT service management, requests and support tickets.',
  auth: manageEngineAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/manageengine.png',
  authors: [],
  actions: [
    listRequests,
  ],
  triggers: [],
});