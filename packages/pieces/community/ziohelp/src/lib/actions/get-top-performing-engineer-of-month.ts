import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { zioHelpAuth } from '../common/auth';

interface EngineerPerformance {
  engineerId: number;
  engineerName: string;
  totalTickets: number;
  closedTickets: number;
  productivity: number;
  totalWorkedSeconds: number;
  workedTime: string;
  rank: number;
  completionPercentage: number;
  averageWorkingTimePerTicket: string;
}

export const getTopPerformingEngineerOfMonth = createAction({
  auth: zioHelpAuth,

  name: 'getTopPerformingEngineerOfMonth',

  displayName: 'Get Top Performing Engineer of the Month',

  description:
    'Fetch the list of engineers ranked by performance for a given month (defaults to current month/year if left empty)',

  props: {
    month: Property.StaticDropdown({
      displayName: 'Month',
      description: 'Select the month for dynamic value 1 - 12 (defaults to current month if left empty)',
      required: false,
      options: {
        options: [
          { label: 'January', value: '1' },
          { label: 'February', value: '2' },
          { label: 'March', value: '3' },
          { label: 'April', value: '4' },
          { label: 'May', value: '5' },
          { label: 'June', value: '6' },
          { label: 'July', value: '7' },
          { label: 'August', value: '8' },
          { label: 'September', value: '9' },
          { label: 'October', value: '10' },
          { label: 'November', value: '11' },
          { label: 'December', value: '12' },
        ],
      },
    }),

    year: Property.Number({
      displayName: 'Year',
      description: 'Enter the year (defaults to current year if left empty)',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    // Calculate current month/year at RUN TIME (not load time)
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1);
    const currentYear = now.getFullYear();

    const month = propsValue.month ?? currentMonth;
    const year = propsValue.year ?? currentYear;

    // Call ZioHelp engineers top API
    const engineersResponse =
      await httpClient.sendRequest<EngineerPerformance[]>({
        method: HttpMethod.GET,

        url: `${auth.props.baseUrl}/api/admin/dashboard/engineers/top`,

        queryParams: {
          month: String(month),
          year: String(year),
        },

        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });

    return engineersResponse.body;
  },
});