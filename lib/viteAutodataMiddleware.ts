import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAutodataBridgeHttp } from './autodataBridge';

export function autodataBridgePlugin(explicitApiUrl?: string): Plugin {
  const attachMiddleware = (middlewares: {
    use: (route: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void;
  }) => {
    middlewares.use('/api/autodata', (req, res) => {
      void handleAutodataBridgeHttp(req, res, explicitApiUrl);
    });
  };

  return {
    name: 'domation-autodata-bridge-api',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}
