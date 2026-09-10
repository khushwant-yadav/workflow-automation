import { Property } from '@activepieces/pieces-framework';
import { zioHelpAuth } from './auth';
import {
  ZioHelpAuthValue,
  fetchOrganizations,
  fetchProducts,
  fetchServiceCatalog,
  fetchMetadata,
  fetchCategories,
  fetchAssignableUsers,
  EnterpriseTicketingMetadata,
  fetchUserRoles
} from './fetchers';

// ==================== Organization Dropdown ====================

export const organizationNameDropdown = (required = true) =>
  Property.Dropdown({
    auth: zioHelpAuth,
    displayName: 'Organization Id',
    description: 'Select the organization',
    required,
    refreshers: ['auth'],
    options: async (propsValue) => {
      const auth = propsValue.auth as ZioHelpAuthValue | undefined;

      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your ZioHelp account first',
        };
      }

      try {
        const organizations = await fetchOrganizations(auth);

        return {
          disabled: false,
          options: organizations.map((org) => ({
            label: org.name,
            value: org.id.toString(),
          })),
          placeholder:
            organizations.length === 0 ? 'No organizations available' : 'Select an organization',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          disabled: true,
          options: [],
          placeholder: `Error loading organizations: ${errorMessage}`,
        };
      }
    },
  });

// ==================== Product Dropdown ====================

export const productNameDropdown = Property.Dropdown({
  auth: zioHelpAuth,
  displayName: 'Product Id',
  description: 'Select the product',
  required: true,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth as ZioHelpAuthValue | undefined;

    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your ZioHelp account first',
      };
    }

    try {
      const products = await fetchProducts(auth);

      return {
        disabled: false,
        options: products.map((product) => ({
          label: product.name,
          value: product.id.toString(),
        })),
        placeholder: products.length === 0 ? 'No products available' : 'Select a product',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading products: ${errorMessage}`,
      };
    }
  },
});

// ==================== Service Catalog Dropdown ====================

export const serviceCatalogDropdown = Property.Dropdown({
  auth: zioHelpAuth,
  displayName: 'Service Id',
  description: 'Select the type of request',
  required: true,
  refreshers: ['auth', 'organizationId', 'requestTypes', 'department'],
  options: async (propsValue) => {
    const auth = propsValue.auth as ZioHelpAuthValue | undefined;
    const organizationId = propsValue['organizationId'];
    const requestType = propsValue['requestTypes'];
    const department = propsValue['department'];

    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your ZioHelp account first',
      };
    }

    if (!organizationId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select an Organization first',
      };
    }

    try {
      const allServices = await fetchServiceCatalog(auth, organizationId as string);
      let services = allServices.filter((service) => service.active);

      if (requestType) {
        services = services.filter((service) => service.requestType === requestType);
      }

      if (department) {
        services = services.filter((service) => service.serviceDomain === department);
      }

      return {
        disabled: false,
        options: services.map((service) => ({
          label: service.name,
          value: JSON.stringify({
            id: service.id,
            supportTeamId: service.supportTeam?.id ?? null,
            workflowTemplateId: service.workflowTemplate?.id ?? null,
          }),
        })),
        placeholder: services.length === 0 ? 'No matching services found' : 'Select a service',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading services: ${errorMessage}`,
      };
    }
  },
});

// ==================== Metadata-Based Dropdowns (Severity, Impact, Urgency, Department, RequestType) ====================

function buildMetadataDropdown(
  displayName: string,
  description: string,
  metadataKey: keyof EnterpriseTicketingMetadata
) {
  return Property.Dropdown({
    auth: zioHelpAuth,
    displayName,
    description,
    required: true,
    refreshers: ['auth'],
    options: async (propsValue) => {
      const auth = propsValue.auth as ZioHelpAuthValue | undefined;

      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your ZioHelp account first',
        };
      }

      try {
        const metadata = await fetchMetadata(auth);
        const values = metadata[metadataKey] as string[];

        return {
          disabled: false,
          options: values.map((value) => ({
            label: value,
            value: value,
          })),
          placeholder: `Select ${displayName}`,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          disabled: true,
          options: [],
          placeholder: `Error loading ${displayName}: ${errorMessage}`,
        };
      }
    },
  });
}

export const severityDropdown = buildMetadataDropdown(
  'Severity',
  'Select the ticket severity',
  'severities'
);

export const impactDropdown = buildMetadataDropdown(
  'Impact',
  'Select the impact scope',
  'impacts'
);

export const urgencyDropdown = buildMetadataDropdown(
  'Urgency',
  'Select the urgency level',
  'urgencies'
);

export const departmentDropdown = buildMetadataDropdown(
  'Department',
  'Select the department',
  'serviceDomains'
);

export const requestTypesDropdown = buildMetadataDropdown(
  'Request Type',
  'Select the request type',
  'requestTypes'
);

export const channelDropdown = buildMetadataDropdown(
  'Channel',
  'Select the channel',
  'channels'
);


// ==================== Category Dropdown ====================

export const categoryNameDropdown = Property.Dropdown({
  auth: zioHelpAuth,
  displayName: 'Category Name',
  description: 'Select the category',
  required: true,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth as ZioHelpAuthValue | undefined;

    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your ZioHelp account first',
      };
    }

    try {
      const categories = await fetchCategories(auth);

      return {
        disabled: false,
        options: categories.map((category) => ({
          label: category.name,
          value: category.name,
        })),
        placeholder: categories.length === 0 ? 'No categories available' : 'Select a category',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading categories: ${errorMessage}`,
      };
    }
  },
});

// ==================== Assign To Dropdown ====================

export const assignToDropdown = Property.Dropdown({
  auth: zioHelpAuth,
  displayName: 'AssignTo Id',
  description: 'Select the support manager or engineer to assign this ticket to (optional)',
  required: false,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth as ZioHelpAuthValue | undefined;

    if (!auth) {
      return {
        disabled: true,
        options: [{ label: 'Unassigned', value: '' }],
        placeholder: 'Connect your ZioHelp account first',
      };
    }

    try {
      const eligibleUsers = await fetchAssignableUsers(auth);

      return {
        disabled: false,
        options: [
          { label: 'Unassigned', value: '' },
          ...eligibleUsers.map((user) => ({
            label: `${user.fullName} (${user.roles.join(', ')})`,
            value: user.id,
          })),
        ],
        placeholder: 'Select a person to assign (optional)',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [{ label: 'Unassigned', value: '' }],
        placeholder: `Error loading users: ${errorMessage}`,
      };
    }
  },
});


// ==================== User Roles Dropdown ====================

export const userRolesDropdown = Property.Dropdown({
  auth: zioHelpAuth,
  displayName: 'Role',
  description: 'Select the roles',
  required: false,
  refreshers: ['auth'],
  options: async (propsValue) => {
    const auth = propsValue.auth as ZioHelpAuthValue | undefined;

    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your ZioHelp account first',
      };
    }

    try {
      const roles = await fetchUserRoles(auth);

      return {
        disabled: false,
        options: roles.map((role) => ({
          label: role.name,
          value: role.name,
        })),
        placeholder: 'Select user roles',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading roles: ${errorMessage}`,
      };
    }
  },
});

