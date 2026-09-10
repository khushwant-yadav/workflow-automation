import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { zioHelpAuth } from '../common/auth';
import { organizationNameDropdown, departmentDropdown, userRolesDropdown } from '../common/props';

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
    'Find all ZioHelp users, with optional filters for organization, department and role',

  props: {
    organizationId: organizationNameDropdown(false),

    role: userRolesDropdown,

    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (0-indexed). Defaults to 0.',
      required: false,
      defaultValue: 0,
    }),

    size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of users per page. Defaults to 10000 (all users).',
      required: false,
      defaultValue: 10000,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    // Build query params, only including filters that were actually provided
    const queryParams: Record<string, string> = {
      page: String(propsValue['page'] ?? 0),
      size: String(propsValue['size'] ?? 10000),
  
    };

    if (propsValue['organizationId']) {
      queryParams['organizationId'] = String(propsValue['organizationId']);
    }

    if (propsValue['role']) {
      queryParams['role'] = propsValue['role'];
    }

    // Call ZioHelp users API
    const usersResponse =
      await httpClient.sendRequest<UsersResponse>({
        method: HttpMethod.GET,

        url: `${auth.props.baseUrl}/api/users/all`,

        queryParams,

        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });

    return usersResponse.body;
  },
});