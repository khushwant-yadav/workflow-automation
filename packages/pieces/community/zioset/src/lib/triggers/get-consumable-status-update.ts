import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import * as crypto from 'crypto';

const sampleData = {
    eventType: "CONSUMABLE_STATUS_CHANGED",
    newStatus: "Damaged",
    changedDate: "2026-10-06T10:30:00.000+00:00",
    remark: "Item found damaged during inspection",
    changedBy: {
        userId: 15,
        username: "jdoe",
        firstName: "John",
        lastName: "Doe",
        employeeNo: "EMP001",
        email: "john.doe@example.com"
    },
    consumableItems: [
        {
            inventoryId: 501,
            previousStatus: "Available",
            newStatus: "Damaged",
            invnetoryCode: "INV-0501",
            itemCode: "ITM-0501",
            sequenceNo: 1,
            consumableItemId: 12,
            specification: "16GB RAM, Wireless",
            makeName: "Logitech",
            modelName: "MX Master 3",
            typeName: "Mouse"
        }
    ]
};

export const consumableStatusUpdated = createTrigger({
    auth: zioSetAuth,
    name: 'consumable_status_updated',
    displayName: 'Consumable Status Updated',
    description: 'Triggers when the status of one or more consumable stock items is updated',
    aiMetadata: {
        description: 'Triggers when a consumable item\'s status is changed in ZioSet (e.g. Available to Damaged, Scrap, etc.)',
    },
    props: {},
    sampleData: {
        ...sampleData
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const baseUrl = context.auth.props.baseUrl;

        const response = await httpClient.sendRequest<{
            code: number;
            message: string;
            data: {
                id: number;
                status: string;
                secret: string;
            };
        }>({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/webhooks/register`,
            headers: {
                authorization: `Bearer ${context.auth.access_token}`,
            },
            body: {
                event: 'CONSUMABLE_STATUS_UPDATE',
                targetUrl: context.webhookUrl,
            },
        });

        await context.store.put('consumable_status_update_webhook_id', response.body.data.id);
        await context.store.put('consumable_status_update_webhook_secret', response.body.data.secret);
    },

    async onDisable(context) {
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get('consumable_status_update_webhook_id');

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
        const secret = await context.store.get<string>('consumable_status_update_webhook_secret');
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
        return [sampleData];
    },
});