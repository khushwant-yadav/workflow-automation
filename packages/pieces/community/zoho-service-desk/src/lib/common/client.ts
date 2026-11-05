import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const SDP_API_VERSION = 'v3';

const INDIA_API_DOMAIN = 'https://sdpondemand.manageengine.in';

interface ManageEngineOAuth {
  access_token?: string;
  api_domain?: string;
}

export function getManageEngineToken(auth: unknown): string {
  const oauth = auth as ManageEngineOAuth;

  if (!oauth?.access_token) {
    throw new Error(
      'ManageEngine: OAuth access token not found. Please reconnect your account.',
    );
  }

  return oauth.access_token;
}

export function getManageEngineApiDomain(auth: unknown): string {
  const oauth = auth as ManageEngineOAuth;

  return (
    oauth?.api_domain?.replace(/\/+$/, '') ||
    INDIA_API_DOMAIN
  );
}

export async function manageEngineApiCall<T extends 
HttpMessageBody = any>({
  auth,
  method,
  path,
  queryParams,
  body,
}: {
  auth: unknown;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}) {
  const token = getManageEngineToken(auth);
  const baseUrl = getManageEngineApiDomain(auth);

  return httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}/api/${SDP_API_VERSION}${path}`,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: 'application/vnd.manageengine.sdp.v3+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    queryParams,
    body,
  });
}