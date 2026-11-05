import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import { HttpMethod } from '@activepieces/pieces-common';

import { manageEngineAuth } from '../common/auth';
import { manageEngineApiCall } from '../common/client';

export const listRequests = createAction({
  name: 'list_requests',
  displayName: 'List Requests',
  description: 'Retrieve service requests from ManageEngine ServiceDesk Plus.',
  auth: manageEngineAuth,

  props: {
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number to retrieve.',
      required: true,
      defaultValue: 1,
    }),

    limit: Property.Number({
      displayName: 'Records Per Page',
      description: 'Number of requests to retrieve.',
      required: true,
      defaultValue: 25,
    }),
  },

  async run(context) {
    const { page, limit } = context.propsValue;

    const inputData = {
      list_info: {
        start_index: (page - 1) * limit + 1,
        row_count: limit,
        sort_field: 'created_time',
        sort_order: 'desc',
      },
    };

    const response = await manageEngineApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/requests',
      queryParams: {
        input_data: JSON.stringify(inputData),
      },
    });

    return response.body;
  },
});