import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioHelpAuth } from '../common/auth';
import * as crypto from 'crypto';

const sampleData = {
    ticket: {
        id: 501,
        ticketNumber: "TKT-000501",
        title: "Sample support ticket",
        description: "This is a sample ticket description for testing purposes.",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        category: "Technical Issue",
        subcategory: null,
        assetId: null,
        createdBy: {
            id: 1,
            username: "sampleuser",
            fullName: "Sample User",
            email: "sample.user@example.com",
            role: "USER",
            avatar: null,
        },
        assignedTo: {
            id: 2,
            username: "sampleengineer",
            fullName: "Sample Engineer",
            email: "sample.engineer@example.com",
            role: "ENGINEER",
            avatar: null,
        },
        escalatedTo: null,
        product: {
            id: 1,
            name: "Sample Product",
            version: "1.0.0",
            description: "Sample product description",
        },
        organization: {
            id: 1,
            name: "Sample Organization",
            domain: "example.com",
            logo: null,
        },
        createdDate: "2026-09-04T11:26:05",
        updatedDate: "2026-09-09T09:01:04",
        assignedDate: null,
        firstResponseDate: null,
        resolvedDate: null,
        closedDate: null,
        escalatedDate: null,
        slaDeadline: null,
        slaViolated: false,
        slaWarning: false,
        resolutionTime: null,
        firstResponseTime: null,
        environment: null,
        severity: "MEDIUM",
        source: "API",
        requestType: "SERVICE_REQUEST",
        channel: "API",
        serviceDomain: "GENERAL",
        impact: "DEPARTMENT",
        urgency: "NORMAL",
        sourceReference: null,
        currentStage: "In Progress",
        assignmentMode: "MANAGER_ALLOCATED",
        serviceItem: {
            id: 1,
            name: "Sample Service Item",
            type: "INDIVIDUAL",
        },
        supportTeam: {
            id: 1,
            name: "Sample Support Team",
            type: "GENERAL",
        },
        workflowTemplate: {
            id: 1,
            name: "Sample Workflow",
            type: "SERVICE_REQUEST",
        },
        aiResolutionStatus: "NOT_ATTEMPTED",
        aiConfidenceScore: null,
        aiSuggestedResolution: null,
        externalVendorName: null,
        changeWindowStart: null,
        changeWindowEnd: null,
        downtimeMinutes: null,
        impactAnalysis: null,
        resolution: null,
        tags: null,
        customFields: null,
        estimatedHours: null,
        actualHours: null,
        commentCount: null,
        attachmentCount: null,
        customerEmail: "sample.user@example.com",
        customerName: "Sample User",
        phoneNumber: null,
        preferredTimeSlot: "MORNING",
        preferredCommunicationMode: "EMAIL",
        aiAssistRequested: false,
        requestedPriority: "MEDIUM",
        priorityReason: null,
        reassignmentShift: null,
        reassignmentReason: null,
        satisfactionRating: null,
        customerFeedback: null,
        satisfactionSubmittedDate: null,
        internalNotes: null,
        isEscalated: null,
        escalationReason: null,
        isGuest: false,
        recentComments: [
            {
                id: 1,
                content: "Sample comment on this ticket.",
                authorName: null,
                authorRole: null,
                isInternal: null,
                createdDate: "2026-09-04T11:26:05",
            },
        ],
        attachments: [],
        activityLog: null,
    },
    newStatus: "IN_PROGRESS",
    changedBy: "sample.user@example.com",
    previousStatus: "OPEN",
};

export const statusUpdate = createTrigger({
    auth: zioHelpAuth,
    name: 'statusUpdate',
    displayName: 'Get Status Update',
    description: 'Triggers when a ticket status is updated',
    aiMetadata: {
        description: 'Triggers when a ticket status is updated in ZioHelp',
    },
    props: {},
    sampleData: {
        ...sampleData
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const baseUrl = context.auth.props.baseUrl;

        const response = await httpClient.sendRequest<{ id: number; secret: string }>({
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

        await context.store.put('status_update_webhook_id', response.body.id);
        await context.store.put('status_update_webhook_secret', response.body.secret);
    },

    async onDisable(context) {
        const baseUrl = context.auth.props.baseUrl;
        const webhookId = await context.store.get('status_update_webhook_id');
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
        const secret = await context.store.get<string>('status_update_webhook_secret');
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