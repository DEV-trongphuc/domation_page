import { BOOST_ARTICLES_PART_1 } from './boostArticlesPart1.ts';
import { BOOST_ARTICLES_PART_2 } from './boostArticlesPart2.ts';
import { BOOST_ARTICLES_PART_3 } from './boostArticlesPart3.ts';
import { BOOST_ARTICLES_PART_4 } from './boostArticlesPart4.ts';
import { BOOST_ARTICLES_PART_5 } from './boostArticlesPart5.ts';
import { BOOST_SHARD_01 } from './articles/shard01_enterprise_pain_ops.ts';
import { BOOST_SHARD_02 } from './articles/shard02_enterprise_pain_growth.ts';
import { BOOST_SHARD_03 } from './articles/shard03_ai_data_pipeline_a.ts';
import { BOOST_SHARD_04 } from './articles/shard04_ai_data_rag_evals.ts';
import { BOOST_SHARD_05 } from './articles/shard05_ai_data_bi_ops.ts';
import { BOOST_SHARD_06 } from './articles/shard06_ai_security_owasp.ts';
import { BOOST_SHARD_07 } from './articles/shard07_ai_security_privacy.ts';
import { BOOST_SHARD_08 } from './articles/shard08_ai_security_ip_zerotrust.ts';
import { BOOST_SHARD_09 } from './articles/shard09_github_vibecode_agents.ts';
import { BOOST_SHARD_10 } from './articles/shard10_github_orchestration_mcp.ts';
import { BOOST_SHARD_11 } from './articles/shard11_github_scrape_rag_mem.ts';
import { BOOST_SHARD_12 } from './articles/shard12_github_inference_guardrails.ts';
import { BOOST_SHARD_13 } from './articles/shard13_github_evals_ops_stack.ts';
import { BOOST_SHARD_14 } from './articles/shard14_models_peer_tier.ts';
import { BOOST_SHARD_15 } from './articles/shard15_mcp_slash_skills.ts';
import type { BoostArticle } from './boostTypes.ts';

/**
 * SERVER / BUILD-TIME ONLY BARREL:
 * Do NOT import this module from client UI components (`SinglePostPage`, `BoostHubPage`, `NotFoundPage`)
 * because it bundles all 222 full article bodies together.
 * Used exclusively by `scripts/generate-seo-assets.mjs`, `lib/viteSeoPrerenderPlugin.ts`, and `scripts/build-boost-catalog.mjs`.
 */
export const BOOST_ALL_SHARD_ENTRIES: { shardId: string; articles: BoostArticle[] }[] = [
  { shardId: 'part1', articles: BOOST_ARTICLES_PART_1 },
  { shardId: 'part2', articles: BOOST_ARTICLES_PART_2 },
  { shardId: 'part3', articles: BOOST_ARTICLES_PART_3 },
  { shardId: 'part4', articles: BOOST_ARTICLES_PART_4 },
  { shardId: 'part5', articles: BOOST_ARTICLES_PART_5 },
  { shardId: 'shard01', articles: BOOST_SHARD_01 },
  { shardId: 'shard02', articles: BOOST_SHARD_02 },
  { shardId: 'shard03', articles: BOOST_SHARD_03 },
  { shardId: 'shard04', articles: BOOST_SHARD_04 },
  { shardId: 'shard05', articles: BOOST_SHARD_05 },
  { shardId: 'shard06', articles: BOOST_SHARD_06 },
  { shardId: 'shard07', articles: BOOST_SHARD_07 },
  { shardId: 'shard08', articles: BOOST_SHARD_08 },
  { shardId: 'shard09', articles: BOOST_SHARD_09 },
  { shardId: 'shard10', articles: BOOST_SHARD_10 },
  { shardId: 'shard11', articles: BOOST_SHARD_11 },
  { shardId: 'shard12', articles: BOOST_SHARD_12 },
  { shardId: 'shard13', articles: BOOST_SHARD_13 },
  { shardId: 'shard14', articles: BOOST_SHARD_14 },
  { shardId: 'shard15', articles: BOOST_SHARD_15 },
];

export const BOOST_ALL_ARTICLES: BoostArticle[] = BOOST_ALL_SHARD_ENTRIES.flatMap((entry) =>
  entry.articles.map((art) => (art.shardId ? art : { ...art, shardId: entry.shardId }))
);
