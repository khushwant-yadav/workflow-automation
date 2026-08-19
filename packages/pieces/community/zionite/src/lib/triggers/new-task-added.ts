import { zioniteAuth } from '../common/auth';
import {
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty
} from '@activepieces/pieces-framework';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof zioniteAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${auth.props.baseUrl}/user/getAllUsers`,
      headers: {
        authorization: auth.access_token,
      },
    };
    const res = await httpClient.sendRequest(request);
    const tasks = res.body as any[];
    // const items = Array.isArray(res.body) ? res.body : (Array.isArray(res.body.data) ? res.body.data : [res.body]);
  

    return tasks.map((task) => ({
      epochMilliSeconds: new Date(task.createdAt).valueOf(),
      data: task,
    }));
  },
};

export const newtaskCreated = createTrigger({
  auth: zioniteAuth,
  name: 'newTaskCreated',
  displayName: 'Get New Task',
  description: 'triggers when a new task is added.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});