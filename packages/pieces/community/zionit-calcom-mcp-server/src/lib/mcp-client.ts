
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface McpConnectionConfig {
  serverUrl: string;
  bearerToken?: string;
}

export async function withMcpClient<T>(
  config: McpConnectionConfig,
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const url = new URL(config.serverUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('MCP server URL must use HTTP or HTTPS.');
  }

  const headers: Record<string, string> = {};

  if (config.bearerToken?.trim()) {
    headers['Authorization'] = `Bearer ${config.bearerToken.trim()}`;
  }

  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers },
  });

  const client = new Client({
    name: 'activepieces-mcp-client',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);
    return await operation(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}
