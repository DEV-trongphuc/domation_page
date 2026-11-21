import { getCatalogSummaryBySlug } from './boostCatalog.ts';
import type { BoostArticle } from './boostTypes.ts';

type ShardLoaderFn = () => Promise<BoostArticle[]>;

const SHARD_LOADERS: Record<string, ShardLoaderFn> = {
  part1: () => import('./boostArticlesPart1.ts').then((m) => m.BOOST_ARTICLES_PART_1),
  part2: () => import('./boostArticlesPart2.ts').then((m) => m.BOOST_ARTICLES_PART_2),
  part3: () => import('./boostArticlesPart3.ts').then((m) => m.BOOST_ARTICLES_PART_3),
  part4: () => import('./boostArticlesPart4.ts').then((m) => m.BOOST_ARTICLES_PART_4),
  part5: () => import('./boostArticlesPart5.ts').then((m) => m.BOOST_ARTICLES_PART_5),
  shard01: () => import('./articles/shard01_enterprise_pain_ops.ts').then((m) => m.BOOST_SHARD_01),
  shard02: () => import('./articles/shard02_enterprise_pain_growth.ts').then((m) => m.BOOST_SHARD_02),
  shard03: () => import('./articles/shard03_ai_data_pipeline_a.ts').then((m) => m.BOOST_SHARD_03),
  shard04: () => import('./articles/shard04_ai_data_rag_evals.ts').then((m) => m.BOOST_SHARD_04),
  shard05: () => import('./articles/shard05_ai_data_bi_ops.ts').then((m) => m.BOOST_SHARD_05),
  shard06: () => import('./articles/shard06_ai_security_owasp.ts').then((m) => m.BOOST_SHARD_06),
  shard07: () => import('./articles/shard07_ai_security_privacy.ts').then((m) => m.BOOST_SHARD_07),
  shard08: () => import('./articles/shard08_ai_security_ip_zerotrust.ts').then((m) => m.BOOST_SHARD_08),
  shard09: () => import('./articles/shard09_github_vibecode_agents.ts').then((m) => m.BOOST_SHARD_09),
  shard10: () => import('./articles/shard10_github_orchestration_mcp.ts').then((m) => m.BOOST_SHARD_10),
  shard11: () => import('./articles/shard11_github_scrape_rag_mem.ts').then((m) => m.BOOST_SHARD_11),
  shard12: () => import('./articles/shard12_github_inference_guardrails.ts').then((m) => m.BOOST_SHARD_12),
  shard13: () => import('./articles/shard13_github_evals_ops_stack.ts').then((m) => m.BOOST_SHARD_13),
  shard14: () => import('./articles/shard14_models_peer_tier.ts').then((m) => m.BOOST_SHARD_14),
  shard15: () => import('./articles/shard15_mcp_slash_skills.ts').then((m) => m.BOOST_SHARD_15),
};

const shardCache = new Map<string, Promise<BoostArticle[]>>();
const slugCache = new Map<string, BoostArticle>();

async function loadShard(shardId: string): Promise<BoostArticle[]> {
  const cached = shardCache.get(shardId);
  if (cached) return cached;
  const loader = SHARD_LOADERS[shardId];
  if (!loader) return [];
  const promise = loader().then((articles) => {
    for (const art of articles) {
      slugCache.set(art.slug, art);
    }
    return articles;
  });
  shardCache.set(shardId, promise);
  return promise;
}

export function getCachedArticleBySlug(slug: string): BoostArticle | undefined {
  const normalized = slug.replace(/^\/+|\/+$/g, '');
  return slugCache.get(normalized);
}

export async function loadArticleBySlug(slug: string): Promise<BoostArticle | undefined> {
  const normalized = slug.replace(/^\/+|\/+$/g, '');
  const memHit = slugCache.get(normalized);
  if (memHit) return memHit;

  const summary = getCatalogSummaryBySlug(normalized);
  if (!summary) return undefined;

  const articles = await loadShard(summary.shardId);
  return articles.find((a) => a.slug === normalized) || slugCache.get(normalized);
}
