import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAutodataBridgeHttp } from '../lib/autodataBridge.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return handleAutodataBridgeHttp(req, res, process.env.AUTODATA_API_URL);
}
