import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';
import { resolveServerApiKey, scrubSecrets } from './keyCipher.js';

export interface RagChunk {
  id: string;
  category: string;
  title: string;
  sectionId: string | null;
  url: string | null;
  urlLabel: string | null;
  image: string | null;
  content: string;
  vector: number[];
}

export interface RagIndexFile {
  version: string;
  embeddingModel: string;
  chatModel: string;
  dimensions: number;
  trainedAt: string;
  chunkCount: number;
  chunks: RagChunk[];
}

export interface ChatTurnMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RetrievedSource {
  id: string;
  category: string;
  title: string;
  score: number;
  sectionId: string | null;
  url: string | null;
  urlLabel: string | null;
  image: string | null;
}

const MODEL_CHAT = 'gemini-3.5-flash-lite';
const MODEL_EMBED = 'gemini-embedding-001';
const TOP_K = 7;
const SOURCE_SCORE_THRESHOLD = 0.58;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQ = 30;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: IncomingMessage): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX_REQ) return false;
  bucket.count += 1;
  return true;
}

function isAllowedOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('domation.net') ||
      host.endsWith('turnio.dev')
    );
  } catch {
    return false;
  }
}

const SYSTEM_INSTRUCTION = [
  'Bạn là **DOMATION AI** — Trợ lý AI Tư vấn Dịch vụ & Giải pháp Doanh nghiệp chính thức của **DOMATION.NET** (Hệ sinh thái Enterprise Technology do Huỳnh Trọng Phúc — CEO Founder sáng lập).',
  '',
  'NGUYÊN TẮC BẮT BUỘC:',
  '1. Trả lời HOÀN TOÀN dựa trên ngữ cảnh tri thức [KIẾN THỨC ĐƯỢC TRUY XUẤT] bên dưới. Tư vấn chính xác, thực tế, dẫn đúng số liệu, tên phân hệ, bảng giá SaaS/Web và đường dẫn chuyên trang tương ứng (không tự ý nhắc tên model AI bên thứ ba).',
  '2. TRẢ LỜI CỰC KỲ NGẮN GỌN, ĐÚNG TRỌNG TÂM:',
  '   - Đi thẳng vào giải pháp/báo giá ngay dòng đầu tiên (KHÔNG chào hỏi dài dòng, KHÔNG lặp lại câu hỏi).',
  '   - Mặc định giới hạn tối đa **3–4 gạch đầu dòng súc tích (~70–120 từ)**, mỗi ý gắn với lợi ích, thông số (ví dụ `tức thì`, `Meta CAPI`, `12 phân hệ ERP`, `2.990.000₫/tháng`, `Web từ 12.0M₫`). Chỉ phân tích sâu khi khách hàng yêu cầu chi tiết.',
  '3. KHÔNG BAO GIỜ bịa đặt giá, tính năng hay cam kết ngoài tài liệu. Nếu thiếu thông tin hoặc cần báo giá may đo tập đoàn, trả lời ngắn 1 câu và mời kết nối **Zalo 0378.859.736** ([Nhắn Zalo trực tiếp](https://zalo.me/0378859736)) hoặc email `hello@domation.net`.',
  '4. Dùng Markdown gọn gàng (**in đậm** con số/gói dịch vụ, gắn link chuyên trang như `/data`, `/erp`, `/crm`, `/automation`, `/meta-report`, `/web-design` khi phù hợp). Tự động trả lời đúng ngôn ngữ khách hỏi (mặc định Tiếng Việt).',
].join('\n');

let cachedIndex: RagIndexFile | null = null;

function loadRagIndex(): RagIndexFile {
  if (cachedIndex) return cachedIndex;

  const candidatePaths = [
    path.resolve(process.cwd(), 'src', 'data', 'ragIndex.json'),
    path.resolve(process.cwd(), 'data', 'ragIndex.json'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      cachedIndex = JSON.parse(raw) as RagIndexFile;
      return cachedIndex;
    }
  }

  throw new Error(`RAG index file not found. Looked in: ${candidatePaths.join(', ')}`);
}

