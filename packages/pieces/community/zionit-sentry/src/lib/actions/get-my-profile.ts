

import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sentryAuth } from '../common/auth';
import { sentryApiCall } from '../common/client';

export const getMyProfile = createAction({
  name: 'get_my_profile',
  displayName: 'Get My Profile',
  description: 'Retrieve the authenticated Sentry user profile.',
  auth: sentryAuth,

  props: {},

  async run(context) {
    const response = await sentryApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/auth/',
    });

    return response.body;
  },
});
