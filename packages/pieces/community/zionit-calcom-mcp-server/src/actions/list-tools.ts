
import { createAction } from '@activepieces/pieces-framework';
import { withMcpClient } from '../lib/mcp-client';

interface McpAuthValue {
  props: {
    serverUrl: string;
    bearerToken?: string;
  };
}

export const listTools = createAction({
  name: 'list_tools',
  displayName: 'List MCP Tools',
  description: 'Discover the tools exposed by an MCP server.',

  props: {},

  async run(context) {
    const auth = context.auth as unknown as McpAuthValue;
    const { serverUrl, bearerToken } = auth.props;

    if (!serverUrl?.trim()) {
      throw new Error('MCP server URL is required.');
    }

    return await withMcpClient(
      {
        serverUrl: serverUrl.trim(),
        bearerToken,
      },
      async (client) => {
        const result = await client.listTools({});

        return {
          count: result.tools.length,
          tools: result.tools.map((tool) => ({
            name: tool.name,
            description: tool.description ?? '',
            inputSchema: tool.inputSchema,
          })),
          nextCursor: result.nextCursor ?? null,
        };
      },
    );
  },
});
