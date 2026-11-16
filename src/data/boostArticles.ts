import { BOOST_ARTICLES_PART_1 } from './boostArticlesPart1';
import { BOOST_ARTICLES_PART_2 } from './boostArticlesPart2';
import type { BoostArticle } from './boostTypes';

export const BOOST_ARTICLES: BoostArticle[] = [
  ...BOOST_ARTICLES_PART_1,
  ...BOOST_ARTICLES_PART_2,
];

export function getArticleBySlug(slug: string): BoostArticle | undefined {
  const normalized = slug.replace(/^\/+|\/+$/g, '');
  return BOOST_ARTICLES.find((art) => art.slug === normalized);
}

export function getRelatedArticles(article: BoostArticle, limit = 3): BoostArticle[] {
  const samePillarOrIndustry = BOOST_ARTICLES.filter(
    (item) =>
      item.slug !== article.slug &&
      (item.pillar === article.pillar || item.industry === article.industry)
  );
  const others = BOOST_ARTICLES.filter(
    (item) =>
      item.slug !== article.slug &&
      item.pillar !== article.pillar &&
      item.industry !== article.industry
  );
  return [...samePillarOrIndustry, ...others].slice(0, limit);
}
