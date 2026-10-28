import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import { buildGatePassPdf } from './gatepass-pdf';
import { buildAssetExcel } from './asset-excel';
import * as crypto from 'crypto';

const sampleData = {
    eventType: 'ASSET_ALLOCATION_UPDATED',
    transactionType: 'Allocation_Type',
    transactionDate: 'dd-mm-yyyy',
    transactionTime: 'hh:mm am',
    transactionBy: 'transaction_by_user',
    previousStatus: 'previous_status',
    newStatus: null,
    remark: 'Sample remark',

    employee: {
        employeeId: 18399,
        employeeName: 'Employee Name',
        employeeNo: '212121',
        email: 'employee.m@zionit.com',
        mobileNo: '992xxxxxxx',
        locationName: 'Pune',
        projectName: 'Asset Management system',
        grade: null,
        businessUnit: null,
        siteName: null,
        manager: 'manager_name',
        firstManager: null,
        secondManager: null
    },

    asset: {
        assetTagId: 'Z/IND42/N/LPC0226',
        serialNo: 'SC02S41SUFVH7',
        computerName: null,
        hostname: null,
        type: 'Apple MacBook Pro',
        category: 'End User Computing',
        make: 'UNICORN INFOSOLUTIONS',
        model: 'Apple MacBook Pro',
        status: 'Allocated',
        location: 'Pune',
        assetLocation: '',
        site: 'IND42',
        deskNo: '1122',
        projectName: 'Asset Management system',
        gatePassNo: '0020/10/2026-27',
        expectedReturnDate: '24-10-2026'
    },

    oldAsset: null,

    gatePass: {
        projectManager: 'Datta Bodhale',
        issuingDate: '21-10-2026',
        expectedReturnDate: '24-10-2026',
        description: 'Sample description',
        userName: 'Balaji mali',
        customerName: '',
        timeOut: null,
        site: 'IND42',
        createdDate: '21-10-2026',
        gateReturnType: 'Returnable',
        gatePassNo: '0020/10/2026-27',
        deliveryMode: '',
        createdBy: 'System Admin',
        projectCode: 'Asset Management system / 872348624',
        location: 'Pune',
        gateType: 'Allocation',
        items: [
            {
                description: 'Sample description',
                assetNo: 'Z/IND42/N/LPC0226',
                type: 'Apple MacBook Pro',
                serialNo: 'SC02S41SUFVH7'
            }
        ],
        gatePassFor: 'Apple MacBook Pro',
        staffId: '212121',
        gatePassTo: null,
        status: 'Open',
        pdfFileName: null,
        pdfFile: null
    },

    putaway: null,

    mail: {
        employeeName: 'Balaji mali (212121)',
        serialNumber: 'SC02S41SUFVH7',
        assetTagId: 'Z/IND42/N/LPC0226',
        model: 'Apple MacBook Pro',
        remark: 'Sample remark',
        assetStatus: 'INSTALLATION'
    },

    emailTemplate: {
        templateName: 'Asset Allocation',
        subject: 'Asset Allocation',
        htmlBody: '<html><body><p>Sample asset notification</p></body></html>',
        toRecipients: ['balaji.m@zionit.in'],
        ccRecipients: []
    },

    // Single file, always present: gate pass PDF, or asset details Excel.
    attachment: 'http://localhost:4200/api/v1/files/sample?token=sample',
    attachmentName: 'Gatepass_0020-10-2026-27.pdf'
};

const safeName = (value: unknown): string =>
    String(value ?? 'NA').replace(/[^A-Za-z0-9_.-]+/g, '-');

