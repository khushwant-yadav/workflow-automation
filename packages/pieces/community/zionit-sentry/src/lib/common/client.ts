
import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const SENTRY_BASE_URL = 'https://sentry.io/api/0';

export function getSentryToken(auth: unknown): string {
  const oauth = auth as {
    access_token?: string;
  };

  if (!oauth?.access_token) {
    throw new Error(
      'Sentry: Access token not found. Please reconnect your Sentry account.',
    );
  }

  return oauth.access_token;
}

export async function sentryApiCall<
  T extends HttpMessageBody = any
>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}) {
  return httpClient.sendRequest<T>({
    method,
    url: `${SENTRY_BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${getSentryToken(auth)}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
}
