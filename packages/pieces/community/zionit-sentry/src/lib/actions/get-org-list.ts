
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sentryAuth } from '../common/auth';
import { sentryApiCall } from '../common/client';

export const getOrgList = createAction({
  name: 'list_organizations',
  displayName: 'List Organizations',
  description: 'Retrieve organizations accessible through your Sentry account.',
  auth: sentryAuth,
  props: {},

  async run(context) {
    const response = await sentryApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/organizations/',
    });

    return response.body;
  },
});

