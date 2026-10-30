import { createPiece } from '@activepieces/pieces-framework';
import { mcpServerAuth } from './lib/common/auth';
import { listTools } from './actions/list-tools';
import { callTool } from './actions/call-tool';

export const zionitCalcomMcp = createPiece({
  displayName: 'Cal.com MCP Client',
  description: 'Discover and invoke Cal.com tools through MCP.',
  auth: mcpServerAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal-com.png',
  authors: [],
  actions: [listTools, callTool],
  triggers: [],
});