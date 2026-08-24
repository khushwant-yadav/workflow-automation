import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { zioHelpAuth } from '../common/auth';

interface User {
  id: number;
  fullName: string;
  email?: string;
  emailId?: string;
  firstName?: string;
  lastName?: string;
}

interface UsersResponse {
  content: User[];
  totalElements?: number;
  page?: number;
  size?: number;
  totalPages?: number;
  last?: boolean;
}

export const getAllUsers = createAction({
  auth: zioHelpAuth,

  name: 'getAllUsers',

  displayName: 'Get All User Details',

  description:
    'Find All ZioHelp User',

  props: {
    email: Property.ShortText({
      displayName: 'User Email',
      description:
        'Enter the email address of the user',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    // 1. Call  ZioHelp users API
    const usersResponse =
      await httpClient.sendRequest<UsersResponse>({
        method: HttpMethod.GET,

        url: 'https://ziohelp-api.zionitai.com/api/users/all',

        queryParams: {
          page: '0',
          size: '10000',
          sortBy: 'fullName',
          sortDir: 'asc',
        },

        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });
    
    return usersResponse.body;
  },
});