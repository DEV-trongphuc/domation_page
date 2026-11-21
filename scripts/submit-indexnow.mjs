import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOST_ALL_ARTICLES } from '../src/data/boostArticlesAllServer.ts';
import {
  getDripScheduleSummary,
  getPublishedBatchForDate,
  getVietnamTodayIso,
} from '../src/data/publishSchedule.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SITE_HOST = 'domation.net';
const SITE_URL = `https://${SITE_HOST}`;
const INDEXNOW_KEY = 'd0a710e94c8b2f5a63e190b4c8d72e11';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');
const KEY_FILE_PATH = path.join(ROOT, 'public', `${INDEXNOW_KEY}.txt`);

const isDryRun = process.argv.includes('--dry-run');
const submitAllPublished = process.argv.includes('--all-published');

if (!fs.existsSync(KEY_FILE_PATH)) {
  throw new Error(`Missing IndexNow verification key file at: ${KEY_FILE_PATH}`);
}
if (!fs.existsSync(SITEMAP_PATH)) {
  throw new Error(`Missing sitemap.xml at: ${SITEMAP_PATH}. Run "npm run seo:generate" first.`);
}

const today = getVietnamTodayIso();
const summary = getDripScheduleSummary(BOOST_ALL_ARTICLES, today);
const todayBatch = getPublishedBatchForDate(BOOST_ALL_ARTICLES, today);

let urlList = [];
if (submitAllPublished) {
  const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const locMatches = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)];
  urlList = Array.from(new Set(locMatches.map((m) => m[1].trim()).filter(Boolean)));
} else {
  if (todayBatch.length === 0) {
    console.log(
      `[IndexNow Drip] No new scheduled batch for ${today} (published: ${summary.publishedCount}/${summary.totalCount}, scheduled: ${summary.scheduledCount}). Skipping submission cleanly.`
    );
    process.exit(0);
  }
  urlList = [
    `${SITE_URL}/boost`,
    ...todayBatch.map((art) => `${SITE_URL}/boost/${art.slug}`),
  ];
}

if (urlList.length === 0) {
  throw new Error('No URLs resolved for IndexNow submission.');
}

const payload = {
  host: SITE_HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

console.log(
  `[IndexNow Drip] Prepared ${urlList.length} URLs for ${today} (${submitAllPublished ? 'all published sitemap URLs' : 'today daily batch of 15 max'}, keyLocation: ${KEY_LOCATION}).`
);

if (isDryRun) {
  console.log('[DRY RUN] Queued URLs:', urlList);
  process.exit(0);
}

// Verify live key file is deployed before submitting to IndexNow endpoints
const keyCheckRes = await fetch(KEY_LOCATION, { method: 'GET' }).catch(() => null);
const keyCheckBody = keyCheckRes && keyCheckRes.ok ? (await keyCheckRes.text()).trim() : '';

if (keyCheckBody !== INDEXNOW_KEY) {
  console.error(
    `[BLOCKED] Live verification file ${KEY_LOCATION} is not serving "${INDEXNOW_KEY}" yet (status=${keyCheckRes?.status ?? 'network_error'}). Deploy public/${INDEXNOW_KEY}.txt to ${SITE_HOST} first, then re-run "npm run seo:index".`
  );
  process.exit(2);
}

const endpoints = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

let anySucceeded = false;
for (const endpoint of endpoints) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`[IndexNow] ${endpoint} -> HTTP ${res.status}${text ? ` | ${text.slice(0, 160)}` : ''}`);
    if (res.status >= 200 && res.status < 300) {
      anySucceeded = true;
    }
  } catch (err) {
    console.warn(`[IndexNow] ${endpoint} -> failed:`, err instanceof Error ? err.message : String(err));
  }
}

if (!anySucceeded) {
  process.exitCode = 1;
}
