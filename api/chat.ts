import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleRagChatHttp } from '../lib/ragEngine.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return handleRagChatHttp(req, res, process.env.GEMINI_API_KEY);
}
