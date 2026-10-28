import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioHelpAuth } from '../common/auth';

export const getTicketsByEmailAction = createAction({
  auth: zioHelpAuth,
  name: 'get_tickets_by_email',
  displayName: 'Get Tickets By Email',
  description:
    'Fetches all tickets associated with a given customer email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email address to fetch tickets for',
      required: true,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const auth = context.auth;
  
    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.GET,
      url: `${auth.props.baseUrl}/api/tickets/myTicketsCreatedByEmail/${encodeURIComponent(props.email)}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.access_token}`,
      },
    });
  
    return response.body;
  },
});