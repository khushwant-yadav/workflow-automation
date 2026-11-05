import {
  PieceAuth,
  OAuth2GrantType,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const calComApiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'Cal.com API Key',
  description: 'Connect using your Cal.com API key.',
  required: true,
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
      return {
        valid: false,
        error: 'Invalid Cal.com API key or unable to connect.',
      };
    }
  },
});

export const calComOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Cal.com OAuth2',
  description: 'Connect your Cal.com account using OAuth2.',
  required: true,
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  authUrl: 'https://app.cal.com/auth/oauth2/authorize',
  tokenUrl: 'https://api.cal.com/v2/auth/oauth2/token',
  // Cal.com expects client_id / client_secret in the request body
  authorizationMethod: OAuth2AuthorizationMethod.BODY,
  scope: [
    'PROFILE_READ',
    'EVENT_TYPE_READ',
    'BOOKING_READ',
    'BOOKING_WRITE',
  ],
});

export const calComAuth = [calComApiKeyAuth, calComOAuth2Auth];