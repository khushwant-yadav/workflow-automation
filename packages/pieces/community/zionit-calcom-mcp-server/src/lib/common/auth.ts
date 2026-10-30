
import { PieceAuth } from '@activepieces/pieces-framework';

export const mcpServerAuth = PieceAuth.CustomAuth({
  displayName: 'MCP Server Connection',
  description: 'Connect to an MCP-compatible server.',
  props: {
    serverUrl: PieceAuth.SecretText({
      displayName: 'MCP Server URL',
      description: 'The HTTP URL of the MCP server.',
      required: true,
    }),
    bearerToken: PieceAuth.SecretText({
      displayName: 'Bearer Token',
      description: 'Optional authentication token for the MCP server.',
      required: false,
    }),
  },
  required: true,
});
