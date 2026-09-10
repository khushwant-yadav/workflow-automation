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

interface EscalatedTicket {
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
  product: ProductSummary | null;
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
  serviceItem: ServiceItemSummary | null;
  supportTeam: SupportTeamSummary | null;
  workflowTemplate: WorkflowTemplateSummary | null;
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
  preferredTimeSlot: string | null;
  preferredCommunicationMode: string;
  aiAssistRequested: boolean | null;
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

interface EscalatedTicketsSummary {
  openTickets: number;
  highPriorityTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  escalatedTickets: number;
  resolvedTickets: number;
}

interface EscalatedTicketsResponse {
  summary: EscalatedTicketsSummary;
  tickets: EscalatedTicket[];
  pageNumber: number;
  last: boolean;
  count: number;
  totalPages: number;
  pageSize: number;
  content: EscalatedTicket[];
  totalElements: number;
}

export const getEscalatedTickets = createAction({
  auth: zioHelpAuth,

  name: 'getEscalatedTickets',

  displayName: 'Get Escalated Tickets',

  description:
    'Fetch the list of escalated tickets assigned to the engineer, with pagination',

  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to fetch. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),

    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of tickets per page. Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const page = propsValue.page ?? 1;
    const pageSize = propsValue.pageSize ?? 100;

    // 1. Call ZioHelp escalated tickets API
    const escalatedTicketsResponse =
      await httpClient.sendRequest<EscalatedTicketsResponse>({
        method: HttpMethod.GET,

        url: `${auth.props.baseUrl}/api/engineer/tickets`,

        queryParams: {
          view: 'escalated',
          page: String(page),
          pageSize: String(pageSize),
        },

        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });

    return escalatedTicketsResponse.body;
  },
});