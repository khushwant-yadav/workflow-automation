import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { calComAuth} from '../common/auth';

export const getMyProfile = createAction({
  name: 'get_my_profile',
  displayName: 'Get My Profile',
  description: 'Retrieve your Cal.com profile.',
  auth: calComAuth,
  props: {},

  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.cal.com/v2/me',
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
        Accept: 'application/json',
      },
    });

    return response.body;
  },
});