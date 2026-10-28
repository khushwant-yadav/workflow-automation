import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import * as crypto from 'crypto';

const sampleData = {
    eventType: "ASSET_SCRAP_APPROVAL_REQUESTED",
    approvalRequestId: 1001,
    approvalStatus: "Pending",
    newStatus: "Scrap",
    remarks: "Sample remark",
    requestDate: "01-01-2026",
    requestTime: "10:00 am",

    requestedBy: {
        name: "Admin User",
        employeeNo: "EMP001",
        email: "admin.user@example.com"
    },

    assets: [
        {
            srNo: 1,
            category: "End User Computing",
            type: "Laptop",
            make: "Sample Make",
            model: "Sample Model",
            tag: "ASSET-0001",
            serialNo: "SN123456",
            location: "Sample Location",
            invoiceNo: "INV-0001",
            invoiceDate: "01-01-2025",
            poNo: "PO-0001",
            purchaseOrderDate: "01-01-2025",
            boeNo: "BOE-0001",
            ouName: "Sample OU",
            previousStatus: "Missing"
        }
    ],

    emailTemplate: {
        templateName: "Asset Status Approval",
        subject: "Asset Status Approval",
        htmlBody: "<html><body><h2>Asset Approval Request - Scrap</h2><p>Dear Commercial Team,</p></body></html>",
        toRecipients: ["to@example.com"],
        ccRecipients: ["cc@example.com"],
        excelFileName: "Asset.xlsx",
        excelBase64: "UEsDBBQACAgI..."
    }
};

// base64 -> file URL (email attachment ke liye)
async function convertExcel(context: any, body: any) {
    const tpl = body?.emailTemplate;

    if (!tpl?.excelBase64) {
        return body;
    }

    const fileName: string = tpl.excelFileName || 'Asset.xlsx';

    const excelFile = await context.files.write({
        fileName,
        data: Buffer.from(tpl.excelBase64, 'base64'),
    });

    // heavy base64 hata do, sirf file URL rakho
    const { excelBase64, ...restTpl } = tpl;

    return {
        ...body,
        emailTemplate: {
            ...restTpl,
            excelFileName: fileName,
            excelFile,
        },
    };
}

export const scrapStatusUpdate = createTrigger({
    auth: zioSetAuth,
    name: 'Scrap_Status_Update',
    displayName: 'Get Scrap Status Update',
    description: 'Triggers when status is updated to Scrap',
    aiMetadata: {
        description: 'Triggers when Asset status is updated to scrap in ZioSet',
    },
    props: {},
    sampleData,
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
                event: 'ASSET_SCRAP_APPROVAL_REQUESTED',
                targetUrl: context.webhookUrl,
            },
        });

        await context.store.put('asset_scrap_status_update_id', response.body.data.id);
        await context.store.put('asset_scrap_status_update_secret', response.body.data.secret);
    },

    async onDisable(context) {
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get('asset_scrap_status_update_id');

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
        const secret = await context.store.get<string>('asset_scrap_status_update_secret');
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

        const result = await convertExcel(context, context.payload.body);
        return [result];
    },

    async test(context) {
        const { excelBase64, ...restTpl } = sampleData.emailTemplate;

        return [{
            ...sampleData,
            emailTemplate: {
                ...restTpl,
                excelFile: "https://example.com/files/Asset.xlsx",
            },
        }];
    },
});