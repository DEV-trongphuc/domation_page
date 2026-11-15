import type { Plugin } from 'vite';
import { handleRagChatHttp } from './ragEngine';

export function ragChatApiPlugin(explicitApiKey?: string): Plugin {
  const attachMiddleware = (middlewares: {
    use: (
      route: string,
      handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void
    ) => void;
  }) => {
    middlewares.use('/api/chat', (req, res) => {
      void handleRagChatHttp(req, res, explicitApiKey);
    });
  };

  return {
    name: 'domation-rag-chat-api',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}
