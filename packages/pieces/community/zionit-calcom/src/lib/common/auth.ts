
import { PieceAuth, OAuth2GrantType, } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const calComApiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'Cal.com API Key',
  description: 'Connect using your Cal.com API key.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Generate an API key in Cal.com settings.',
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

      return { valid: true };
    } catch (error) {
      console.error('Cal.com API key validation failed:', error);

      return {
        valid: false,
        error: 'Invalid Cal.com API key or unable to connect.',
      };
    }
  },

  required: true,
});

const calComOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Cal.com OAuth2',
  description: 'Connect your Cal.com account using OAuth2.',
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  authUrl: 'https://app.cal.com/auth/oauth2/authorize',
  tokenUrl: 'https://api.cal.com/v2/auth/oauth2/token',
  scope: [],
  required: true,
});

export const calComAuth = [
  // calComApiKeyAuth,
  calComOAuth2Auth,
];
