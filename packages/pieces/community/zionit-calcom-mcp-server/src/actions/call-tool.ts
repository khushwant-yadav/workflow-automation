
import { createAction, Property } from '@activepieces/pieces-framework';
import { withMcpClient } from '../lib/mcp-client';

interface McpAuthValue {
  props: {
    serverUrl: string;
    bearerToken?: string;
  };
}
export const callTool = createAction({
  name: 'call_tool',
  displayName: 'Call MCP Tool',
  description: 'Invoke a tool exposed by an MCP server.',
  props: {
    toolName: Property.ShortText({
      displayName: 'Tool Name',
      description: 'Exact tool name returned by List MCP Tools.',
      required: true,
    }),
    argumentsJson: Property.LongText({
      displayName: 'Tool Arguments (JSON)',
      description: 'JSON object containing the arguments for the selected tool. Use {} if no arguments are required.',
      required: true,
      defaultValue: '{}',
    }),
  },

  async run(context) {
    const auth = context.auth as unknown as McpAuthValue;
    const toolName = context.propsValue.toolName.trim();

    if (!toolName) {
      throw new Error('Tool name is required.');
    }

    let args: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(
        context.propsValue.argumentsJson || '{}',
      );

      if (
        parsed === null ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        throw new Error('Arguments must be a JSON object.');
      }

      args = parsed as Record<string, unknown>;
    } catch (error) {
      throw new Error(
        `Invalid tool arguments JSON: ${
          error instanceof Error ? error.message : 'Invalid JSON'
        }`,
      );
    }

    return await withMcpClient(
      {
        serverUrl: auth.props.serverUrl,
        bearerToken: auth.props.bearerToken,
      },
      async (client) => {
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        });

        return {
          toolName,
          isError: result.isError ?? false,
          content: result.content,
          structuredContent: result.structuredContent ?? null,
        };
      },
    );
  },
});
