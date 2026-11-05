import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const CAL_BASE_URL = 'https://api.cal.com/v2';

export function getCalToken(auth: any): string {
  // OAuth2 connection -> { access_token, ... }
  if (auth?.access_token) return auth.access_token as string;
  // API key connection -> { props: { apiKey } } (or { apiKey } on some versions)
  const key = auth?.props?.apiKey ?? auth?.apiKey;
  if (!key) {
    throw new Error('Cal.com: no access token or API key found in connection.');
  }
  return key as string;
}

export async function calApiCall<T extends HttpMessageBody = any>({
  auth,
  method,
  path,
  body,
  queryParams,
  apiVersion,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  apiVersion?: string; 
}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getCalToken(auth)}`,
    Accept: 'application/json',
  };
  if (apiVersion) headers['cal-api-version'] = apiVersion;

  return httpClient.sendRequest<T>({
    method,
    url: `${CAL_BASE_URL}${path}`,
    headers,
    body,
    queryParams,
  });
}