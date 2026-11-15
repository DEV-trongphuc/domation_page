import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PREFIX = 'enc:v1:';

function deriveAesKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(`turnio-rag-v1:${secret}`, 'utf8').digest();
}

export function sealApiKey(plainKey: string, cipherSecret: string): string {
  const key = deriveAesKey(cipherSecret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainKey.trim(), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function unsealApiKey(sealedPayload: string, cipherSecret: string): string {
  if (!sealedPayload.startsWith(PREFIX)) {
    throw new Error('Invalid encrypted API key envelope format.');
  }
  const parts = sealedPayload.slice(PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted API key envelope.');
  }
  const [ivB64, tagB64, dataB64] = parts;
  const key = deriveAesKey(cipherSecret);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8').trim();
}

function readLocalEnvMap(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const file of ['.env', '.env.local']) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) {
        result[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
      }
    }
  }
  return result;
}

export function resolveServerApiKey(explicitKey?: string): string {
  if (explicitKey && explicitKey.trim()) {
    const candidate = explicitKey.trim();
    if (candidate.startsWith(PREFIX)) {
      const secret = process.env.GEMINI_CIPHER_SECRET || readLocalEnvMap().GEMINI_CIPHER_SECRET || '';
      if (!secret) throw new Error('Missing GEMINI_CIPHER_SECRET for encrypted API key.');
      return unsealApiKey(candidate, secret);
    }
    return candidate;
  }

  const localEnv = readLocalEnvMap();
  const encKey = process.env.GEMINI_API_KEY_ENC || localEnv.GEMINI_API_KEY_ENC || '';
  const cipherSecret = process.env.GEMINI_CIPHER_SECRET || localEnv.GEMINI_CIPHER_SECRET || '';

  if (encKey && cipherSecret) {
    return unsealApiKey(encKey, cipherSecret);
  }

  const plainKey = process.env.GEMINI_API_KEY || localEnv.GEMINI_API_KEY || '';
  if (plainKey.startsWith(PREFIX) && cipherSecret) {
    return unsealApiKey(plainKey, cipherSecret);
  }
  return plainKey;
}

export function scrubSecrets(text: string): string {
  return text
    .replace(/AQ\.[A-Za-z0-9._-]{10,}/g, '[REDACTED_KEY]')
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, '[REDACTED_KEY]')
    .replace(/enc:v1:[A-Za-z0-9+/=:-]{16,}/g, '[REDACTED_SEALED]');
}
