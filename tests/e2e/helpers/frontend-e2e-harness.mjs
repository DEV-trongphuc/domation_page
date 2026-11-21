import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);

export const HELPERS_DIR = import.meta.dirname;
export const E2E_DIR = path.resolve(HELPERS_DIR, '..');
export const LP_ROOT = path.resolve(E2E_DIR, '..', '..');
export const WORKSPACE_PARENT = path.resolve(LP_ROOT, '..');
export const ERP_ROOT = path.join(WORKSPACE_PARENT, 'DOMATION_ERP_FULL');
export const BACKEND_ROOT = path.join(WORKSPACE_PARENT, 'AUTO_DATA_TENANRT');
export const PORTFOLIO_ROOT = path.join(WORKSPACE_PARENT, 'MY_PORTFOLIO');
export const DIST_DIR = path.join(LP_ROOT, 'dist');
export const PORTFOLIO_BASELINE_PATH = path.join(HELPERS_DIR, 'my-portfolio-baseline.json');

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function sha256File(filePath, { normalizeLf = false } = {}) {
  const buf = fs.readFileSync(filePath);
  if (!normalizeLf) {
    return sha256Buffer(buf);
  }
  const normalized = buf.toString('utf8').replace(/\r\n/g, '\n');
  return sha256Buffer(Buffer.from(normalized, 'utf8'));
}

export function compareFilesSha256(fileA, fileB, { normalizeLf = false } = {}) {
  const hashA = sha256File(fileA, { normalizeLf });
  const hashB = sha256File(fileB, { normalizeLf });
  return {
    equal: hashA === hashB,
    hashA,
    hashB,
  };
}

export async function runSubprocess(cmd, args = [], { cwd = LP_ROOT, timeoutMs = 120_000, env } = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
      env: env ? { ...process.env, ...env } : process.env,
    });
    return { exitCode: 0, stdout: stdout ?? '', stderr: stderr ?? '' };
  } catch (err) {
    return {
      exitCode: typeof err.code === 'number' ? err.code : 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message ?? '',
    };
  }
}

export function runGitSync(repoRoot, args = []) {
  return execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'buffer',
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  });
}

export function loadMyPortfolioBaseline(baselinePath = PORTFOLIO_BASELINE_PATH) {
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

export function verifyMyPortfolioInvariance(baselinePath = PORTFOLIO_BASELINE_PATH) {
  const baseline = loadMyPortfolioBaseline(baselinePath);
  const currentHead = runGitSync(PORTFOLIO_ROOT, ['rev-parse', 'HEAD']).toString('utf8').trim();
  const currentPorcelain = runGitSync(PORTFOLIO_ROOT, ['status', '--porcelain'])
    .toString('utf8')
    .split(/\r?\n/)
    .filter(Boolean);
  const currentDiffBuf = runGitSync(PORTFOLIO_ROOT, ['diff']);
  const currentDiffSha256 = sha256Buffer(currentDiffBuf);

  const unexpectedPorcelain = currentPorcelain.filter((line) => !baseline.porcelain.includes(line));
  const missingPorcelain = baseline.porcelain.filter((line) => !currentPorcelain.includes(line));

  return {
    ok:
      currentHead === baseline.head &&
      unexpectedPorcelain.length === 0 &&
      missingPorcelain.length === 0 &&
      currentDiffSha256 === baseline.diffSha256,
    baseline,
    currentHead,
    currentPorcelain,
    unexpectedPorcelain,
    missingPorcelain,
    currentDiffSha256,
    currentDiffBytes: currentDiffBuf.length,
  };
}

export function assertDistExists(distDir = DIST_DIR) {
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(distDir) || !fs.existsSync(indexHtml)) {
    throw new Error(
      `Missing built dist/ directory (${indexHtml}). Run "npm run build" in "${LP_ROOT}" before running preview E2E tests.`
    );
  }
}

export async function startPreviewServer({ requireDist = true } = {}) {
  if (requireDist) {
    assertDistExists(DIST_DIR);
  }

  const viteEntry = path.join(LP_ROOT, 'node_modules', 'vite', 'dist', 'node', 'index.js');
  if (!fs.existsSync(viteEntry)) {
    throw new Error(`Vite runtime not found at "${viteEntry}". Run "npm install" in "${LP_ROOT}".`);
  }

  const { preview } = await import(pathToFileURL(viteEntry).href);
  const server = await preview({
    root: LP_ROOT,
    configFile: false,
    preview: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
      open: false,
    },
  });

  const addr = server.httpServer?.address();
  if (!addr || typeof addr === 'string') {
    await server.close();
    throw new Error('Failed to bind ephemeral port for vite preview server.');
  }

  const baseUrl = `http://127.0.0.1:${addr.port}`;

  async function fetchText(routePath) {
    const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
    const res = await fetch(`${baseUrl}${normalized}`);
    const body = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      url: res.url,
      body,
    };
  }

  async function fetchPrerenderedRoute(routePath) {
    const clean = routePath.split('?')[0].replace(/\/+$/, '') || '/';
    const isFile = clean.includes('.') || clean === '/404';
    const target = clean === '/' || isFile ? clean : `${clean}/`;
    return fetchText(target);
  }

  async function stop() {
    await server.close();
  }

  return {
    baseUrl,
    server,
    fetchText,
    fetchPrerenderedRoute,
    stop,
  };
}

