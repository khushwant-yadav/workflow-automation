import { createAction, Property } from '@activepieces/pieces-framework';
import { zioHelpAuth } from '../common/auth';
import { ZioHelpAuthValue, fetchServiceCatalog } from '../common/fetchers';
import { organizationNameDropdown } from '../common/props';

export const getServiceCatalogData = createAction({
  auth: zioHelpAuth,
  name: 'get_service_catalog_data',
  displayName: 'Get Service Catalog Data',
  description:
    'Fetches service catalog items (with IDs) for a specific organization. Optionally filter by request type or department — leave them empty to get all services.',
  props: {

    organizationId: organizationNameDropdown(true),
    
    requestType: Property.ShortText({
      displayName: 'Request Type (optional)',
      description: 'Filter by request type, e.g. INCIDENT, SERVICE_REQUEST. Leave empty for all.',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department (optional)',
      description: 'Filter by department/service domain, e.g. IT, HR. Leave empty for all.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as ZioHelpAuthValue;
    const { organizationId, requestType, department } = context.propsValue;

    if (!organizationId) {
      throw new Error('Organization ID is required.');
    }

    const allServices = await fetchServiceCatalog(auth, organizationId);
    let services = allServices.filter((service) => service.active);

    // if requestType is available, filter by requestType, otherwise keep all
    if (requestType) {
      services = services.filter((service) => service.requestType === requestType);
    }

    // if department is available, filter by department, otherwise keep all
    if (department) {
      services = services.filter((service) => service.serviceDomain === department);
    }

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      requestType: service.requestType,
      serviceDomain: service.serviceDomain,
      supportTeamId: service.supportTeam?.id ?? null,
      supportTeamName: service.supportTeam?.name ?? null,
      workflowTemplateId: service.workflowTemplate?.id ?? null,
      workflowTemplateName: service.workflowTemplate?.name ?? null,
    }));
  },
});