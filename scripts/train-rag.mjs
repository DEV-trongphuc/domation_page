import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { DOMATION_CORPUS } from './domationCorpus.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function unsealApiKey(sealedPayload, cipherSecret) {
  const prefix = 'enc:v1:';
  const [ivB64, tagB64, dataB64] = sealedPayload.slice(prefix.length).split(':');
  const key = crypto.createHash('sha256').update(`turnio-rag-v1:${cipherSecret}`, 'utf8').digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8').trim();
}

function loadEnvKey() {
  const envMap = {};
  for (const file of ['.env', '.env.local']) {
    const p = path.join(ROOT_DIR, file);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) envMap[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  const encKey = process.env.GEMINI_API_KEY_ENC || envMap.GEMINI_API_KEY_ENC;
  const cipherSecret = process.env.GEMINI_CIPHER_SECRET || envMap.GEMINI_CIPHER_SECRET;
  if (encKey && cipherSecret) return unsealApiKey(encKey, cipherSecret);
  const plain = process.env.GEMINI_API_KEY || envMap.GEMINI_API_KEY;
  if (plain) return plain.startsWith('enc:v1:') && cipherSecret ? unsealApiKey(plain, cipherSecret) : plain;
  throw new Error('GEMINI_API_KEY / GEMINI_API_KEY_ENC not found in environment or .env.local');
}

function normalizeL2(vec) {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => Math.round((v / norm) * 1e5) / 1e5);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function embedWithRetry(ai, doc, attempt = 1) {
  const fullText = `${doc.title}\nChuyên mục: ${doc.category}\n${doc.content}`;
  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: fullText,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        title: doc.title,
        outputDimensionality: 768,
      },
    });
    const raw = res.embeddings?.[0]?.values;
    if (!raw || raw.length !== 768) {
      throw new Error(`Unexpected embedding vector length (${raw?.length}) for ${doc.id}`);
    }
    if (raw.some((v) => Number.isNaN(v) || !Number.isFinite(v))) {
      throw new Error(`NaN/Inf detected in vector for ${doc.id}`);
    }
    return normalizeL2(raw);
  } catch (err) {
    if (attempt < 4) {
      const delayMs = 600 * attempt;
      await new Promise((r) => setTimeout(r, delayMs));
      return embedWithRetry(ai, doc, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  const apiKey = loadEnvKey();
  const ai = new GoogleGenAI({ apiKey });

  console.log(`[DOMATION-RAG-TRAIN] Training vector index with gemini-embedding-001 (768-dim)...`);
  console.log(`[DOMATION-RAG-TRAIN] Total chunks: ${DOMATION_CORPUS.length}`);

  const chunks = [];
  for (let i = 0; i < DOMATION_CORPUS.length; i++) {
    const doc = DOMATION_CORPUS[i];
    const vector = await embedWithRetry(ai, doc);
    chunks.push({
      id: doc.id,
      category: doc.category,
      title: doc.title,
      sectionId: doc.sectionId || null,
      url: doc.url || null,
      urlLabel: doc.urlLabel || null,
      image: doc.image || null,
      content: doc.content,
      vector,
    });
    process.stdout.write(`  [${String(i + 1).padStart(2, '0')}/${DOMATION_CORPUS.length}] Embedded: ${doc.id}\n`);
  }

  const outPath = path.join(ROOT_DIR, 'src', 'data', 'ragIndex.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const payload = {
    version: '1.0.0',
    embeddingModel: 'gemini-embedding-001',
    chatModel: 'gemini-3.5-flash-lite',
    dimensions: 768,
    trainedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    chunks,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload), 'utf8');
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`\n[DOMATION-RAG-TRAIN] Saved ${outPath} (${sizeKb} KB, ${chunks.length} chunks).`);

  const sampleQueries = [
    'Huỳnh Trọng Phúc (TurnioDEV) là ai? Có kinh nghiệm xây dựng hệ thống A-Z, AI Automation và Digital Marketing như thế nào?',
    'Bên mình có những gói giá phần mềm SaaS và thiết kế Website nào?',
    'Hệ thống Auto Chia Data Meta CAPI hoạt động mất bao lâu?',
    'DOMATION triển khai dự án EcoLife Signature Capital House gồm những hạng mục gì?',
    'Muốn xem Portfolio TurnioDEV hoặc liên hệ trực tiếp CEO Huỳnh Trọng Phúc ở đâu?',
  ];
  console.log('\n[DOMATION-RAG-TRAIN] Running live vector cosine similarity checks:');
  for (const q of sampleQueries) {
    const qRes = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: q,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      },
    });
    const qVec = normalizeL2(qRes.embeddings[0].values);
    const ranked = chunks
      .map((c) => ({ id: c.id, score: dot(qVec, c.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    console.log(`  Q: "${q}"`);
    console.log(`     -> Top-3: ${ranked.map((r) => `${r.id} (${r.score.toFixed(4)})`).join(', ')}`);
  }
}

main().catch((err) => {
  console.error('[DOMATION-RAG-TRAIN] FAILED:', err);
  process.exit(1);
});
