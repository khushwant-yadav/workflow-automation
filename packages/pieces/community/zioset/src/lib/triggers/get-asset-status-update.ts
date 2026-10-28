import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import * as crypto from 'crypto';

const sampleData = {
    eventType: "ASSET_STATUS_CHANGED",
    newStatus: "New Status",
    updatedDate: "01-01-2026",
    updatedTime: "10:30 am",

    updatedBy: {
        name: "Admin User",
        employeeNo: "EMP001",
        email: "admin.user@example.com"
    },

    assets: [
        {
            assetTagId: "ASSET-0001",
            serial_no: "SN123456",
            material_name: "Sample Model",
            type: "Laptop",
            location: "Sample Location",
            previousStatus: "Previous Status",
            newStatus: "New Status",
            changedFields: {
                inventroyStatus: "In-Stock → Missing",
                type: "Sample Type A → Sample Type B",
                stockUpdatedDate: "2026-01-01 00:00:00.0 → 2026-01-01"
            }
        }
    ]
};

export const statusUpdate = createTrigger({
    auth: zioSetAuth,
    name: 'Asset_Status_Update',
    displayName: 'Get Status Update',
    description: 'Triggers when status is updated other than Scrap',
    aiMetadata: {
        description: 'Triggers when Asset status is updated in ZioSet',
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
        }; }>({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/webhooks/register`,
            headers: {
                authorization: `Bearer ${context.auth.access_token}`,
            },
            body: {
                event: 'ASSET_STATUS_CHANGED',
                targetUrl: context.webhookUrl,
            },
        });

        await context.store.put('asset_status_update_id', response.body.data.id);
        await context.store.put('asset_status_update_secret', response.body.data.secret);
    },

    async onDisable(context) {
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get('asset_status_update_id');

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
        const secret = await context.store.get<string>('asset_status_update_secret');
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