export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function parseAttributes(attrString) {
  const attrs = {};
  const regex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = decodeHtmlEntities(val);
  }
  return attrs;
}

export function extractTitle(html) {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()) : null;
}

export function extractMeta(html) {
  const results = [];
  const regex = /<meta\b([^>]*?)\/?>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const attrs = parseAttributes(match[1]);
    results.push({
      name: attrs.name || null,
      property: attrs.property || null,
      httpEquiv: attrs['http-equiv'] || null,
      content: attrs.content ?? null,
      attrs,
      raw: match[0],
    });
  }
  return results;
}

export function getMetaContent(htmlOrMetas, attrName, attrValue) {
  const metas = Array.isArray(htmlOrMetas) ? htmlOrMetas : extractMeta(htmlOrMetas);
  const key = attrName.toLowerCase();
  const target = attrValue.toLowerCase();
  const found = metas.find((m) => (m.attrs[key] || '').toLowerCase() === target);
  return found ? found.content : null;
}

export function extractLinks(html) {
  const results = [];
  const regex = /<link\b([^>]*?)\/?>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const attrs = parseAttributes(match[1]);
    results.push({
      rel: attrs.rel || null,
      href: attrs.href || null,
      hreflang: attrs.hreflang || null,
      type: attrs.type || null,
      title: attrs.title || null,
      attrs,
      raw: match[0],
    });
  }
  return results;
}

export function extractScripts(html) {
  const results = [];
  const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const attrs = parseAttributes(match[1]);
    results.push({
      src: attrs.src || null,
      type: attrs.type || null,
      async: 'async' in attrs,
      defer: 'defer' in attrs,
      attrs,
      inline: match[2] ?? '',
    });
  }
  return results;
}

export function extractJsonLdGraphs(html) {
  const scripts = extractScripts(html).filter(
    (s) => (s.type || '').toLowerCase() === 'application/ld+json'
  );
  return scripts.map((script) => {
    let parsed = null;
    let error = null;
    try {
      parsed = JSON.parse(script.inline.trim());
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    return {
      dataDomationSeo: script.attrs['data-domation-seo'] === 'true',
      raw: script.inline,
      parsed,
      error,
    };
  });
}

export function stripHtml(html) {
  const withoutScriptsAndStyles = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const textOnly = withoutScriptsAndStyles.replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(textOnly).replace(/\s+/g, ' ').trim();
}

export function extractHeadings(html) {
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const all = [];
  const regex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const level = Number(match[1].slice(1));
    const text = stripHtml(match[2]);
    all.push({ level, text });
  }
  return {
    all,
    h1: all.filter((h) => h.level === 1).map((h) => h.text),
    h2: all.filter((h) => h.level === 2).map((h) => h.text),
    h3: all.filter((h) => h.level === 3).map((h) => h.text),
  };
}

