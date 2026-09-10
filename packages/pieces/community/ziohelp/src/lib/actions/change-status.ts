import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { zioHelpAuth } from '../common/auth';

interface UserSummary {
  id: number;
  username: string | null;
  fullName: string;
  email: string;
  role: string;
  avatar: string | null;
}

interface ProductSummary {
  id: number;
  name: string;
  version: string;
  description: string;
}

interface OrganizationSummary {
  id: number;
  name: string;
  domain: string;
  logo: string | null;
}

interface ServiceItemSummary {
  id: number;
  name: string;
  type: string;
}

interface SupportTeamSummary {
  id: number;
  name: string;
  type: string;
}

interface WorkflowTemplateSummary {
  id: number;
  name: string;
  type: string;
}

interface TicketComment {
  id: number;
  content: string;
  authorName: string | null;
  authorRole: string | null;
  isInternal: boolean | null;
  createdDate: string;
}

interface TicketAttachment {
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
  uploadedDate: string;
  uploadedBy: string;
}

interface StatusResponse {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  subcategory: string | null;
  assetId: number | null;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  escalatedTo: UserSummary | null;
  product: ProductSummary;
  organization: OrganizationSummary;
  createdDate: string;
  updatedDate: string;
  assignedDate: string | null;
  firstResponseDate: string | null;
  resolvedDate: string | null;
  closedDate: string | null;
  escalatedDate: string | null;
  slaDeadline: string | null;
  slaViolated: boolean;
  slaWarning: boolean;
  resolutionTime: number | null;
  firstResponseTime: number | null;
  environment: string | null;
  severity: string;
  source: string;
  requestType: string;
  channel: string;
  serviceDomain: string;
  impact: string;
  urgency: string;
  sourceReference: string | null;
  currentStage: string;
  assignmentMode: string;
  serviceItem: ServiceItemSummary;
  supportTeam: SupportTeamSummary;
  workflowTemplate: WorkflowTemplateSummary;
  aiResolutionStatus: string;
  aiConfidenceScore: number | null;
  aiSuggestedResolution: string | null;
  externalVendorName: string | null;
  changeWindowStart: string | null;
  changeWindowEnd: string | null;
  downtimeMinutes: number | null;
  impactAnalysis: string | null;
  resolution: string | null;
  tags: string[] | null;
  customFields: Record<string, unknown> | null;
  estimatedHours: number | null;
  actualHours: number | null;
  commentCount: number | null;
  attachmentCount: number | null;
  customerEmail: string;
  customerName: string;
  phoneNumber: string | null;
  preferredTimeSlot: string;
  preferredCommunicationMode: string;
  aiAssistRequested: boolean;
  requestedPriority: string;
  priorityReason: string | null;
  reassignmentShift: string | null;
  reassignmentReason: string | null;
  satisfactionRating: number | null;
  customerFeedback: string | null;
  satisfactionSubmittedDate: string | null;
  internalNotes: string | null;
  isEscalated: boolean | null;
  escalationReason: string | null;
  isGuest: boolean;
  recentComments: TicketComment[];
  attachments: TicketAttachment[];
  activityLog: unknown | null;
}

export const changeStatus = createAction({
  auth: zioHelpAuth,

  name: 'changeStatus',

  displayName: 'Change Status',

  description:
    'Change the status of a ticket',

  props: {
    ticketId: Property.ShortText({
      displayName: 'Ticket ID',
      description:
        'Select the ticket ID',
      required: true,
    }),

    statusOption: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Select Status',
    required: true,
    options: {
      options: [
        {
          label: 'Open',
  
          value: 'OPEN',
        },
        {
          label: 'Assigned',
          value: 'ASSIGNED',
        },
        {
          label: 'In Progress',
          value: 'IN_PROGRESS',
        },
        {
          label: 'Resolved',
          value: 'RESOLVED',
        },
        {
          label: 'Closed',
          value: 'CLOSED',
        },
        {
          label: 'Reopened',
          value: 'REOPENED',
        },

      ],
    },
  }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    // 1. Call  ZioHelp users API
    const ticketResponse =
      await httpClient.sendRequest<StatusResponse>({
        method: HttpMethod.PUT,

        url: `${auth.props.baseUrl}/api/tickets/${propsValue.ticketId}/status`,

        body: {
          status: propsValue.statusOption,
        },

        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });
    
    return ticketResponse.body;
  },
});