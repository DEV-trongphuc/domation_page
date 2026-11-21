import { BOOST_ALL_ARTICLES } from './boostArticlesAllServer.ts';
import { filterPublishedArticles } from './publishSchedule.ts';
import {
  getBoostHubSeoConfig,
  getPortfolioSeoConfig,
  getSinglePostSeoConfig,
} from './boostRouteSeo.ts';
import type { PageSeoConfig } from '../utils/seoSchema.ts';

/**
 * SERVER / PRERENDER-ONLY MODULE:
 * Used exclusively by `lib/viteSeoPrerenderPlugin.ts`.
 */
export function getAllBoostRouteSeoConfigs(): PageSeoConfig[] {
  const publishedArticles = filterPublishedArticles(BOOST_ALL_ARTICLES);
  return [
    getPortfolioSeoConfig(),
    getBoostHubSeoConfig(),
    ...publishedArticles.map((art) => getSinglePostSeoConfig(art)),
  ];
}
