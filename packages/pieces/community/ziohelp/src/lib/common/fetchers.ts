import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export type ZioHelpAuthValue = {
  props: {
    baseUrl: string;
  };
  access_token?: string;
};

// ==================== Organizations ====================

export interface OrganizationResponse {
  id: number;
  name: string;
  domain: string;
  active: boolean;
  slaPolicy: string | null;
  slaPolicyId: number | null;
  productIds: number[];
  products: { id: number; name: string; domain: string; status: string; active: boolean }[];
  logoUrl: string | null;
}

export async function fetchOrganizations(auth: ZioHelpAuthValue): Promise<OrganizationResponse[]> {
  const response = await httpClient.sendRequest<OrganizationResponse[]>({
    url: `${auth.props.baseUrl}/api/organizations`,
    method: HttpMethod.GET,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
    },
  });
  return response.body;
}

// ==================== Products ====================

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  domain: string;
  status: string;
  isActive: boolean;
  version: string;
  category: string;
  logoUrl: string | null;
  themeColor: string | null;
  tickets: number;
  ticketCount: number;
  articles: number;
  articleCount: number;
  faqs: number;
  faqCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function fetchProducts(auth: ZioHelpAuthValue): Promise<ProductResponse[]> {
  const response = await httpClient.sendRequest<ProductResponse[]>({
    url: `${auth.props.baseUrl}/api/products`,
    method: HttpMethod.GET,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
    },
  });
  return response.body;
}

// ==================== Service Catalog ====================

export interface SupportTeam {
  id: number;
  name: string;
  description: string;
  department: string;
  assignmentMode: string;
  routingStrategy: string;
  externalTeam: boolean;
  active: boolean;
}

export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  requestType: string;
  serviceDomain: string | null;
  stages: string;
  initialStage: string;
  resolvedStage: string;
  closedStage: string;
  requiredFields: string;
  active: boolean;
}

export interface ServiceCatalogResponse {
  id: number;
  name: string;
  description: string;
  requestType: string;
  serviceDomain: string;
  serviceItemType: string;
  defaultPriority: string;
  defaultSeverity: string;
  requiredFields: string;
  sortOrder: number;
  active: boolean;
  organization: unknown | null;
  supportTeam: SupportTeam | null;
  workflowTemplate: WorkflowTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchServiceCatalog(
  auth: ZioHelpAuthValue,
  organizationId: string | number
): Promise<ServiceCatalogResponse[]> {
  const response = await httpClient.sendRequest<ServiceCatalogResponse[]>({
    url: `${auth.props.baseUrl}/api/enterprise-ticketing/service-catalog?organizationId=${organizationId}`,
    method: HttpMethod.GET,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
    },
  });
  return response.body;
}

// ==================== Metadata ====================

export interface EnterpriseTicketingMetadata {
  channels: string[];
  severities: string[];
  defaultStages: string[];
  assignmentModes: string[];
  impacts: string[];
  serviceDomains: string[];
  serviceItemTypes: string[];
  routingStrategies: string[];
  urgencies: string[];
  requestTypes: string[];
}

export async function fetchMetadata(auth: ZioHelpAuthValue): Promise<EnterpriseTicketingMetadata> {
  const response = await httpClient.sendRequest<EnterpriseTicketingMetadata>({
    url: `${auth.props.baseUrl}/api/enterprise-ticketing/metadata`,
    method: HttpMethod.GET,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
    },
  });
  return response.body;
}

// ==================== Ticket Categories ====================

export interface CategoryResponse {
  name: string;
}

export async function fetchCategories(auth: ZioHelpAuthValue): Promise<CategoryResponse[]> {
  const response = await httpClient.sendRequest<CategoryResponse[]>({
    url: `${auth.props.baseUrl}/api/ticket-categories/options`,
    method: HttpMethod.GET,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
    },
  });
  return response.body;
}

// ==================== Assignable Users ====================

export interface ZioHelpUser {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  roles: string[];
  isActive: boolean;
  organizationId: number;
  organizationName: string;
  jobTitle: string | null;
  department: string | null;
}

interface UsersPageResponse {
  content: ZioHelpUser[];
}

export async function fetchAssignableUsers(auth: ZioHelpAuthValue): Promise<ZioHelpUser[]> {
  const response = await httpClient.sendRequest<UsersPageResponse>({
    url: `${auth.props.baseUrl}/api/users/all?page=0&size=500`,
    method: HttpMethod.GET,
    headers: {
      authorization: `Bearer ${auth.access_token}`,
    },
  });

  const allowedRoles = ['SUPPORT_MANAGER', 'ENGINEER'];
  return response.body.content.filter((user) =>
    user.roles.some((role) => allowedRoles.includes(role))
  );
}

//====================== User Roles ======================

interface Role {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    system: boolean;
}

export async function fetchUserRoles(auth: ZioHelpAuthValue): Promise<Role[]> {
    const response = await httpClient.sendRequest<Role[]>({
        url: `${auth.props.baseUrl}/api/users/roles`,
        method: HttpMethod.GET,
        headers: {
            authorization: `Bearer ${auth.access_token}`,
        },
    });

    return response.body;
}