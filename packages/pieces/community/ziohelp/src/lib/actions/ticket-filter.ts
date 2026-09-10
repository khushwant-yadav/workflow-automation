import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioHelpAuth } from '../common/auth';

export const ticketFilterAction = createAction({
  auth: zioHelpAuth,
  name: 'ticket_filter',
  displayName: 'All Ticket With Filter',
  description:
    'Search/filter support tickets by title, ticket number, channel, product, organization, status, rating, priority, assigned to, created by and created at.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Filter by ticket title (partial match)',
      required: false,
    }),
    ticketNumber: Property.ShortText({
      displayName: 'Ticket No',
      description: 'Filter by ticket number (partial match, e.g. "2" matches TKT-000... containing 2)',
      required: false,
    }),
    channel: Property.ShortText({
      displayName: 'Channel',
      description: 'e.g. email, whatsapp, portal, manual, api, etc.',
      required: false,
    }),
    product: Property.ShortText({
      displayName: 'Product',
      description: 'Filter by product name',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Filter by organization name',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Assigned', value: 'assigned' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    rating: Property.ShortText({
      displayName: 'Rating',
      description: 'Customer satisfaction rating',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' },
        ],
      },
    }),
    assignedTo: Property.ShortText({
      displayName: 'Assigned To',
      description: 'Filter by assignee name/username',
      required: false,
    }),
    createdBy: Property.ShortText({
      displayName: 'Created By',
      description: 'Filter by creator name/username',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Created At',
      description: 'Filter by creation date',
      required: false,
    }),
    pageNo: Property.Number({
      displayName: 'Page No',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      required: false,
      defaultValue: 100000,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const auth = context.auth;

    
    const fieldMap: Array<[string, unknown]> = [
      ['title', props.title],
      ['ticketNumber', props.ticketNumber],
      ['channel', props.channel],
      ['product.name', props.product],
      ['organization.name', props.organization],
      ['status', props.status],
      ['satisfactionRating', props.rating],
      ['priority', props.priority],
      ['assignedTo', props.assignedTo],
      ['createdBy', props.createdBy],
      ['createdAt', props.createdAt],
    ];

    const columns = fieldMap
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([columnName, value]) => ({ columnName, value: String(value) }));

    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.POST,
      url: `${auth.props.baseUrl}/api/tickets/getTicketListByGroupSearch`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.access_token}`,
      },
      body: {
        columns,
        pageNo: props.pageNo ?? 1,
        perPage: props.perPage ?? 100000,
      },
    });

    return response.body;
  },
});