export function extractRootSemanticStructure(html) {
  const rootMatch = html.match(/<div\s+id=["']root["'][^>]*>([\s\S]*?)<\/div>\s*(?:<script|<\/body)/i);
  const rootInner = rootMatch ? rootMatch[1] : '';
  const hasHeader = /<header\b[^>]*>[\s\S]+?<\/header>/i.test(html);
  const hasMain = /<main\b[^>]*>[\s\S]+?<\/main>/i.test(html);
  const hasFooter = /<footer\b[^>]*>[\s\S]+?<\/footer>/i.test(html);
  const headings = extractHeadings(html);
  return {
    hasNonEmptyRoot: stripHtml(rootInner).length > 50,
    hasHeader,
    hasMain,
    hasFooter,
    h1Count: headings.h1.length,
    h1Texts: headings.h1,
    visibleTextLength: stripHtml(html).length,
  };
}

export function parseSitemapXml(xml) {
  const urls = [];
  const urlBlockRegex = /<url\b[^>]*>([\s\S]*?)<\/url>/gi;
  let match;
  while ((match = urlBlockRegex.exec(xml)) !== null) {
    const block = match[1];
    const locMatch = block.match(/<loc>([\s\S]*?)<\/loc>/i);
    const images = [...block.matchAll(/<image:loc>([\s\S]*?)<\/image:loc>/gi)].map((m) =>
      decodeHtmlEntities(m[1].trim())
    );
    if (locMatch) {
      urls.push({
        loc: decodeHtmlEntities(locMatch[1].trim()),
        images,
      });
    }
  }
  return {
    hasXmlDecl: xml.trimStart().startsWith('<?xml'),
    hasUrlset: /<urlset\b[^>]*>/i.test(xml) && /<\/urlset>/i.test(xml),
    urls,
  };
}

export function parseLlmsMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const h1 = lines.find((l) => /^#\s+/.test(l))?.replace(/^#\s+/, '').trim() || null;
  const blockquote = lines.find((l) => /^>\s+/.test(l))?.replace(/^>\s+/, '').trim() || null;
  const sections = [];
  let current = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      current = { heading: h2[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return {
    h1,
    blockquote,
    sections,
    sectionNames: sections.map((s) => s.heading),
  };
}

/**
 * Safely strip TS/JS block and line comments without breaking URLs (https://)
 * inside string/template literals or regex literals.
 */
export function stripTsComments(src) {
  if (!src) return '';
  const out = [];
  const len = src.length;
  let i = 0;
  let state = 'code'; // 'code' | 'sq' | 'dq' | 'tpl' | 'regex' | 'line_comment' | 'block_comment'
  let inRegexCharClass = false;
  let prevNonWs = '';

  const canStartRegexAfter = (ch) =>
    ch === '' || '(=[!,;:?&|{}\n~^+-*%<>'.includes(ch);

  while (i < len) {
    const ch = src[i];
    const next = i + 1 < len ? src[i + 1] : '';

    if (state === 'line_comment') {
      if (ch === '\n' || ch === '\r') {
        state = 'code';
        out.push(ch);
        if (ch === '\n') prevNonWs = '\n';
      }
      i += 1;
      continue;
    }

    if (state === 'block_comment') {
      if (ch === '*' && next === '/') {
        state = 'code';
        out.push('  ');
        i += 2;
      } else {
        out.push(ch === '\n' ? '\n' : ' ');
        i += 1;
      }
      continue;
    }

    if (state === 'sq' || state === 'dq' || state === 'tpl') {
      out.push(ch);
      if (ch === '\\' && i + 1 < len) {
        out.push(next);
        i += 2;
        continue;
      }
      if (
        (state === 'sq' && ch === "'") ||
        (state === 'dq' && ch === '"') ||
        (state === 'tpl' && ch === '`')
      ) {
        state = 'code';
        prevNonWs = ch;
      }
      i += 1;
      continue;
    }

    if (state === 'regex') {
      out.push(ch);
      if (ch === '\\' && i + 1 < len) {
        out.push(next);
        i += 2;
        continue;
      }
      if (ch === '[' && !inRegexCharClass) {
        inRegexCharClass = true;
      } else if (ch === ']' && inRegexCharClass) {
        inRegexCharClass = false;
      } else if (ch === '/' && !inRegexCharClass) {
        state = 'code';
        prevNonWs = '/';
      } else if (ch === '\n') {
        state = 'code';
      }
      i += 1;
      continue;
    }

    // state === 'code'
    if (ch === '/' && next === '/') {
      state = 'line_comment';
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      state = 'block_comment';
      out.push('  ');
      i += 2;
      continue;
    }
    if (ch === "'") {
      state = 'sq';
      out.push(ch);
      i += 1;
      continue;
    }
    if (ch === '"') {
      state = 'dq';
      out.push(ch);
      i += 1;
      continue;
    }
    if (ch === '`') {
      state = 'tpl';
      out.push(ch);
      i += 1;
      continue;
    }
    if (ch === '/' && next !== '/' && next !== '*' && canStartRegexAfter(prevNonWs)) {
      state = 'regex';
      inRegexCharClass = false;
      out.push(ch);
      i += 1;
      continue;
    }

    out.push(ch);
    if (!/\s/.test(ch) || ch === '\n') {
      prevNonWs = ch;
    }
    i += 1;
  }

  return out.join('');
}

export function findPuppeteerEntry() {
  const roots = [LP_ROOT, ERP_ROOT, BACKEND_ROOT];
  const candidates = [
    path.join('node_modules', 'puppeteer', 'lib', 'puppeteer', 'puppeteer.js'),
    path.join('node_modules', 'puppeteer', 'lib', 'esm', 'puppeteer', 'puppeteer.js'),
    path.join('node_modules', 'puppeteer-core', 'lib', 'esm', 'puppeteer', 'puppeteer-core.js'),
  ];
  for (const root of roots) {
    for (const rel of candidates) {
      const full = path.join(root, rel);
      if (fs.existsSync(full)) {
        return full;
      }
    }
  }
  return null;
}

export function findBrowserExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);

  for (const exe of candidates) {
    if (fs.existsSync(exe)) {
      return exe;
    }
  }
  return null;
}

export async function launchHeadlessBrowser(options = {}) {
  const puppeteerEntry = findPuppeteerEntry();
  if (!puppeteerEntry) {
    throw new Error(
      `Puppeteer runtime not found in [${LP_ROOT}, ${ERP_ROOT}, ${BACKEND_ROOT}]`
    );
  }
  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      'No Chrome/Edge executable found on disk (set PUPPETEER_EXECUTABLE_PATH or CHROME_BIN).'
    );
  }

  const puppeteerMod = await import(pathToFileURL(puppeteerEntry).href);
  const puppeteer = puppeteerMod.default ?? puppeteerMod;
  return puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    ...options,
  });
}

export async function withBrowserPage(baseUrl, fn, options = {}) {
  const browser = await launchHeadlessBrowser(options);
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err instanceof Error ? err.message : String(err));
    });
    return await fn({ browser, page, baseUrl, pageErrors });
  } finally {
    await browser.close();
  }
}
