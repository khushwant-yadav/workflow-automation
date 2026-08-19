import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { zioniteAuth } from '../common/auth';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  emailId: string;
  mobileNumber?: string;
  department?: {
    id: number;
    name: string;
  };
  designation?: {
    id: number;
    name: string;
  };
  role?: {
    roleId: number;
    roleName: string;
  };
}

interface UsersResponse {
  data: User[];
}

export const getDailyTask = createAction({
  auth: zioniteAuth,

  name: 'getDailyTask',

  displayName: 'Get Daily Tasks',

  description:
    'Find a Zioteam user by email and fetch their assigned tasks',

  props: {
    email: Property.ShortText({
      displayName: 'User Email',
      description:
        'Enter the email address of the Zioteam user whose tasks you want to fetch',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    // 1. Get all users
  
    const usersResponse =
      await httpClient.sendRequest<UsersResponse>({
        method: HttpMethod.GET,

        url: `${auth.props.baseUrl}/user/getAllUsers`,

        headers: {
          Authorization: auth.access_token,
          'Content-Type': 'application/json',
        },
      });

      //return usersResponse.body?.data ?? [];

    const users = usersResponse.body?.data ?? [];

    //2. Find user by email
    
    const email = propsValue.email.trim().toLowerCase();

    const user = users.find(
      (item) => item.emailId?.toLowerCase() === email,
    );

    
    // 3. User not found
  

    if (!user) {
      throw new Error(
        `No Zioteam user found with email: ${propsValue.email}`,
      );
    }

    return user
  
   
  },
});