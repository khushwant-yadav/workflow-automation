
import {PieceAuth,Property,} from '@activepieces/pieces-framework';
import {HttpMethod,httpClient,} from '@activepieces/pieces-common';

export const calComAuth = PieceAuth.CustomAuth({
  displayName: 'Cal.com API Key Authentication',
  description: 'Connect your Cal.com account using an API key.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Generate an API key in your Cal.com account settings.',
      required: true,
    }),
  },

  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.cal.com/v2/me',
        headers: {
          Authorization: `Bearer ${auth.apiKey}`,
          Accept: 'application/json',
        },
      });

      return {
        valid: true,
      };
    } catch (error) {
      console.error('Cal.com API key validation failed:', error);

      return {
        valid: false,
        error: 'Invalid Cal.com API key or unable to connect to Cal.com.',
      };
    }
  },

  required: true,
});
