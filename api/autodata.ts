import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAutodataBridgeHttp } from '../lib/autodataBridge.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const upstreamUrl =
    (process.env.AUTODATA_API_URL || '').trim() ||
    (process.env.VERCEL ? 'https://data.domation.net' : '');
  return handleAutodataBridgeHttp(req, res, upstreamUrl);
}
