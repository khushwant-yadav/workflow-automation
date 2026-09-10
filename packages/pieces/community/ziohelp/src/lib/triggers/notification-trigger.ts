import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioHelpAuth } from '../common/auth';
import * as crypto from 'crypto';

const NOTIFICATION_SAMPLE_DATA = {
  eventType: 'Event Type',
  ticketId: 'ticket id',
  ticketTitle: 'issue details',
  ticketNumber: 'TKT-000XXX',
  status: 'Ticket Status',
  timestamp: '20XX-XX-00X00:00:00.0XXXXXZ',
};

export const notificationTrigger = createTrigger({
  auth: zioHelpAuth,
  name: 'notification_trigger',
  displayName: 'Ticket Notification',
  description: 'Triggers when any ticket event happens, such as new, assigned, status changed, resolved, or escalated',
  props: {},   
  sampleData: NOTIFICATION_SAMPLE_DATA,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const auth = context.auth;
    const response = await httpClient.sendRequest<{ id: number; secret: string }>({
      method: HttpMethod.POST,
      url: `${auth.props.baseUrl}/api/webhooks/register`,
      headers: { authorization: `Bearer ${auth.access_token}` },
      body: {
        event: 'ticket.notification',   
        targetUrl: context.webhookUrl,
      },
    });

    await context.store.put('notification_webhook_id', response.body.id);
    await context.store.put('notification_webhook_secret', response.body.secret);
  },

  async onDisable(context) {
    const auth = context.auth;
    const webhookId = await context.store.get('notification_webhook_id');

    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${auth.props.baseUrl}/api/webhooks/${webhookId}`,
        headers: { authorization: `Bearer ${auth.access_token}` },
      });
    }
  },

  async run(context) {
      const secret = await context.store.get<string>('notification_webhook_secret');
      const receivedSignature = context.payload.headers['x-ziohelp-signature'];
      const timestamp = context.payload.headers['x-ziohelp-timestamp'];
      
      if (!secret || !receivedSignature || !timestamp) {
          throw new Error('Missing secret, signature, or timestamp — cannot verify webhook authenticity');
      }
  
      const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(timestamp)
          .digest('hex');
  
      let isValid = false;
      try {
          isValid = crypto.timingSafeEqual(
              Buffer.from(receivedSignature),
              Buffer.from(expectedSignature)
          );
      } catch (e) {
          isValid = false;
      }
  
      if (!isValid) {
          throw new Error('Invalid webhook signature — rejecting this request');
      }
  
      return [context.payload.body];
  },

  async test(context) {
    return [NOTIFICATION_SAMPLE_DATA];
  },

});