import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioHelpAuth } from '../common/auth';

export const statusUpdate = createTrigger({
    auth: zioHelpAuth,
    name: 'statusUpdate',
    displayName: 'Status Update',
    description: 'Triggers when a ticket status is updated',
    aiMetadata: {
        description: 'Triggers when a ticket status is updated in ZioHelp',
    },
    props: {},
    sampleData: {
        id: 501,
        title: 'Login issue on production',
        status: 'IN_PROGRESS',
        previousStatus: 'OPEN',
        updatedAt: '2026-08-21T10:00:00Z',
    },
    type: TriggerStrategy.WEBHOOK,

    

    async onEnable(context) {
        const baseUrl = context.auth.props.baseUrl;

        const response = await httpClient.sendRequest<{ id: number }>({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/webhooks/register`,
            headers: {
                authorization: `Bearer ${context.auth.access_token}`,  
            },
            body: {
                event: 'ticket.status_updated',
                targetUrl: context.webhookUrl,
            },
        });

        await context.store.put('zioHelp_webhook_id', response.body.id);
    },

    async onDisable(context) {
        // on disable  unregister webhook
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get('zioHelp_webhook_id');
        if (webhookId) {
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `${baseUrl}/api/webhooks/${webhookId}`,
                headers: {
                    authorization: `Bearer ${context.auth.access_token}`,
                },
            });
        }
    },

    async run(context) {
        //data come from ziohelp webhook and Activepieces automatically send it to this run function
        return [context.payload.body];
    },

    async test(context) {
        // On click of test button, this function will be called to test the trigger
        const baseUrl = context.auth.props.baseUrl;
       
        const response = await httpClient.sendRequest<{ id: number }>({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/webhooks/register`,
            headers: {
                authorization: `Bearer ${context.auth.access_token}`,
            },
            body: {
                event: 'ticket.status_updated',
                targetUrl: context.webhookUrl,   // provide the test webhook url
            },
        });

        return [response.body || {
            id: 501,
            title: 'Login issue on production',
           
        }];
    },
});