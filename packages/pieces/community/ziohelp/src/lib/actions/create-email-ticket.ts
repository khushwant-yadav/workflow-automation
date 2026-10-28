import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import FormData from 'form-data';

import { zioHelpAuth } from '../common/auth';
import { organizationNameDropdown,
         productNameDropdown,
         serviceCatalogDropdown,
         severityDropdown,
         impactDropdown,
         urgencyDropdown,
         departmentDropdown,
         channelDropdown,
         requestTypesDropdown,
         categoryNameDropdown,
         assignToDropdown
         } from '../common/props';

interface User {
  id: number;
  fullName: string;
  email?: string;
  emailId?: string;
  firstName?: string;
  lastName?: string;
}

interface TicketResponse {
  content: User[];
  totalElements?: number;
  page?: number;
  size?: number;
  totalPages?: number;
  last?: boolean;
}

export const createEmailTicket = createAction({
  auth: zioHelpAuth,

  name: 'createEmailTicket',

  displayName: 'Create Ticket (From Email Sender)',

  description:
    'Create a new ticket in ZioHelp, owned by the actual email sender — not the automation account.',

  props: {
    // ------------------------------------------------------------
    // NEW: sender identity fields — required for correct ownership
    // ------------------------------------------------------------
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'The actual sender of the email — this becomes the ticket owner',
      required: true,
    }),

    customerName: Property.ShortText({
      displayName: 'Customer Name (Optional)',
      description: 'Leave blank to auto-resolve from the customer email',
      required: false,
    }),

    phoneNumber: Property.ShortText({
      displayName: 'Phone Number (Optional)',
      required: false,
    }),

    messageId: Property.ShortText({
      displayName: 'Message-ID (Optional)',
      description: "The email's own Message-ID header — required for future reply detection",
      required: false,
    }),

    inReplyTo: Property.ShortText({
      displayName: 'In-Reply-To (Optional)',
      description: 'Raw In-Reply-To header value, if this email is itself part of a thread',
      required: false,
    }),

    // ------------------------------------------------------------
    // Existing fields
    // ------------------------------------------------------------
    organizationId: organizationNameDropdown(true),

    requestTypes: requestTypesDropdown,

    serviceDomain: departmentDropdown,

    serviceName: serviceCatalogDropdown,

    supportTeamId: Property.ShortText({
      displayName: 'SupportTeam Id(Optional)',
      description: 'SupportTeam Id needed to enter if flow data is selected in dynamic way, otherwise leave it blank',
      required: false,
    }),

    workflowTemplateId: Property.ShortText({
      displayName: 'WorkflowTemplate Id(Optional)',
      description: 'WorkflowTemplate Id needed to enter if flow data is selected in dynamic way, otherwise leave it blank',
      required: false,
    }),

    severity: severityDropdown,

    description: Property.LongText({
      displayName: 'Issue details',
      description: 'Brief description of the issue or request',
      required: true,
    }),

    productName: productNameDropdown,

    detailStep: Property.LongText({
      displayName: '',
      description: 'Detailed description of the issue, steps to reproduce, expected behavior, etc.',
      required: false,
    }),

    impactedService: Property.LongText({
      displayName: '',
      description: 'Impacted Service/Asset(e.g. VPN, Email, Printer) ',
      required: false,
    }),

    errorMessage: Property.LongText({
      displayName: '',
      description: 'Error Message/Code (e.g. 404, 500, Internal Server Error, etc.)',
      required: false,
    }),

    Workaround: Property.Checkbox({
      displayName: 'Workaround Available?',
      description: '(e.g. Restarting the application, clearing cache, etc.)',
      required: false,
      defaultValue: false,
    }),

    priority: Property.StaticDropdown({
      displayName: 'priority',
      description: 'Select your priority',
      required: true,
      options: {
        options: [
          { label: 'Low - General Enquiry', value: 'Low' },
          { label: 'Medium - Normal Issue', value: 'Medium' },
          { label: 'High - Business Impact', value: 'High' },
          { label: 'Urgent - Outage/Security/Data Loss', value: 'Urgent' },
        ],
      },
    }),

    category: categoryNameDropdown,

    impact: impactDropdown,

    urgency: urgencyDropdown,

    assignedTo: assignToDropdown,

    preferredTimeSlot: Property.StaticDropdown({
      displayName: 'Preferred Time Slot',
      description: 'Select your preferred time slot for support',
      required: false,
      options: {
        options: [
          { label: 'Anytime', value: 'ANYTIME' },
          { label: 'Morning', value: 'MORNING' },
          { label: 'Afternoon', value: 'AFTERNOON' },
          { label: 'Evening', value: 'EVENING' },
          { label: 'Second Shift', value: 'SECOND_SHIFT' },
        ],
      },
    }),

    preferredCommunicationMode: Property.StaticDropdown({
      displayName: 'Preferred Communication Mode',
      description: 'Select your preferred communication mode for support',
      required: false,
      options: {
        options: [
          { label: 'Email', value: 'EMAIL' },
          { label: 'Phone', value: 'PHONE' },
          { label: 'Chat', value: 'CHAT' },
          { label: 'Meeting', value: 'MEETING' },
        ],
      },
    }),

    aiAssistRequested: Property.Checkbox({
      displayName: 'AI Assist',
      description: 'Use AI to suggest routing and faster triage',
      required: false,
      defaultValue: false,
    }),

    initialComment: Property.LongText({
      displayName: 'Initial Comment',
      description: 'Add an initial comment for the support team (optional)',
      required: false,
    }),

    attachments: Property.File({
      displayName: 'Attachments(Optional)',
      description: 'Support for images, documents, and text files, up to 10MB in size',
      required: false,
    }),

    channel: channelDropdown,
  },

  async run(context) {
    const { auth, propsValue } = context;

    const serviceData = JSON.parse(propsValue.serviceName as string) as {
      id: number | null;
      supportTeamId: number | null;
      workflowTemplateId: number | null;
    };

    // 1. Build the ticket JSON payload
    const ticketPayload = {
      title: propsValue.description,
      description: propsValue.detailStep,
      priority: propsValue.priority,
      slaWarning: false,
      slaViolated: false,
      requestType: propsValue.requestTypes,
      channel: propsValue.channel,
      serviceDomain: propsValue.serviceDomain,
      severity: propsValue.severity,
      impact: propsValue.impact,
      urgency: propsValue.urgency,
      category: propsValue.category,
      serviceItemId: serviceData.id,
      supportTeamId: serviceData.supportTeamId || propsValue.supportTeamId,
      workflowTemplateId: serviceData.workflowTemplateId || propsValue.workflowTemplateId,
      preferredTimeSlot: propsValue.preferredTimeSlot,
      preferredCommunicationMode: propsValue.preferredCommunicationMode,
      aiAssistRequested: propsValue.aiAssistRequested,
      organizationId: propsValue.organizationId,
      productId: propsValue.productName,
      assignedToId: propsValue.assignedTo,

      // ------------------------------------------------------------
      // NEW: sender identity — this is what makes the backend set
      // ticket ownership to the actual email sender, not the API caller
      // ------------------------------------------------------------
      customerEmail: propsValue.customerEmail,
      customerName: propsValue.customerName,
      phoneNumber: propsValue.phoneNumber,
      messageId: propsValue.messageId,
      inReplyTo: propsValue.inReplyTo,

      initialComment: propsValue.initialComment,
    };

    // 2. Build multipart/form-data request
  const formData = new FormData();
  
  formData.append(
    'request',
    Buffer.from(JSON.stringify(ticketPayload)),
    {
      filename: 'request.json',
      contentType: 'application/json',
    }
  );
  
  if (propsValue.attachments) {
    const file = propsValue.attachments;
    const fileBuffer = Buffer.from(file.base64, 'base64');
  
    formData.append('attachment', fileBuffer, {
      filename: file.filename,
    });
  }

    // 3. Call the SENDER-AWARE endpoint — NOT /api/tickets/intake
    const ticketsResponse =
      await httpClient.sendRequest<TicketResponse>({
        method: HttpMethod.POST,

        url: `${auth.props.baseUrl}/api/tickets/email-intake`,

        body: formData,

        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          ...formData.getHeaders(),
        },
      });

    return ticketsResponse.body;
  },
});