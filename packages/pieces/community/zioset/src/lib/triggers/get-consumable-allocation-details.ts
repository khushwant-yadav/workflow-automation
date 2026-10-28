import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import * as crypto from 'crypto';

const sampleData = {
    eventType: "CONSUMABLE_ALLOCATION_UPDATED",
    transactionType: "Allocation", // Allocation / DeAllocation / Replacement
    transactionDate: "2026-10-05T10:30:00.000+00:00",
    employee: {
        employeeId: 101,
        employeeName: "John Doe",
        employeeNo: "EMP001",
        email: "john.doe@example.com",
        mobileNo: "9876543210",
        locationName: "Pune Office",
        projectName: "Project Alpha",
        grade: "L3",
        businessUnit: "IT Services",
        siteName: "Pune Site",
        manager: "Jane Smith",
        firstManager: "Jane Smith",
        secondManager: "Mark Lee",
        locationFullName: "Pune - Magarpatta"
    },
    assetItem: {
        inventoryId: 501,
        status: "Allocated",
        assetId: 12
    },
    oldConsumableItem: {
        inventoryId: 498,
        status: "Available",
        consumableItemId: 11
    },
    allocationType: "Manual",
    requestType: "New Request"
};

export const consumableAllocationUpdated = createTrigger({
    auth: zioSetAuth,
    name: 'consumable_allocation_updated',
    displayName: 'Consumable Allocation Updated',
    description: 'Triggers when an consumable asset is allocated, de-allocated, or replaced for an employee',
    aiMetadata: {
        description: 'Triggers when an asset allocation, de-allocation, or replacement happens in ZioSet',
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
                event: 'CONSUMABLE_ALLOCATION_UPDATED',
                targetUrl: context.webhookUrl,
                
            },
        });

        await context.store.put('consumable_allocation_webhook_id', response.body.data.id);
        await context.store.put('consumable_allocation_webhook_secret', response.body.data.secret);
    },

    async onDisable(context) {
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get('consumable_allocation_webhook_id');

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
        console.log(context.payload.body);
        const secret = await context.store.get<string>('consumable_allocation_webhook_secret');
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