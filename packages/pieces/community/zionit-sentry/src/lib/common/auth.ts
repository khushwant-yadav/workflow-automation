
import {
  PieceAuth,
  OAuth2GrantType,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';

export const sentryAuth = PieceAuth.OAuth2({
  displayName: 'Sentry OAuth2',
  description: 'Connect your Sentry account using OAuth2.',
  required: true,

  grantType: OAuth2GrantType.AUTHORIZATION_CODE,

  authUrl: 'https://sentry.io/oauth/authorize/',
  tokenUrl: 'https://sentry.io/oauth/token/',

  authorizationMethod: OAuth2AuthorizationMethod.BODY,

  scope: [
    'org:read',
    'project:read',
    'event:read',
  ],
});
