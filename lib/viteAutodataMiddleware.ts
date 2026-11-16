import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAutodataBridgeHttp } from './autodataBridge';

export function autodataBridgePlugin(explicitApiUrl?: string): Plugin {
  const resolvedApiUrl = explicitApiUrl || process.env.AUTODATA_API_URL || 'http://127.0.0.1:3100';

  const attachMiddleware = (middlewares: {
    use: (route: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void;
  }) => {
    middlewares.use('/api/autodata', (req, res) => {
      void handleAutodataBridgeHttp(req, res, resolvedApiUrl);
    });
    middlewares.use('/api/v1', (req, res) => {
      const fullUrl = `/api/v1${req.url || ''}`;
      req.url = fullUrl;
      void handleAutodataBridgeHttp(req, res, resolvedApiUrl);
    });
    middlewares.use('/v1', (req, res) => {
      const fullUrl = `/v1${req.url || ''}`;
      req.url = fullUrl;
      void handleAutodataBridgeHttp(req, res, resolvedApiUrl);
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