export const assetAllocationUpdated = createTrigger({
    auth: zioSetAuth,
    name: 'asset_allocation_updated',
    displayName: 'Asset Allocation Updated',
    description:
        'Triggers when an asset is allocated, de-allocated, or replaced for an employee.',
    aiMetadata: {
        description:
            'Triggers when an asset allocation, de-allocation, or replacement happens in ZioSet.'
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
                authorization: `Bearer ${context.auth.access_token}`
            },
            body: {
                event: 'ASSET_ALLOCATION_UPDATED',
                targetUrl: context.webhookUrl
            }
        });

        await context.store.put(
            'asset_allocation_webhook_id',
            response.body.data.id
        );

        await context.store.put(
            'asset_allocation_webhook_secret',
            response.body.data.secret
        );
    },

    async onDisable(context) {
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get<number>(
            'asset_allocation_webhook_id'
        );

        if (!webhookId) {
            return;
        }

        await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/api/webhooks/${webhookId}`,
            headers: {
                authorization: `Bearer ${context.auth.access_token}`
            }
        });

        await context.store.delete('asset_allocation_webhook_id');
        await context.store.delete('asset_allocation_webhook_secret');
    },

    async run(context) {
        const secret = await context.store.get<string>(
            'asset_allocation_webhook_secret'
        );

        const headers = context.payload.headers as Record<string, string>;
        const receivedSignature = headers['x-ziohelp-signature'];
        const timestamp = headers['x-ziohelp-timestamp'];

        if (!secret || !receivedSignature || !timestamp) {
            throw new Error(
                'Missing webhook secret, signature, or timestamp.'
            );
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(timestamp)
            .digest('hex');

        const receivedBuffer = Buffer.from(receivedSignature, 'utf8');
        const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

        if (
            receivedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
        ) {
            throw new Error('Invalid webhook signature.');
        }

        const body: any = context.payload.body;

        if (!body || typeof body !== 'object') {
            throw new Error('Invalid webhook payload.');
        }

        const transactionType = String(body.transactionType ?? '')
            .trim()
            .toLowerCase();

        const supportedTypes = [
            'allocation',
            'deallocation',
            'replacement'
        ];

        if (!supportedTypes.includes(transactionType)) {
            throw new Error(
                `Unsupported transaction type: ${body.transactionType}`
            );
        }

        body.attachment = null;
        body.attachmentName = null;

        // 1) Gate pass exists -> gate-pass PDF.
        if (body.gatePass?.gatePassNo) {
            try {
                const pdfBytes = await buildGatePassPdf(body.gatePass);
                const fileName = `Gatepass_${safeName(body.gatePass.gatePassNo)}.pdf`;

                const pdfFile = await context.files.write({
                    fileName,
                    data: Buffer.from(pdfBytes)
                });

                body.gatePass.pdfFileName = fileName;
                body.gatePass.pdfFile = pdfFile;
                body.attachment = pdfFile;
                body.attachmentName = fileName;
            } catch (error) {
                console.error('Failed to generate gate-pass PDF:', error);

                body.gatePass.pdfError =
                    error instanceof Error
                        ? error.message
                        : String(error);
            }
        }

        // 2) No gate pass (deallocation, replacement, allocation without
        //    gate pass) or PDF failed -> Excel with asset details.
        if (!body.attachment) {
            try {
                const excelBytes = await buildAssetExcel(body);

                const assetRef =
                    body.asset?.assetTagId ??
                    body.mail?.assetTagId ??
                    body.oldAsset?.assetTagId;

                const fileName =
                    `Asset_${safeName(body.transactionType)}_${safeName(assetRef)}.xlsx`;

                const excelFile = await context.files.write({
                    fileName,
                    data: excelBytes
                });

                body.attachment = excelFile;
                body.attachmentName = fileName;
            } catch (error) {
                console.error('Failed to generate asset Excel:', error);

                body.attachmentError =
                    error instanceof Error
                        ? error.message
                        : String(error);
            }
        }

        body.emailTemplate = body.emailTemplate ?? {
            templateName: `Asset ${body.transactionType}`,
            subject: `Asset ${body.transactionType}`,
            htmlBody: '',
            toRecipients: [],
            ccRecipients: []
        };

        body.emailTemplate.toRecipients =
            Array.isArray(body.emailTemplate.toRecipients)
                ? body.emailTemplate.toRecipients
                : [];

        body.emailTemplate.ccRecipients =
            Array.isArray(body.emailTemplate.ccRecipients)
                ? body.emailTemplate.ccRecipients
                : [];

        return [body];
    },

    async test() {
        return [sampleData];
    }
});