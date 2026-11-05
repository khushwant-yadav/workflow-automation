import {
  PieceAuth,
  OAuth2GrantType,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const serviceDeskApiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'Zoho Service Desk API Key',
  description: 'Connect using your Zoho Service Desk API key.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Generate an API key in Zoho Service Desk settings.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.zoho.com/service-desk/v1/me',
        headers: {
          Authorization: `Bearer ${auth.apiKey}`,
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid Zoho Service Desk API key or unable to connect.',
      };
    }
  },
});


export const manageEngineAuth = PieceAuth.OAuth2({
  displayName: 'ManageEngine ServiceDesk Plus OAuth2',
  description: 'Connect your ServiceDesk Plus Cloud India account.',
  required: true,

  grantType: OAuth2GrantType.AUTHORIZATION_CODE,

  // Request an offline token so A ctivepieces can refresh access tokens.
  authUrl:
    'https://accounts.zoho.in/oauth/v2/auth?access_type=offline&prompt=consent',

  tokenUrl: 'https://accounts.zoho.in/oauth/v2/token',

  authorizationMethod: OAuth2AuthorizationMethod.BODY,

  // Zoho expects comma-separated scopes.
  // Keeping these in one array entry preserves that delimiter.
  scope: [
    'SDPOnDemand.requests.READ,SDPOnDemand.setup.READ',
  ],
});

export const serviceDeskAuth = [serviceDeskApiKeyAuth, manageEngineAuth];