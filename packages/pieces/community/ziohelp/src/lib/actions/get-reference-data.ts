import { createAction } from '@activepieces/pieces-framework';
import { zioHelpAuth } from '../common/auth';
import {
  ZioHelpAuthValue,
  fetchOrganizations,
  fetchProducts,
  fetchMetadata,
  fetchCategories,
  fetchAssignableUsers,
} from '../common/fetchers';

export const getReferenceData = createAction({
  auth: zioHelpAuth,
  name: 'get_reference_data',
  displayName: 'Get Reference Data',
  description:
    'Fetches all dropdown reference data (organizations, products, categories, metadata, assignable users) with their IDs — useful for dynamic/automated ticket creation without manual dropdown selection',
  props: {},
  async run(context) {
    const auth = context.auth as ZioHelpAuthValue;

    const [organizations, products, metadata, categories, assignableUsers] = await Promise.all([
      fetchOrganizations(auth),
      fetchProducts(auth),
      fetchMetadata(auth),
      fetchCategories(auth),
      fetchAssignableUsers(auth),
    ]);

    return {
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        domain: org.domain,
        active: org.active,
      })),
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        status: product.status,
        active: product.isActive,
      })),
      categories: categories.map((category) => ({
        name: category.name,
      })),
      severities: metadata.severities,
      impacts: metadata.impacts,
      urgencies: metadata.urgencies,
      requestTypes: metadata.requestTypes,
      serviceDomains: metadata.serviceDomains,
      channels: metadata.channels,
      assignableUsers: assignableUsers.map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        roles: user.roles,
      })),
    };
  },
});