function normalizeL2(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const preParsed = (req as IncomingMessage & { body?: unknown }).body;
  if (preParsed && typeof preParsed === 'object' && !Buffer.isBuffer(preParsed)) {
    return preParsed as Record<string, unknown>;
  }
  if (typeof preParsed === 'string' && preParsed.trim()) {
    return JSON.parse(preParsed) as Record<string, unknown>;
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    totalBytes += buf.length;
    if (totalBytes > 128 * 1024) {
      throw new Error('Request payload exceeds 128KB limit');
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function writeSseEvent(res: ServerResponse, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sendJsonError(res: ServerResponse, status: number, error: string) {
  if (!res.headersSent) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  res.end(JSON.stringify({ error }));
}

export async function handleRagChatHttp(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey?: string
): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (!isAllowedOrigin(req)) {
    sendJsonError(res, 403, 'Origin not permitted by API proxy policy.');
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJsonError(res, 405, 'Method not allowed. Use POST.');
    return;
  }

  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    sendJsonError(res, 429, 'Bạn gửi quá nhiều yêu cầu liên tiếp. Vui lòng thử lại sau ít giây.');
    return;
  }

  let resolvedKey = '';
  try {
    resolvedKey = resolveServerApiKey(apiKey);
  } catch (err) {
    console.error('[DOMATION-RAG] Secret unwrap error:', scrubSecrets(String(err)));
    sendJsonError(res, 500, 'Lỗi giải mã cấu hình API bảo mật trên server.');
    return;
  }

  if (!resolvedKey) {
    sendJsonError(res, 500, 'Server chưa cấu hình khóa bảo mật DOMATION AI.');
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    sendJsonError(res, 400, err instanceof Error ? err.message : 'Invalid JSON body');
    return;
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatTurnMessage[] = rawMessages
    .filter(
      (m): m is ChatTurnMessage =>
        Boolean(m) &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-10)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 2000),
    }));

  const currentTurn = messages[messages.length - 1];
  if (!currentTurn || currentTurn.role !== 'user') {
    sendJsonError(res, 400, 'Tin nhắn cuối cùng phải từ người dùng.');
    return;
  }

  try {
    const ragIndex = loadRagIndex();
    const ai = new GoogleGenAI({ apiKey: resolvedKey });

    const previousUserTurns = messages.slice(0, -1).filter((m) => m.role === 'user');
    const lastUserTurn = previousUserTurns[previousUserTurns.length - 1];
    const queryForEmbedding = lastUserTurn
      ? `${lastUserTurn.content}\n${currentTurn.content}`
      : currentTurn.content;

    const embedRes = await ai.models.embedContent({
      model: MODEL_EMBED,
      contents: queryForEmbedding,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: ragIndex.dimensions || 768,
      },
    });

    const queryValues = embedRes.embeddings?.[0]?.values;
    if (!queryValues || queryValues.length === 0) {
      throw new Error('Không thể tạo vector embedding cho câu hỏi.');
    }
    const queryVector = normalizeL2(queryValues);

    const ranked = ragIndex.chunks
      .map((chunk) => ({
        chunk,
        score: dotProduct(queryVector, chunk.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const seenSourceKeys = new Set<string>();
    const sources: RetrievedSource[] = [];
    for (const item of ranked) {
      if (item.score < SOURCE_SCORE_THRESHOLD) continue;
      if (!item.chunk.image && !item.chunk.url && !item.chunk.sectionId) continue;
      const dedupeKey = `${item.chunk.title}|${item.chunk.url || ''}|${item.chunk.image || ''}`;
      if (seenSourceKeys.has(dedupeKey)) continue;
      seenSourceKeys.add(dedupeKey);
      sources.push({
        id: item.chunk.id,
        category: item.chunk.category,
        title: item.chunk.title,
        score: Number(item.score.toFixed(4)),
        sectionId: item.chunk.sectionId,
        url: item.chunk.url,
        urlLabel: item.chunk.urlLabel,
        image: item.chunk.image,
      });
      if (sources.length >= 3) break;
    }

    const contextBlock = ranked
      .map(
        ({ chunk, score }, idx) =>
          `### [${idx + 1}] ${chunk.title} (${chunk.category} • Điểm tương đồng: ${score.toFixed(3)})${
            chunk.url ? `\nĐường dẫn: ${chunk.url}` : ''
          }\n${chunk.content}`
      )
      .join('\n\n');

    const historyText =
      messages.length > 1
        ? messages
            .slice(0, -1)
            .slice(-6)
            .map((m) => `${m.role === 'user' ? 'Khách hàng' : 'DOMATION AI'}: ${m.content}`)
            .join('\n\n')
        : 'Chưa có lượt hội thoại trước.';

    const compositeInput = `[KIẾN THỨC ĐƯỢC TRUY XUẤT TỪ HỒ SƠ DỊCH VỤ DOMATION.NET]
${contextBlock}

[LỊCH SỬ HỘI THOẠI GẦN ĐÂY]
${historyText}

[CÂU HỎI HIỆN TẠI CỦA KHÁCH HÀNG]
${currentTurn.content}

[YÊU CẦU TRẢ LỜI]
Trả lời ngắn gọn, đúng trọng tâm tư vấn dịch vụ/giải pháp/báo giá (mặc định 3–4 gạch đầu dòng súc tích ~70–120 từ; nêu đúng con số & trang giải pháp liên quan; nếu khách hỏi sâu mới phân tích chi tiết).`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    writeSseEvent(res, 'sources', {
      sources,
      topScore: ranked[0] ? Number(ranked[0].score.toFixed(4)) : 0,
    });

    const stream = await ai.interactions.create({
      model: MODEL_CHAT,
      system_instruction: SYSTEM_INSTRUCTION,
      input: compositeInput,
      stream: true,
    });

    for await (const event of stream) {
      if (res.writableEnded || res.destroyed) break;
      if (
        event.event_type === 'step.delta' &&
        event.delta?.type === 'text' &&
        typeof event.delta.text === 'string'
      ) {
        writeSseEvent(res, 'delta', { text: event.delta.text });
      }
    }

    if (!res.writableEnded && !res.destroyed) {
      writeSseEvent(res, 'done', { ok: true });
      res.end();
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ DOMATION AI.';
    const safeMsg = scrubSecrets(rawMsg);
    console.error('[DOMATION-RAG] Error:', safeMsg);
    if (!res.headersSent) {
      sendJsonError(res, 500, safeMsg);
    } else if (!res.writableEnded && !res.destroyed) {
      writeSseEvent(res, 'error', { error: safeMsg });
      res.end();
    }
  }
}
