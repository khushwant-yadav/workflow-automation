import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {HttpMethod, httpClient} from '@activepieces/pieces-common';
export const zioHelpAuth = PieceAuth.CustomAuth({
    displayName: 'ZioHelp Authantication',
    props: {
        baseUrl: Property.ShortText({
            displayName: 'Instance URL',
            defaultValue: 'https://choosing-neutron-ascent.ngrok-free.dev',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email ID',
            required: true,
        }),
        password: PieceAuth.SecretText({
            displayName: 'Password',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${auth.baseUrl}/api/auth/login`,
          body: {
            email: auth.email,
            password: auth.password,
          },
        });

      return {
         //valid: Boolean(response.body?.data?.accessToken),
        valid: true,
      };
      } catch (error) {
        console.error('ZioHelp login failed:', error);

      return {
         valid: false,
         error: 'Invalid ZioHelp credentials',
       };
      }
    },
    // Optional: cache the token server-side to avoid a login call per action
    refresh: {
        generate: async ({ auth }) => {
            const response = await httpClient.sendRequest<{ token: string }>({
                method: HttpMethod.POST,
                url: `${auth.baseUrl}/api/auth/login`,
                body: { email: auth.email, password: auth.password },
            });
            return {
                 access_token: response.body.token,
                // expires_in: 3600, // optional, in seconds
            };
        },
        // Used when the API doesn't return expires_in. Defaults to 3300 (55 min).
        defaultExpiresIn: 3300,
    },
    required: true,
})